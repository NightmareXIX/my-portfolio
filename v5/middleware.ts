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

export function middleware(request: NextRequest) {
  // `Buffer` is Node-only. Next's local edge-runtime simulation polyfills it (so this built and
  // ran fine locally), but Vercel's actual production Edge Runtime does not, and throws
  // MIDDLEWARE_INVOCATION_FAILED on every request. `btoa` is the Web-standard equivalent, and
  // safe here since crypto.randomUUID() is plain ASCII (hex digits + hyphens).
  const nonce = btoa(crypto.randomUUID());

  const csp = [
    "default-src 'self'",
    // 'strict-dynamic' means the nonced loader may pull its own chunks, and host allowlists
    // stop mattering — the nonce is the whole authority. Dev needs 'unsafe-eval' for HMR.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Dev's HMR injects un-nonced <style> tags; production gets the nonce alone.
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    "style-src-attr 'unsafe-inline'",
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
