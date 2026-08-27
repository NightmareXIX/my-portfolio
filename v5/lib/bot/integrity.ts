// Phase 4.4 + 4.5 — request integrity. This is the layer that stops casual `curl` abuse:
// not because an Origin header is unforgeable (it trivially is, from a script), but because
// it removes the zero-effort path and forces anything automated to be deliberate about it.
// The rate limiters handle deliberate.

/** Bytes. A 400-character message plus JSON overhead is well under this. */
export const MAX_BODY_BYTES = 4096;

/** Header the widget would carry a Turnstile token on. Deliberately NOT a body field: */
/** `BodySchema` stays strictly `{ message }`, so L3 keeps rejecting every unknown key. */
export const TURNSTILE_HEADER = "x-turnstile-token";

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

export function allowedOrigins(raw = process.env.ALLOWED_ORIGINS): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => normalizeOrigin(s) ?? s.toLowerCase().replace(/\/+$/, ""));
}

/**
 * `Origin` when present, else the origin of `Referer`. Neither present ⇒ REJECT — that is the
 * bare `curl -X POST` case, and a browser fetch from our own page always sends at least one.
 */
export function originAllowed(headers: Headers, raw = process.env.ALLOWED_ORIGINS): boolean {
  const allow = allowedOrigins(raw);
  if (allow.length === 0) return false; // Unconfigured is not "allow everything".

  const origin = headers.get("origin");
  if (origin) return allow.includes(normalizeOrigin(origin) ?? origin.toLowerCase());

  const referer = headers.get("referer");
  if (referer) {
    const parsed = normalizeOrigin(referer);
    return parsed !== null && allow.includes(parsed);
  }
  return false;
}

/** Cheap pre-read rejection. The real bound is enforced again on the decoded body. */
export function declaredBodyTooLarge(headers: Headers): boolean {
  const length = Number.parseInt(headers.get("content-length") ?? "", 10);
  return Number.isFinite(length) && length > MAX_BODY_BYTES;
}

/* ------------------------------------------------------------------ *
 * Turnstile — built, not enabled
 * ------------------------------------------------------------------ */

export function turnstileEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

/**
 * No keys configured ⇒ skipped entirely, zero cost, zero friction. A challenge on a portfolio
 * chat is friction for no benefit until there is actual abuse; this exists so switching it on
 * is two env vars and a redeploy rather than a code change under pressure.
 */
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
    });
    const body = (await res.json()) as { success?: boolean };
    return body.success === true;
  } catch {
    return false;
  }
}
