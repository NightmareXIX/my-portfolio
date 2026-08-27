import Site from "@/components/Site";
import { presets } from "@/lib/theme";

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
