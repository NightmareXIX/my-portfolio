// Phase 4 unit fixtures: session identity, request integrity, the limit layers' fail-closed
// behaviour, provider error classification, and the canned floor.
//
// Same rule as the Phase 3 suite: ZERO network, zero API keys, offline-runnable. Anything
// needing a live Redis or a live provider is verified against the running dev server instead,
// not mocked into a green tick here.

import { afterEach, describe, expect, it } from "vitest";

import { cannedAnswer, POPULAR_TODAY } from "../canned";
import { flushOutput } from "../guardrails";
import {
  allowedOrigins,
  declaredBodyTooLarge,
  MAX_BODY_BYTES,
  originAllowed,
  turnstileEnabled,
  verifyTurnstile,
} from "../integrity";
import { shouldFailover, statusOf } from "../providers";
import { budgetKey, chatbotEnabled, checkLimits, dailyCap, reserveBudget } from "../ratelimit";
import {
  clientIp,
  COOKIE_NAME,
  hashIp,
  newSessionId,
  readSessionId,
  sessionCookie,
} from "../session";

const ORIGINS = "https://sadnan.dev,http://localhost:3005";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
});

/* ------------------------------------------------------------------ *
 * Session — the cookie is an opaque key, not a credential
 * ------------------------------------------------------------------ */

describe("session id", () => {
  it("is 128 bits of hex", () => {
    expect(newSessionId()).toMatch(/^[0-9a-f]{32}$/);
  });

  it("does not repeat across a large sample", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => newSessionId()));
    expect(ids.size).toBe(2000);
  });

  it("round-trips through a cookie header", () => {
    const id = newSessionId();
    const header = `theme=acid; ${COOKIE_NAME}=${id}; other=1`;
    expect(readSessionId(header)).toBe(id);
  });

  // A client-supplied value must never become a Redis key: `sb:hist:*` would read every
  // session's history, and a 900-char value would be a happy little memory leak.
  it.each([
    ["glob", `${COOKIE_NAME}=*`],
    ["path traversal", `${COOKIE_NAME}=../../admin`],
    ["wrong length", `${COOKIE_NAME}=abc123`],
    ["uppercase hex", `${COOKIE_NAME}=${"A".repeat(32)}`],
    ["injection", `${COOKIE_NAME}=' OR 1=1`],
    ["absent", "theme=acid"],
    ["empty", ""],
  ])("rejects a forged cookie (%s)", (_label, header) => {
    expect(readSessionId(header)).toBeNull();
  });

  it("rejects a null cookie header", () => {
    expect(readSessionId(null)).toBeNull();
  });

  it("is httpOnly + SameSite=Lax, and Secure only over https", () => {
    const id = newSessionId();
    expect(sessionCookie(id, true)).toContain("HttpOnly");
    expect(sessionCookie(id, true)).toContain("SameSite=Lax");
    expect(sessionCookie(id, true)).toContain("Secure");
    expect(sessionCookie(id, false)).not.toContain("Secure");
    expect(sessionCookie(id, true)).toContain("Max-Age=86400");
  });
});

describe("ip hashing", () => {
  it("is deterministic under a fixed salt", async () => {
    process.env.APP_SECRET = "salt-a";
    expect(await hashIp("1.2.3.4")).toBe(await hashIp("1.2.3.4"));
  });

  it("never contains the raw ip", async () => {
    process.env.APP_SECRET = "salt-a";
    const hashed = await hashIp("203.0.113.9");
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
    expect(hashed).not.toContain("203");
    expect(hashed).not.toContain("113");
  });

  // Without the salt this is a 4-billion-entry rainbow table away from plaintext IPv4.
  it("changes completely when the salt changes", async () => {
    process.env.APP_SECRET = "salt-a";
    const a = await hashIp("1.2.3.4");
    process.env.APP_SECRET = "salt-b";
    expect(await hashIp("1.2.3.4")).not.toBe(a);
  });

  it("separates different ips", async () => {
    process.env.APP_SECRET = "salt-a";
    expect(await hashIp("1.2.3.4")).not.toBe(await hashIp("1.2.3.5"));
  });
});

describe("clientIp", () => {
  it("uses x-forwarded-for's first entry when it is all there is", () => {
    expect(clientIp(headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" }))).toBe("9.9.9.9");
  });

  it("falls back to a placeholder with no headers at all", () => {
    expect(clientIp(headers({}))).toBe("unknown");
  });

  // Phase 7 security review: x-forwarded-for is caller-appendable, so a platform-set single
  // value must outrank it — otherwise varying one header buys a fresh rate-limit bucket.
  it("prefers the platform headers over a caller-supplied x-forwarded-for", () => {
    const spoofed = { "x-forwarded-for": "1.2.3.4" };
    expect(clientIp(headers({ ...spoofed, "x-vercel-forwarded-for": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIp(headers({ ...spoofed, "cf-connecting-ip": "8.8.4.4" }))).toBe("8.8.4.4");
    expect(clientIp(headers({ ...spoofed, "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("keeps x-vercel-forwarded-for ahead of the other platform headers", () => {
    expect(
      clientIp(headers({
        "x-vercel-forwarded-for": "8.8.8.8",
        "cf-connecting-ip": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
        "x-forwarded-for": "3.3.3.3",
      })),
    ).toBe("8.8.8.8");
  });

  it("ignores a blank platform header rather than hashing an empty string", () => {
    expect(clientIp(headers({ "x-real-ip": "   ", "x-forwarded-for": "7.7.7.7" }))).toBe("7.7.7.7");
  });
});

/* ------------------------------------------------------------------ *
 * Request integrity
 * ------------------------------------------------------------------ */

describe("origin allowlist", () => {
  it("accepts a configured origin", () => {
    expect(originAllowed(headers({ origin: "http://localhost:3005" }), ORIGINS)).toBe(true);
    expect(originAllowed(headers({ origin: "https://sadnan.dev" }), ORIGINS)).toBe(true);
  });

  it("rejects anything else", () => {
    for (const origin of [
      "https://evil.tld",
      "http://localhost:3006",
      "https://sadnan.dev.evil.tld",
      "null",
      "http://sadnan.dev", // scheme is part of the origin
    ]) {
      expect(originAllowed(headers({ origin }), ORIGINS)).toBe(false);
    }
  });

  // The bare `curl -X POST` case: no Origin, no Referer. This is the whole point of 4.4.
  it("rejects a request carrying neither Origin nor Referer", () => {
    expect(originAllowed(headers({}), ORIGINS)).toBe(false);
  });

  it("falls back to the Referer's origin", () => {
    expect(originAllowed(headers({ referer: "http://localhost:3005/#projects" }), ORIGINS)).toBe(true);
    expect(originAllowed(headers({ referer: "https://evil.tld/page" }), ORIGINS)).toBe(false);
    expect(originAllowed(headers({ referer: "not a url" }), ORIGINS)).toBe(false);
  });

  // Unconfigured must not mean "allow everything" — that is the classic misconfiguration
  // where a forgotten env var silently disables the control.
  it("denies when the allowlist is empty or unset", () => {
    expect(originAllowed(headers({ origin: "https://sadnan.dev" }), "")).toBe(false);
    expect(originAllowed(headers({ origin: "https://sadnan.dev" }), undefined)).toBe(false);
  });

  it("normalises trailing slashes and case in the config", () => {
    expect(allowedOrigins("HTTPS://Sadnan.dev/")).toEqual(["https://sadnan.dev"]);
  });
});

describe("body cap", () => {
  it("rejects an over-declared length", () => {
    expect(declaredBodyTooLarge(headers({ "content-length": String(MAX_BODY_BYTES + 1) }))).toBe(true);
    expect(declaredBodyTooLarge(headers({ "content-length": String(MAX_BODY_BYTES) }))).toBe(false);
  });

  it("does not reject an absent or unparseable length (the byte check does that)", () => {
    expect(declaredBodyTooLarge(headers({}))).toBe(false);
    expect(declaredBodyTooLarge(headers({ "content-length": "banana" }))).toBe(false);
  });
});

describe("turnstile", () => {
  it("is off unless BOTH keys are set", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "";
    process.env.TURNSTILE_SECRET_KEY = "";
    expect(turnstileEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
    expect(turnstileEnabled()).toBe(false);
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(turnstileEnabled()).toBe(true);
  });

  // Disabled means skipped entirely — no fetch, no token requirement, zero friction.
  it("passes every request through while disabled", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "";
    process.env.TURNSTILE_SECRET_KEY = "";
    expect(await verifyTurnstile(null)).toBe(true);
  });

  it("requires a token once enabled", async () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    expect(await verifyTurnstile(null)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * Limit layers
 * ------------------------------------------------------------------ */

describe("kill switch", () => {
  it("is on by default and off only for an explicit false", () => {
    delete process.env.CHATBOT_ENABLED;
    expect(chatbotEnabled()).toBe(true);
    process.env.CHATBOT_ENABLED = "true";
    expect(chatbotEnabled()).toBe(true);
    process.env.CHATBOT_ENABLED = "yes";
    expect(chatbotEnabled()).toBe(true);
    process.env.CHATBOT_ENABLED = "false";
    expect(chatbotEnabled()).toBe(false);
    process.env.CHATBOT_ENABLED = " FALSE ";
    expect(chatbotEnabled()).toBe(false);
  });
});

describe("daily caps", () => {
  it("defaults to 450 gemini / 1000 groq, under each vendor's free tier", () => {
    delete process.env.GLOBAL_DAILY_CAP;
    delete process.env.GROQ_DAILY_CAP;
    expect(dailyCap("gemini")).toBe(450);
    expect(dailyCap("groq")).toBe(1000);
  });

  it("takes an env override but ignores junk", () => {
    process.env.GLOBAL_DAILY_CAP = "12";
    expect(dailyCap("gemini")).toBe(12);
    process.env.GLOBAL_DAILY_CAP = "0";
    expect(dailyCap("gemini")).toBe(450);
    process.env.GLOBAL_DAILY_CAP = "banana";
    expect(dailyCap("gemini")).toBe(450);
  });

  it("keys the counter by UTC day, so the reset boundary is region-independent", () => {
    expect(budgetKey("gemini", new Date("2026-08-27T23:59:00Z"))).toBe("sb:budget:gemini:2026-08-27");
    expect(budgetKey("gemini", new Date("2026-08-28T00:01:00Z"))).toBe("sb:budget:gemini:2026-08-28");
  });
});

// THE counter-intuitive branch. If someone "fixes" the limiter to fail open, this goes red.
describe("redis down ⇒ fail closed", () => {
  it("denies rather than allowing unlimited", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const decision = await checkLimits({ sessionId: "a".repeat(32), hashedIp: "b".repeat(64) });
    expect(decision.ok).toBe(false);
    if (!decision.ok) expect(decision.kind).toBe("infra");
  });

  it("refuses to reserve budget, so no upstream call is made either", async () => {
    expect(await reserveBudget("gemini")).toBe(false);
    expect(await reserveBudget("groq")).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * Provider failover classification
 * ------------------------------------------------------------------ */

describe("statusOf", () => {
  it("reads a status off the common SDK error shapes", () => {
    expect(statusOf(Object.assign(new Error("x"), { status: 429 }))).toBe(429);
    expect(statusOf(Object.assign(new Error("x"), { code: 503 }))).toBe(503);
    expect(statusOf(Object.assign(new Error("x"), { statusCode: 500 }))).toBe(500);
    expect(statusOf(new Error("got 400 INVALID_ARGUMENT"))).toBe(400);
    expect(statusOf(new Error("network unreachable"))).toBeUndefined();
    expect(statusOf(null)).toBeUndefined();
  });
});

describe("failover triggers", () => {
  it("fails over on the cases §9 names — 429 and 5xx", () => {
    for (const status of [429, 500, 502, 503]) {
      expect(shouldFailover(Object.assign(new Error("up"), { status }), false, false)).toBe(true);
    }
  });

  // Deliberately wider than §9: a bad key is 400/403, and that is exactly the outage where
  // failover is worth having.
  it("also fails over on a bad or revoked key", () => {
    for (const status of [400, 401, 403]) {
      expect(shouldFailover(Object.assign(new Error("key"), { status }), false, false)).toBe(true);
    }
  });

  it("fails over on an unclassifiable network error", () => {
    expect(shouldFailover(new Error("fetch failed"), false, false)).toBe(true);
  });

  // Retrying a slow leg on a second provider just makes the visitor wait twice as long.
  it("does NOT fail over on our own timeout", () => {
    expect(shouldFailover(new Error("aborted"), true, false)).toBe(false);
  });

  it("does NOT fail over when the client has already walked away", () => {
    expect(shouldFailover(new Error("aborted"), false, true)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * The canned floor
 * ------------------------------------------------------------------ */

describe("canned answers", () => {
  it("always answers something", () => {
    for (const q of ["", "asdfgh", "what's his stack?", "tell me about the icpc thing"]) {
      expect(cannedAnswer(q).length).toBeGreaterThan(20);
    }
  });

  it("routes common questions to the right section", () => {
    expect(cannedAnswer("what's his stack?")).toContain("[[nav:skills]]");
    expect(cannedAnswer("codeforces rating?")).toContain("[[nav:contest]]");
    expect(cannedAnswer("what has he built?")).toContain("[[nav:projects]]");
    expect(cannedAnswer("can i get his resume")).toContain("[[resume]]");
    expect(cannedAnswer("how do i contact him")).toContain("[[contact:email]]");
    expect(cannedAnswer("where did he study")).toContain("[[nav:education]]");
    expect(cannedAnswer("blah blah")).toContain("[[nav:about]]");
  });

  // The degraded path must not quietly break the one HARD RULE in knowledge.ts.
  it("keeps the .NET tiering rule on the degraded path", () => {
    for (const q of ["is he a .NET dev?", "does he know c#", "asp.net experience?"]) {
      const answer = cannedAnswer(q);
      expect(answer).toContain("node and fastapi are where he actually lives");
      expect(answer).toContain("[[nav:projects]]");
    }
  });

  it("carries the circuit-breaker line when the global cap tripped", () => {
    expect(cannedAnswer("what's his stack?", POPULAR_TODAY)).toContain("popular today");
  });

  // The degraded path goes through the same L4 scrub as a model reply, so it must survive it
  // with its action token intact and without leaking a URL.
  it("survives the L4 scrub with its token intact and no URL", () => {
    for (const q of ["stack", "contact", "resume", "nonsense"]) {
      const scrubbed = flushOutput(cannedAnswer(q, POPULAR_TODAY));
      expect(scrubbed).toMatch(/\[\[[a-z:]+\]\]/);
      for (const banned of ["http://", "https://", "www.", "mailto:", "@gmail"]) {
        expect(scrubbed).not.toContain(banned);
      }
    }
  });

  // No fabricated metrics — the numbers here must be the ones in knowledge.ts.
  it("quotes only real numbers", () => {
    expect(cannedAnswer("codeforces")).toContain("1584");
    expect(cannedAnswer("codeforces")).toContain("48th out of 310+");
    expect(cannedAnswer("cgpa")).toContain("3.60/4.00");
  });
});
