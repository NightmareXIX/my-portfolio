import Site from "@/components/Site";

// The CSP in `middleware.ts` carries a per-request nonce, and Next can only stamp that nonce
// onto its script tags while it is rendering per request. A statically prerendered page is
// baked with no nonce at all, so a nonce'd `script-src 'strict-dynamic'` would block every
// script and serve a blank page. Rendering dynamically is the price of not falling back to
// `script-src 'unsafe-inline'` — see CHATBOT_PLAN §10 and PHASE-7 7.1.
export const dynamic = "force-dynamic";

export default function Home() {
  return <Site />;
}
