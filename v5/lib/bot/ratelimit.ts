// The five limit layers from CHATBOT_PLAN §9, in the order the route applies them.
//
//   0. Kill switch          CHATBOT_ENABLED=false      instant off, no redeploy
//   1. Per-session burst    4 / 30s     sliding window, key = session cookie
//   2. Per-IP session       12 / 30min  sliding window, key = hashed IP
//   3. Per-IP daily         20 / 24h    fixed window,   key = hashed IP
//   4. Global circuit break 450 / 24h   counter, per provider, per UTC day
//
// ─────────────────────────────────────────────────────────────────────────────
// REDIS DOWN ⇒ DENY. This is the counter-intuitive branch, so it is stated loudly:
// when Upstash is unreachable we refuse the request instead of waving it through.
// The instinct ("don't let a cache outage break the feature") is exactly backwards here.
// The limiter is not a nice-to-have — it is the only thing standing between a scraper and a
// 500-request/day quota that is shared by every visitor. Failing open converts a Redis blip
// into a drained daily budget and, past that, a bill. Failing closed costs a few visitors a
// polite "brain's rebooting" line for the length of the outage. Do not "fix" this.
// ─────────────────────────────────────────────────────────────────────────────

import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "./redis";

export type LimitKind = "disabled" | "burst" | "ip-session" | "ip-daily" | "infra";

export type LimitDecision = { ok: true } | { ok: false; kind: LimitKind; text: string };

/** Every rejection speaks in character. The widget renders it as an ordinary bot reply. */
export const LIMIT_TEXT: Record<LimitKind, string> = {
  disabled: "i'm off the clock right now 😴 the site's still here though — scroll around, the projects speak for themselves.",
  burst: "okay slow down 😭 you're typing faster than i can hype. give me like half a minute and come back.",
  "ip-session": "we've been at this a while and i need a breather 🫠 come back in half an hour and i'll go again.",
  "ip-daily": "you have officially maxed out your daily Sadnan lore 😤 come back tomorrow, or just email him — he answers.",
  infra: "my brain's rebooting 😵‍💫 give it a minute and try again.",
};

/** Layer 0. Checked before anything else, including the origin check. */
export function chatbotEnabled(): boolean {
  return (process.env.CHATBOT_ENABLED ?? "true").trim().toLowerCase() !== "false";
}

/* ------------------------------------------------------------------ *
 * Layers 1-3
 * ------------------------------------------------------------------ */

// NOTE — `Ratelimit` enables an in-memory `ephemeralCache` by default, and we keep it. Once a
// key is denied, the isolate remembers the reset timestamp and refuses subsequent requests
// without a Redis round-trip. That is the behaviour you want (a hammering client stops costing
// Upstash commands), but it surprises you while testing: clearing the Redis keys does NOT
// un-block a tripped limiter, because the block is also held in isolate memory until its reset
// time. Restart the dev server if you need a clean slate.
type Limiters = { burst: Ratelimit; ipSession: Ratelimit; ipDaily: Ratelimit };

let limiters: Limiters | null = null;

function build(): Limiters | null {
  if (limiters) return limiters;
  const client = redis();
  if (!client) return null;
  limiters = {
    burst: new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(4, "30 s"),
      prefix: "sb:rl:burst",
      analytics: false,
    }),
    ipSession: new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(12, "30 m"),
      prefix: "sb:rl:ipsession",
      analytics: false,
    }),
    ipDaily: new Ratelimit({
      redis: client,
      // Fixed rather than sliding: the daily allowance is meant to reset on a wall-clock
      // boundary, so "come back tomorrow" is a promise the limiter actually keeps.
      limiter: Ratelimit.fixedWindow(20, "24 h"),
      prefix: "sb:rl:ipdaily",
      analytics: false,
    }),
  };
  return limiters;
}

/**
 * Runs all three keyed layers. Order is cheapest-blast-radius first: the burst layer catches
 * the common case (someone mashing enter) without consuming the day's allowance.
 */
export async function checkLimits(input: {
  sessionId: string;
  hashedIp: string;
}): Promise<LimitDecision> {
  const rl = build();
  if (!rl) return { ok: false, kind: "infra", text: LIMIT_TEXT.infra }; // fail closed — see header.

  try {
    const burst = await rl.burst.limit(input.sessionId);
    if (!burst.success) return { ok: false, kind: "burst", text: LIMIT_TEXT.burst };

    const ipSession = await rl.ipSession.limit(input.hashedIp);
    if (!ipSession.success) return { ok: false, kind: "ip-session", text: LIMIT_TEXT["ip-session"] };

    const ipDaily = await rl.ipDaily.limit(input.hashedIp);
    if (!ipDaily.success) return { ok: false, kind: "ip-daily", text: LIMIT_TEXT["ip-daily"] };

    return { ok: true };
  } catch {
    return { ok: false, kind: "infra", text: LIMIT_TEXT.infra }; // fail closed — see header.
  }
}

/* ------------------------------------------------------------------ *
 * Layer 4 — the global circuit breaker
 * ------------------------------------------------------------------ */

/**
 * Site-wide daily ceiling per provider, sitting BELOW the vendor's own quota so we degrade
 * into our own canned answers instead of taking a 429 from Google. Gemini's cap comes from
 * `GLOBAL_DAILY_CAP` (450, under the free tier's 500); Groq's from `GROQ_DAILY_CAP`
 * (1000, its verified free-tier ceiling).
 */
export function dailyCap(provider: string): number {
  const raw = provider === "groq" ? process.env.GROQ_DAILY_CAP : process.env.GLOBAL_DAILY_CAP;
  const parsed = Number.parseInt((raw ?? "").trim(), 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return provider === "groq" ? 1000 : 450;
}

/** UTC day, so the reset boundary does not move with the deploy region. */
export function budgetKey(provider: string, now = new Date()): string {
  return `sb:budget:${provider}:${now.toISOString().slice(0, 10)}`;
}

/**
 * Reserve one call against a provider's daily budget. INCR-then-compare, so it is atomic
 * across concurrent edge isolates — a read-then-write would let a burst punch through the cap.
 *
 * The reservation is taken BEFORE the upstream call. A failed call therefore still costs a
 * slot: deliberate, because a 5xx from Gemini usually still counted against Google's quota,
 * and over-counting is the safe direction for a circuit breaker.
 */
export async function reserveBudget(provider: string): Promise<boolean> {
  const client = redis();
  if (!client) return false; // fail closed — see header.
  const key = budgetKey(provider);
  try {
    const used = await client.incr(key);
    // Only the first increment of the day needs a TTL; setting it every time would push the
    // expiry forward forever and the counter would never reset.
    if (used === 1) await client.expire(key, 60 * 60 * 25);
    return used <= dailyCap(provider);
  } catch {
    return false; // fail closed — see header.
  }
}
