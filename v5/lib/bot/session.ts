// Session identity and server-side history.
//
// THIS IS NOT AUTHENTICATION. The cookie is an opaque 128-bit random id whose only jobs are
// (a) keying the per-session rate limiter and (b) keying 24h of conversation history in Redis.
// It grants nothing, carries no PII, and forging one buys an attacker exactly one fresh
// rate-limit bucket — which is why the per-IP layers exist above it.

import type { Turn } from "./types";
import { redis } from "./redis";

export const COOKIE_NAME = "sb_sid";
export const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h, matching the history TTL.

/** Conversation turns kept. A "turn" is one user message + one bot reply, so 6 = 12 entries. */
export const HISTORY_TURNS = 6;

const SESSION_ID_RE = /^[0-9a-f]{32}$/;

/** 128 bits of CSPRNG, hex. Opaque: nothing is derivable from it. */
export function newSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Read our cookie out of the request. Anything not matching the exact shape we mint is
 * treated as absent — a client-supplied `sb_sid=*` must never become a Redis key.
 */
export function readSessionId(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== COOKIE_NAME) continue;
    const value = part.slice(eq + 1).trim();
    return SESSION_ID_RE.test(value) ? value : null;
  }
  return null;
}

/**
 * `Secure` is conditional on the request actually being HTTPS. Setting it unconditionally
 * would make the cookie undeliverable over plain-http `localhost:3005` in some browsers, and
 * a session that never sticks silently disables both history and the per-session limiter.
 * Production is HTTPS on Vercel, so there the flag is always on.
 */
export function sessionCookie(id: string, secure: boolean): string {
  return [
    `${COOKIE_NAME}=${id}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/* ------------------------------------------------------------------ *
 * IP hashing
 * ------------------------------------------------------------------ */

/**
 * Best-effort client IP from the proxy headers. Never stored or logged raw.
 *
 * ORDER MATTERS, and it is the opposite of the obvious one. `x-forwarded-for` is a LIST that
 * a proxy appends to, so when a request arrives carrying one already, its leftmost entry is a
 * value the caller wrote — trusting it first hands an abuser a fresh rate-limit bucket per
 * request just by varying a header. The single-value headers below are set by the platform
 * on the edge and cannot be forged by the client, so each is preferred over the list, and
 * `x-forwarded-for` is the last resort rather than the first choice.
 *
 * The global circuit breaker bounds the damage either way (a spoofer can spend the site's
 * daily budget but never exceed it), but the per-IP layers are what stop ONE visitor spending
 * everyone else's, and those are only as good as this function.
 */
export function clientIp(headers: Headers): string {
  const trusted =
    headers.get("x-vercel-forwarded-for") ??
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip");
  if (trusted?.trim()) return trusted.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return "unknown";
}

/**
 * SHA-256(ip + APP_SECRET). Raw IPs are personal data under GDPR; the salt costs one hash and
 * removes the question entirely. Salting (rather than a bare hash) is what stops someone with
 * the log file from rainbow-tabling the whole IPv4 space back to plaintext.
 */
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.APP_SECRET ?? "";
  const data = new TextEncoder().encode(`${ip}${salt}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------------ *
 * History
 * ------------------------------------------------------------------ */

const historyKey = (sessionId: string) => `sb:hist:${sessionId}`;

function isTurn(value: unknown): value is Turn {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (t.role === "user" || t.role === "model") && typeof t.text === "string";
}

/**
 * History is stored server-side and ONLY server-side. The request body carries `{ message }`
 * and nothing else (see `BodySchema`) precisely so a client can never forge a prior assistant
 * turn in which the bot "already agreed" to break character.
 *
 * A read failure returns [] rather than throwing: losing context degrades one reply, and by
 * the time we get here the fail-closed rate-limit check has already proven Redis is reachable.
 */
export async function loadHistory(sessionId: string): Promise<Turn[]> {
  const client = redis();
  if (!client) return [];
  try {
    const raw = await client.get<unknown>(historyKey(sessionId));
    if (!Array.isArray(raw)) return [];
    return raw.filter(isTurn).slice(-HISTORY_TURNS * 2);
  } catch {
    return [];
  }
}

/**
 * Append one completed exchange and re-set the 24h TTL, so history expires 24h after the LAST
 * message rather than the first. Trimmed to the last `HISTORY_TURNS` pairs — both a token
 * budget and a privacy bound.
 */
export async function appendTurn(sessionId: string, user: string, bot: string): Promise<void> {
  const client = redis();
  if (!client) return;
  try {
    const prior = await loadHistory(sessionId);
    const next: Turn[] = [
      ...prior,
      { role: "user", text: user } as Turn,
      { role: "model", text: bot } as Turn,
    ].slice(-HISTORY_TURNS * 2);
    await client.set(historyKey(sessionId), next, { ex: SESSION_TTL_SECONDS });
  } catch {
    /* history is best-effort; never fail a served reply over it */
  }
}
