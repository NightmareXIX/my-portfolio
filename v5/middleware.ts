// Per-request CSP nonce (CHATBOT_PLAN §10, Phase 7.1).
//
// WHY MIDDLEWARE: the policy has to carry a fresh nonce on every response, so it cannot live
// in `next.config.mjs`, whose headers are fixed at build time. Next reads the nonce back off
// the request header it sees here and stamps it onto its own bootstrap/chunk-loader scripts.
//
// The two accommodations CHATBOT_PLAN §10 predicted, and what each one actually needed:
//
//   1. `next/font` (JetBrains Mono) — self-hosted at build time into /_next/static/media, so
//      `font-src 'self'` is enough and no Google origin appears here. What it does need is a
//      nonce on the <style> element carrying its @font-face block, which Next applies for us.
//   2. Inline STYLE ATTRIBUTES — `style-src` nonces do not cover `style="..."` attributes, and
//      ThemeContext renders the entire live palette as one on `.theme-root`. Without
//      `style-src-attr 'unsafe-inline'` every palette variable is dropped and the site loads
//      unthemed. A style attribute cannot execute script, so this is a narrow, deliberate
//      exception — `script-src` keeps no 'unsafe-inline' of any kind.

import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

// The directives that do not depend on a nonce. Both policies below are built from this list,
// so they can never drift apart.
const staticDirectives = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // The chat route is same-origin. Dev also talks to the HMR websocket.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
];

// The degraded policy used only on the fail-open path below. Next's bootstrap scripts are inline
// and un-nonced once nonce generation is out of the picture, so they need 'unsafe-inline' — the
// rest of the policy is unchanged. Strictly worse than the nonced one, strictly better than none.
const fallbackCsp = [
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  ...staticDirectives,
].join("; ");

export function middleware(request: NextRequest) {
  try {
    return withNonceCsp(request);
  } catch {
    // FAIL OPEN. A middleware that throws takes the whole site down with a Vercel
    // MIDDLEWARE_INVOCATION_FAILED 500 — every route, no HTML, no way in. A nonce is not worth
    // that, so anything unexpected in here degrades the POLICY instead of the SITE.
    try {
      const response = NextResponse.next();
      response.headers.set("Content-Security-Policy", fallbackCsp);
      return response;
    } catch {
      // NextResponse itself is unusable — nothing left to do but let the request through
      // un-headered. Next's adapter turns `undefined` into a plain pass-through.
      return undefined;
    }
  }
}

// `btoa` over `Buffer.from(...).toString("base64")`: both work (Next polyfills Buffer into the
// edge bundle), but btoa is the Web-standard one and carries no Node baggage into the isolate.
// crypto.randomUUID() is plain ASCII, so btoa is safe on it.
function withNonceCsp(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());

  const csp = [
    // 'strict-dynamic' means the nonced loader may pull its own chunks, and host allowlists
    // stop mattering — the nonce is the whole authority. Dev needs 'unsafe-eval' for HMR.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Dev's HMR injects un-nonced <style> tags; production gets the nonce alone.
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    "style-src-attr 'unsafe-inline'",
    ...staticDirectives,
  ].join("; ");

  // Next reads `x-nonce` off the request to nonce its own script tags.
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Everything except Next's own immutable static output and the public files, which are
  // served straight from the CDN and carry no inline anything.
  //
  // This used to also carry a `missing:` condition skipping prefetch requests — valid Next.js
  // API, but Vercel's build-platform matcher validator (older/stricter than Next's own) only
  // accepts a plain string or string[], not the object form. Dropping it just means prefetch
  // requests also get a nonce stamped on them, which is thrown away unused — no behavior change
  // for a rendered page.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/|portrait.jpg|resume.pdf).*)"],
};
