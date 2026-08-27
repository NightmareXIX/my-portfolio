/** @type {import('next').NextConfig} */

// Static security headers. The Content-Security-Policy is NOT here:
// it carries a per-request nonce and is set in `middleware.ts`, because a value in this file
// is baked at build time and a nonce that never changes is not a nonce.
const securityHeaders = [
  // Two years, subdomains included, preload-eligible. Ignored by browsers over plain http,
  // so it costs nothing on localhost.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Belt to the CSP's `frame-ancestors 'none'` braces, for anything that predates CSP2.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing on this site uses a device API, so every one of them is denied outright.
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()", "autoplay=()", "camera=()", "display-capture=()",
      "encrypted-media=()", "fullscreen=(self)", "geolocation=()", "gyroscope=()",
      "magnetometer=()", "microphone=()", "midi=()", "payment=()", "picture-in-picture=()",
      "publickey-credentials-get=()", "screen-wake-lock=()", "usb=()", "xr-spatial-tracking=()",
    ].join(", "),
  },
  // The chat route is same-origin only; no cross-origin isolation is needed, but an opener
  // reference from a `_blank` link is worth closing off site-wide.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  // Vercel sends this anyway; making it explicit keeps `next start` honest in a smoke test.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
