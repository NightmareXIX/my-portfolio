// The SSE wire contract between `app/api/chat/route.ts` and `components/Chatbot.tsx`.
// Defined once, imported by both sides. Phases 3/4/6 extend `BotEvent` with new members
// (scrubbed output, rate-limit notices, action tokens) — they never change these three.

/** One `data:` payload on the stream. */
export type BotEvent =
  | { type: "text"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * One stored conversation turn. Lives here rather than in `session.ts` because both the
 * session store (which persists them) and the providers (which replay them) need the shape,
 * and neither should import the other.
 */
export type Turn = { role: "user" | "model"; text: string };

/** Longest message the route accepts, in characters. */
export const MAX_MESSAGE_CHARS = 400;

export const SSE_HEADERS: Record<string, string> = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  // Stops proxies (and `next start`'s) buffering, which would defeat the point.
  "X-Accel-Buffering": "no",
};

/** Serialise one event as a complete SSE frame. */
export function encodeEvent(event: BotEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Parse the payload of a single `data:` line back into an event.
 * Returns null for anything malformed or unrecognised — the client drops those silently
 * rather than trusting a shape it can't name.
 */
export function decodeEvent(data: string): BotEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const e = parsed as Record<string, unknown>;
  if (e.type === "text" && typeof e.delta === "string") return { type: "text", delta: e.delta };
  if (e.type === "done") return { type: "done" };
  if (e.type === "error" && typeof e.message === "string") return { type: "error", message: e.message };
  return null;
}
