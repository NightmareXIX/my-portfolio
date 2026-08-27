// Browser → here → a provider → SSE deltas back.
//
// Phase 3 attached the four guardrail layers:
//   L1 `gateInput`   — before any upstream call, so a blocked request costs zero tokens.
//   L2 system prompt — `lib/bot/prompt.ts`.
//   L3 `BodySchema`  — strict; the client cannot supply conversation history.
//   L4 `scrubOutput` — every chunk, before it leaves the server.
//
// Phase 4 wraps those in the cost and abuse controls (CHATBOT_PLAN §9/§10). Check order is
// deliberate and cheapest-first — every gate below is reached only if the ones above passed:
//
//   0. kill switch          `CHATBOT_ENABLED=false`, instant off, no upstream, no Redis
//   1. Origin/Referer       403, the only bare status code the route ever returns
//   2. body size + shape    413 / 400 / 415
//   3. Turnstile            skipped entirely unless BOTH keys are configured
//   4. session cookie       opaque 128-bit id, minted here if absent
//   5. rate limits          burst / per-IP-session / per-IP-daily — REDIS DOWN ⇒ DENY
//   6. L1 input gate        injection etc., answered canned, no upstream call
//   7. provider legs        budget-reserved in order, failing over to the next
//   8. canned FAQ           the floor: every leg spent or broken, still an answer
//
// Everything from step 4 onward answers with a 200 SSE stream carrying in-character text.
// A rate-limited visitor gets a bot reply, not a 429 the widget has to translate.

import { cannedAnswer, POPULAR_TODAY } from "@/lib/bot/canned";
import { BodySchema, flushOutput, gateInput, scrubOutput } from "@/lib/bot/guardrails";
import {
  declaredBodyTooLarge,
  MAX_BODY_BYTES,
  originAllowed,
  TURNSTILE_HEADER,
  verifyTurnstile,
} from "@/lib/bot/integrity";
import { logChat } from "@/lib/bot/log";
import {
  getProvider,
  providerConfigured,
  PROVIDER_ORDER,
  shouldFailover,
  statusOf,
  type ProviderName,
  type StreamContext,
} from "@/lib/bot/providers";
import { chatbotEnabled, checkLimits, LIMIT_TEXT, reserveBudget } from "@/lib/bot/ratelimit";
import {
  appendTurn,
  clientIp,
  hashIp,
  loadHistory,
  newSessionId,
  readSessionId,
  sessionCookie,
} from "@/lib/bot/session";
import { encodeEvent, SSE_HEADERS, type BotEvent } from "@/lib/bot/types";

export const runtime = "edge";

/** Per provider leg, not per request: a leg that dies at 14s still leaves the next one a full
 *  budget, and the worst case is bounded by leg count × this. */
const LEG_TIMEOUT_MS = 15_000;

const TIMEOUT_MESSAGE = "brain buffering 😵‍💫";

function json(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

/**
 * A canned reply gets a normal-looking SSE stream, not an error status. The widget stays in
 * character and an attacker probing the gates learns nothing from the status line.
 *
 * The text goes through `flushOutput` — the same L4 scrub a model reply gets — so the one
 * pipeline handles both, and a canned string can never be the thing that ships a stray URL.
 */
function cannedStream(text: string, cookie?: string): Response {
  const encoder = new TextEncoder();
  const body = encodeEvent({ type: "text", delta: flushOutput(text) }) + encodeEvent({ type: "done" });
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(body));
        controller.close();
      },
    }),
    { headers: cookie ? { ...SSE_HEADERS, "Set-Cookie": cookie } : SSE_HEADERS },
  );
}

export async function POST(req: Request): Promise<Response> {
  // 0. Kill switch, first and cheapest. No Redis call, no upstream call, no key read.
  if (!chatbotEnabled()) {
    return cannedStream(LIMIT_TEXT.disabled);
  }

  // 1. Request integrity. The one place a bare status code is right: a cross-origin caller is
  //    not a visitor to be spoken to in character, and 403 is the honest answer.
  if (!originAllowed(req.headers)) {
    return json(403, { error: "forbidden" });
  }

  const mediaType = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return json(415, { error: "content-type must be application/json" });
  }

  // 2. Body cap — the declared length first (free), then the decoded bytes (a lying or absent
  //    Content-Length must not buy an unbounded read).
  if (declaredBodyTooLarge(req.headers)) {
    return json(413, { error: "body too large" });
  }
  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return json(400, { error: "malformed body" });
  }
  if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
    return json(413, { error: "body too large" });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(bodyText);
  } catch {
    return json(400, { error: "malformed json" });
  }

  // L3. Strict: `{ message }` only. A client-supplied `history[]` lands here as a 400.
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(400, { error: "invalid request body" });
  }

  // 3. Turnstile. Reads a HEADER rather than a body field on purpose — `BodySchema` stays
  //    strictly `{ message }`, so enabling the challenge never loosens L3.
  if (!(await verifyTurnstile(req.headers.get(TURNSTILE_HEADER)))) {
    return json(403, { error: "challenge failed" });
  }

  // 4. Session. Not auth — a rate-limit and history key, nothing more.
  const existing = readSessionId(req.headers.get("cookie"));
  const sessionId = existing ?? newSessionId();
  const secure = new URL(req.url).protocol === "https:";
  const cookie = existing ? undefined : sessionCookie(sessionId, secure);

  const hashedIp = await hashIp(clientIp(req.headers));

  // 5. The keyed limit layers. Redis unreachable ⇒ denied, never waved through.
  const limit = await checkLimits({ sessionId, hashedIp });
  if (!limit.ok) {
    logChat({ hashedIp, tokensUsed: 0, blocked: limit.kind });
    return cannedStream(limit.text, cookie);
  }

  // 6. L1. Runs before any provider budget is touched — a blocked request costs zero tokens.
  const gate = gateInput(parsed.data.message);
  if (!gate.ok) {
    logChat({ hashedIp, tokensUsed: 0, blocked: gate.reason });
    return cannedStream(gate.canned, cookie);
  }
  const message = gate.text;

  // History is loaded HERE, server-side, keyed by the cookie. It never round-trips the client.
  const history = await loadHistory(sessionId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The client may have walked away mid-stream; enqueueing into a closed controller
      // throws, and that is not an error worth reporting anywhere.
      const send = (event: BotEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeEvent(event)));
        } catch {
          /* stream already gone */
        }
      };

      let clientGone = false;
      req.signal.addEventListener("abort", () => {
        clientGone = true;
      });

      // ─────────────────────────────────────────────────────────────────────
      // MID-FAILOVER DUPLICATE-OUTPUT POLICY — the choice Phase 4.3 asks to be explicit about.
      //
      // We fail over ONLY while `emitted` is false, i.e. before a single text event has
      // reached the client. Once the visitor has seen words, a failing leg is finished on its
      // partial and the stream is closed cleanly — we never restart, and we never show a
      // reset. Rationale: a restart mid-sentence is the one failure mode that looks like a
      // bug to a recruiter reading the widget, and an answer that stops two sentences in
      // still reads as an answer. `carry` is reset per leg, so text the scrubber was holding
      // back but had not yet emitted is discarded with the leg — held text is by definition
      // text the client never saw, so dropping it cannot duplicate anything.
      // ─────────────────────────────────────────────────────────────────────
      let emitted = false;
      let answer = "";
      let served: ProviderName | null = null;
      let capTripped = false;
      let lastTimedOut = false;
      const ctx: StreamContext = { tokensUsed: 0 };

      for (const name of PROVIDER_ORDER) {
        if (emitted) break;
        if (!providerConfigured(name)) continue;

        // Layer 4, the circuit breaker. A spent budget is not an error — it is this leg being
        // closed for the day, so we move to the next leg exactly as we would on a 429.
        if (!(await reserveBudget(name))) {
          capTripped = true;
          continue;
        }

        const abort = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          abort.abort();
        }, LEG_TIMEOUT_MS);
        const onClientAbort = () => abort.abort();
        req.signal.addEventListener("abort", onClientAbort);

        let carry = "";
        try {
          for await (const delta of getProvider(name).stream(
            { message, history, signal: abort.signal },
            ctx,
          )) {
            // L4. Nothing reaches the client unscrubbed, and `carry` holds back the few chars
            // a URL or an action token could be split across, so a construct cannot slip
            // through a chunk boundary in two individually-clean halves.
            const scrubbed = scrubOutput(delta, carry);
            carry = scrubbed.carry;
            if (scrubbed.safe) {
              emitted = true;
              answer += scrubbed.safe;
              send({ type: "text", delta: scrubbed.safe });
            }
          }
          const tail = flushOutput(carry);
          if (tail) {
            emitted = true;
            answer += tail;
            send({ type: "text", delta: tail });
          }
          if (emitted) served = name;
        } catch (error) {
          lastTimedOut = timedOut;
          // Operator visibility: which leg failed and with what status. Provider + status only
          // — no message content, same rule as `logChat`. Without this a failover is invisible
          // in the logs and the canned floor looks like the bot randomly getting dumber.
          console.warn(
            `[chat] leg ${name} failed (status=${statusOf(error) ?? "n/a"}, timedOut=${timedOut}, emitted=${emitted})`,
          );
          if (emitted) {
            // Partial already on screen: finish on it rather than restarting. See the policy
            // block above.
            served = name;
            break;
          }
          if (!shouldFailover(error, timedOut, clientGone)) break;
          // else: fall through to the next leg with nothing emitted and `carry` discarded.
        } finally {
          clearTimeout(timer);
          req.signal.removeEventListener("abort", onClientAbort);
        }
      }

      try {
        if (!emitted) {
          if (clientGone) {
            // Nobody is listening. Don't spend a canned answer or a log line on it.
          } else if (lastTimedOut) {
            send({ type: "error", message: TIMEOUT_MESSAGE });
            logChat({ hashedIp, tokensUsed: ctx.tokensUsed, blocked: "timeout" });
          } else {
            // 8. The floor. Every leg is spent or broken and we still answer — from the fixed
            //    table, with no model call. `capTripped` distinguishes "we're popular today"
            //    from "something is broken", because those deserve different words.
            const text = cannedAnswer(message, capTripped ? POPULAR_TODAY : undefined);
            send({ type: "text", delta: flushOutput(text) });
            send({ type: "done" });
            logChat({
              hashedIp,
              tokensUsed: 0,
              provider: "canned",
              blocked: capTripped ? "global-cap" : "upstream-down",
            });
          }
        } else {
          send({ type: "done" });
          // Persisted only on a served reply, and only the two strings — no ids, no IP, no
          // headers. 24h TTL, last 6 turns, enforced in `session.ts`.
          await appendTurn(sessionId, message, answer);
          logChat({ hashedIp, tokensUsed: ctx.tokensUsed, provider: served ?? undefined });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  // Note there is no "missing API key ⇒ 500" branch any more: an unconfigured provider is
  // simply a leg that gets skipped, and the canned floor answers instead of the route erroring.
  return new Response(stream, {
    headers: cookie ? { ...SSE_HEADERS, "Set-Cookie": cookie } : SSE_HEADERS,
  });
}

function methodNotAllowed(): Response {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const HEAD = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
