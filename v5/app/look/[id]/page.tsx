import Site from "@/components/Site";
import { presets } from "@/lib/theme";

// The CSP in `middleware.ts` carries a per-request nonce, and Next can only stamp that nonce
// onto its script tags while it is rendering per request. A statically prerendered page is
// baked with no nonce at all, so a nonce'd `script-src 'strict-dynamic'` would block every
// script and serve a blank page. Rendering dynamically is the price of not falling back to
// `script-src 'unsafe-inline'` — see CHATBOT_PLAN §10 and PHASE-7 7.1.
export const dynamic = "force-dynamic";

// Shareable per-version routes: /look/poster, /look/editorial, /look/acid
// (also accepts /look/1, /look/2, /look/3)
const byIndex: Record<string, string> = { "1": "poster", "2": "editorial", "3": "acid" };

export function generateStaticParams() {
  return [...presets.map((p) => ({ id: p.id })), { id: "1" }, { id: "2" }, { id: "3" }];
}

export default function LookPage({ params }: { params: { id: string } }) {
  const id = byIndex[params.id] ?? params.id;
  const preset = presets.find((p) => p.id === id) ? id : "poster";
  return <Site initialPreset={preset} />;
}
