// Phase 4.3 — one interface, two implementations, written SYMMETRICALLY on purpose.
//
// Neither provider is special in this file. The ordering lives in exactly one place:
//
//     export const PROVIDER_ORDER: readonly ProviderName[] = ["gemini", "groq"];
//
// Swapping the primary is that one line. That matters because Groq's verified ceiling is
// 1,000 req/day against Gemini's 500 (CHATBOT_PLAN §9), so "Groq primary" is a plausible
// default, not a hypothetical — and a swap that requires rewriting a stream loop is a swap
// nobody makes at 2am when the Gemini leg is throwing.

import { GoogleGenAI, ThinkingLevel } from "@google/genai";

import { buildSystemPrompt, resolveGlazeLevel } from "./prompt";
import type { Turn } from "./types";

export type ProviderName = "gemini" | "groq";

/** THE one-line switch. First entry is primary; the rest are failover legs, in order. */
export const PROVIDER_ORDER: readonly ProviderName[] = ["gemini", "groq"];

export const MAX_OUTPUT_TOKENS = 320;

export type ProviderRequest = {
  message: string;
  history: Turn[];
  signal: AbortSignal;
};

/** Mutable side-channel for usage reporting, so the delta stream stays a plain `string`. */
export type StreamContext = { tokensUsed: number };

export interface Provider {
  readonly name: ProviderName;
  /** Yields raw text deltas. Throws on upstream failure; the route decides about failover. */
  stream(req: ProviderRequest, ctx: StreamContext): AsyncIterable<string>;
}

/* ------------------------------------------------------------------ *
 * Prompt cache
 * ------------------------------------------------------------------ */

// Per isolate, per provider. Identical bytes on every request is what makes Gemini's implicit
// caching hit, so this must never interpolate anything request-scoped.
const promptCache = new Map<ProviderName, string>();

function systemPrompt(provider: ProviderName): string {
  const hit = promptCache.get(provider);
  if (hit !== undefined) return hit;
  const built = buildSystemPrompt({
    glaze: resolveGlazeLevel(process.env.GLAZE_LEVEL),
    provider,
  });
  promptCache.set(provider, built);
  return built;
}

/* ------------------------------------------------------------------ *
 * Error classification
 * ------------------------------------------------------------------ */

export type UpstreamError = Error & { status?: number };

/** Dig a numeric HTTP status out of whatever shape the SDK threw. */
export function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const e = error as Record<string, unknown>;
  for (const key of ["status", "code", "statusCode"]) {
    const value = e[key];
    if (typeof value === "number" && value >= 100 && value < 600) return value;
  }
  const message = typeof e.message === "string" ? e.message : "";
  const match = /\b(4\d{2}|5\d{2})\b/.exec(message);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

/**
 * Should the route try the next provider?
 *
 * CHATBOT_PLAN §9 names 429 and 5xx. We deliberately go wider and fail over on ANY upstream
 * error that is not a client disconnect: a revoked or mistyped `GEMINI_API_KEY` surfaces as
 * 400/403, and "the key is bad" is precisely the outage where failover earns its keep. The one
 * thing we do NOT fail over on is our own 15s timeout — retrying a slow leg on a second
 * provider just makes the user wait 30s for the same spinner.
 */
export function shouldFailover(error: unknown, timedOut: boolean, clientGone: boolean): boolean {
  if (timedOut || clientGone) return false;
  const status = statusOf(error);
  if (status !== undefined && status >= 200 && status < 400) return false;
  return true;
}

/* ------------------------------------------------------------------ *
 * Gemini
 * ------------------------------------------------------------------ */

const gemini: Provider = {
  name: "gemini",
  async *stream(req, ctx) {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL;
    if (!apiKey || !model) throw new Error("gemini not configured");

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContentStream({
      model,
      contents: [...req.history, { role: "user" as const, text: req.message }].map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      config: {
        abortSignal: req.signal,
        systemInstruction: systemPrompt("gemini"),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // §9 asks for `thinkingBudget: 0`, the Gemini 2.5 spelling; the 3.x family rejects it
        // with INVALID_ARGUMENT and takes `thinkingLevel` instead. MINIMAL is its floor and
        // comes back with thoughtsTokenCount 0 — exactly what budget-0 was buying.
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    for await (const chunk of result) {
      const usage = chunk.usageMetadata?.totalTokenCount;
      if (typeof usage === "number") ctx.tokensUsed = usage;
      const delta = chunk.text;
      if (delta) yield delta;
    }
  },
};

/* ------------------------------------------------------------------ *
 * Groq
 * ------------------------------------------------------------------ */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Raw fetch rather than the OpenAI SDK: one dependency fewer, and this is 40 lines of SSE. */
const groq: Provider = {
  name: "groq",
  async *stream(req, ctx) {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;
    if (!apiKey || !model) throw new Error("groq not configured");

    const res = await fetch(GROQ_URL, {
      method: "POST",
      signal: req.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        stream: true,
        stream_options: { include_usage: true },
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          // Groq gets the terse prompt variant — same facts, same refusal contract, same
          // action-token contract, flatter framing, because gpt-oss follows numbered lists
          // more reliably than the conversational shape Gemini prefers.
          { role: "system", content: systemPrompt("groq") },
          ...req.history.map((turn) => ({
            role: turn.role === "model" ? ("assistant" as const) : ("user" as const),
            content: turn.text,
          })),
          { role: "user" as const, content: req.message },
        ],
      }),
    });

    if (!res.ok || !res.body) {
      const error: UpstreamError = new Error(`groq ${res.status}`);
      error.status = res.status;
      throw error;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "" || payload === "[DONE]") continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue;
          }
          const frameObj = parsed as {
            usage?: { total_tokens?: number };
            choices?: { delta?: { content?: string } }[];
          };
          const usage = frameObj.usage?.total_tokens;
          if (typeof usage === "number") ctx.tokensUsed = usage;
          const delta = frameObj.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) yield delta;
        }
      }
    }
  },
};

/* ------------------------------------------------------------------ *
 * Registry
 * ------------------------------------------------------------------ */

const REGISTRY: Record<ProviderName, Provider> = { gemini, groq };

export function getProvider(name: ProviderName): Provider {
  return REGISTRY[name];
}

/** A leg with no credentials is skipped silently rather than counted as an outage. */
export function providerConfigured(name: ProviderName): boolean {
  return name === "groq"
    ? Boolean(process.env.GROQ_API_KEY && process.env.GROQ_MODEL)
    : Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL);
}

/** Test seam: the prompt is cached per isolate, and tests move GLAZE_LEVEL. */
export function resetPromptCacheForTests(): void {
  promptCache.clear();
}
