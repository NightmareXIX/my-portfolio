// Phase 1 — the pipe. Browser → here → Gemini → SSE deltas back.
// No persona, no guardrails, no rate limiting, no history: those are phases 2, 3 and 4.

import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";

import { encodeEvent, MAX_MESSAGE_CHARS, SSE_HEADERS, type BotEvent } from "@/lib/bot/types";

export const runtime = "edge";

const UPSTREAM_TIMEOUT_MS = 15_000;
const MAX_OUTPUT_TOKENS = 320;

/** User-facing failure text. Never leaks whether it was config, network or upstream. */
const TIMEOUT_MESSAGE = "brain buffering 😵‍💫";
const GENERIC_ERROR = "brain offline for a sec 😵‍💫 try again";

// Placeholder. The real persona, knowledge base and glaze levels are Phase 2 — nothing
// resembling a system prompt should grow here in the meantime.
const SYSTEM_PROMPT =
  "You answer questions about Kazi Fardin Islam's portfolio. Be brief.";

const BodySchema = z.strictObject({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

function json(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(req: Request): Promise<Response> {
  const mediaType = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    return json(415, { error: "content-type must be application/json" });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "malformed json" });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return json(400, { error: "invalid request body" });
  }
  const message = parsed.data.message;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) {
    // Deliberately says nothing about which var is missing, or how long the key is.
    return json(500, { error: GENERIC_ERROR });
  }

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

      const abort = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        abort.abort();
      }, UPSTREAM_TIMEOUT_MS);
      req.signal.addEventListener("abort", () => abort.abort());

      try {
        const ai = new GoogleGenAI({ apiKey });
        const result = await ai.models.generateContentStream({
          model,
          contents: message,
          config: {
            abortSignal: abort.signal,
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            // This model thinks by default; on a "paraphrase a short brief" workload that
            // is latency and tokens spent on nothing. See CHATBOT_PLAN §9.
            //
            // §9 specifies `thinkingBudget: 0`, which is the Gemini 2.5 spelling. This model
            // rejects it with INVALID_ARGUMENT — the 3.x family takes `thinkingLevel` instead,
            // and MINIMAL is its floor. Verified live: MINIMAL comes back with
            // thoughtsTokenCount 0, i.e. exactly what budget-0 was buying.
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        });

        for await (const chunk of result) {
          const delta = chunk.text;
          if (delta) send({ type: "text", delta });
        }
        send({ type: "done" });
      } catch {
        send({ type: "error", message: timedOut ? TIMEOUT_MESSAGE : GENERIC_ERROR });
      } finally {
        clearTimeout(timer);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
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
