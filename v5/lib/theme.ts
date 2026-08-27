// Theme system: palettes, font options, density, and named presets ("looks").
// Everything is expressed as CSS custom properties applied to a root wrapper,
// so the whole page re-skins live from the control panel.

export type Palette = {
  id: string;
  name: string;
  swatch: string[]; // for the control-panel chip
  vars: Record<string, string>;
};

export const palettes: Palette[] = [
  {
    id: "neon",
    name: "Neon Poster",
    swatch: ["#ffd400", "#2b56ff", "#ff2e88"],
    vars: {
      "--bg": "#ffd400",
      "--ink": "#0c0c0c",
      "--card": "#ffffff",
      "--paper": "#fdfbf4",
      "--accent": "#2b56ff",
      "--accent-ink": "#ffffff",
      "--pop": "#ff2e88",
      "--pop-ink": "#ffffff",
      "--head2": "#2b56ff",
      "--sel": "#ffd400",
    },
  },
  {
    id: "editorial",
    name: "Cream / Red / Navy",
    swatch: ["#f0e5cc", "#e23b2e", "#16305e"],
    vars: {
      "--bg": "#f0e5cc",
      "--ink": "#14161a",
      "--card": "#ffffff",
      "--paper": "#efe6d2",
      "--accent": "#e23b2e",
      "--accent-ink": "#fff8f0",
      "--pop": "#16305e",
      "--pop-ink": "#ffffff",
      "--head2": "#e23b2e",
      "--sel": "#e23b2e",
    },
  },
  {
    id: "acid",
    name: "Off-white / Lime / Ink",
    swatch: ["#eef0e9", "#b6f500", "#0c0c0c"],
    vars: {
      "--bg": "#eef0e9",
      "--ink": "#0c0c0c",
      "--card": "#ffffff",
      "--paper": "#f6f7f2",
      "--accent": "#111111",
      "--accent-ink": "#c6ff2e",
      "--pop": "#b6f500",
      "--pop-ink": "#0c0c0c",
      "--head2": "#a4e400",
      "--sel": "#c6ff2e",
    },
  },
  {
    id: "lavender",
    name: "Lavender / Purple / Orange",
    swatch: ["#e7ddff", "#6a2cff", "#ff6a1a"],
    vars: {
      "--bg": "#e7ddff",
      "--ink": "#1a1330",
      "--card": "#ffffff",
      "--paper": "#f1ebff",
      "--accent": "#6a2cff",
      "--accent-ink": "#ffffff",
      "--pop": "#ff6a1a",
      "--pop-ink": "#17110a",
      "--head2": "#6a2cff",
      "--sel": "#6a2cff",
    },
  },
];

export type FontOption = { id: string; name: string; stack: string };

export const dispFonts: FontOption[] = [
  { id: "arial-black", name: "Arial Black", stack: '"Arial Black","Helvetica Neue",Impact,sans-serif' },
  { id: "impact", name: "Impact", stack: 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif' },
  { id: "georgia", name: "Georgia (serif)", stack: 'Georgia,"Times New Roman",serif' },
  { id: "mono-disp", name: "Mono Bold", stack: 'ui-monospace,"Cascadia Code",Consolas,monospace' },
];

export const bodyFonts: FontOption[] = [
  { id: "jetbrains", name: "JetBrains Mono", stack: 'var(--font-jet),ui-monospace,"Cascadia Code",Consolas,monospace' },
  { id: "helvetica", name: "Helvetica", stack: '"Helvetica Neue",Arial,sans-serif' },
  { id: "system", name: "System UI", stack: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' },
  { id: "georgia-body", name: "Georgia", stack: 'Georgia,"Times New Roman",serif' },
];

export const monoFonts: FontOption[] = [
  { id: "jetbrains", name: "JetBrains Mono", stack: 'var(--font-jet),ui-monospace,"Cascadia Code",Consolas,monospace' },
  { id: "cascadia", name: "Cascadia Code", stack: 'ui-monospace,"Cascadia Code",Consolas,monospace' },
  { id: "courier", name: "Courier", stack: '"Courier New",Courier,monospace' },
];

export type ThemeState = {
  palette: string;
  disp: string;
  body: string;
  mono: string;
  fs: number; // font-scale multiplier
  density: "compact" | "comfy";
  bgIcons: boolean;      // doodle-icon backdrop on white/blue bands
  bgIconsOpacity: number; // 0.02 – 0.2
  bgIconsScale: number;   // tile size in px
};

export type Preset = { id: string; name: string; tagline: string; state: ThemeState };

// The 3 "versions" the user asked to compare.
export const presets: Preset[] = [
  {
    id: "poster",
    name: "1 · POSTER",
    tagline: "Loud yellow, Arial Black, tight grid",
    state: { palette: "neon", disp: "arial-black", body: "jetbrains", mono: "jetbrains", fs: 1.0, density: "compact", bgIcons: true, bgIconsOpacity: 0.07, bgIconsScale: 300 },
  },
  {
    id: "editorial",
    name: "2 · EDITORIAL",
    tagline: "Cream + red + navy, serif display, roomier",
    state: { palette: "editorial", disp: "georgia", body: "helvetica", mono: "cascadia", fs: 1.0, density: "comfy", bgIcons: true, bgIconsOpacity: 0.07, bgIconsScale: 300 },
  },
  {
    id: "acid",
    name: "3 · ACID",
    tagline: "Off-white + electric lime, Impact, dense",
    state: { palette: "acid", disp: "impact", body: "system", mono: "cascadia", fs: 1.05, density: "compact", bgIcons: true, bgIconsOpacity: 0.07, bgIconsScale: 300 },
  },
];

export const defaultTheme: ThemeState = presets[0].state;

export function resolveVars(t: ThemeState): Record<string, string> {
  const pal = palettes.find((p) => p.id === t.palette) ?? palettes[0];
  const disp = dispFonts.find((f) => f.id === t.disp) ?? dispFonts[0];
  const body = bodyFonts.find((f) => f.id === t.body) ?? bodyFonts[0];
  const mono = monoFonts.find((f) => f.id === t.mono) ?? monoFonts[0];
  const secPad = t.density === "compact" ? "44px" : "68px";
  const gap = t.density === "compact" ? "16px" : "22px";
  return {
    ...pal.vars,
    "--disp": disp.stack,
    "--body": body.stack,
    "--mono": mono.stack,
    "--fs": String(t.fs),
    "--sec-pad": secPad,
    "--grid-gap": gap,
    "--bg-icons-opacity": t.bgIcons ? String(t.bgIconsOpacity) : "0",
    "--bg-icons-scale": `${t.bgIconsScale}px`,
  };
}
