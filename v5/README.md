# V5 — Neo-Brutalist Poster (Next.js)

Single-page portfolio for **Kazi Fardin Islam (Sadnan)**. Same content and guardrails as the
original static v5 (every number traces to `profile_info/PROFILE.md`; no fabricated
metrics/years/clients), rebuilt as a Next.js 14 (App Router, TypeScript) app with a live
design-tweak panel.

## Run

```bash
cd v5
npm install     # first time only
npm run dev      # http://localhost:3005
```

## The "3 versions"

The three directions are **presets** in the on-page control panel, and also live at their own URLs:

| Preset | URL | Look |
|--------|-----|------|
| 1 · Poster | `/look/1` or `/look/poster` | Loud yellow, Arial Black, tight grid |
| 2 · Editorial | `/look/2` or `/look/editorial` | Cream + red + navy, Georgia serif, roomier |
| 3 · Acid | `/look/3` or `/look/acid` | Off-white + electric lime, Impact, dense |

## Design-tweak panel

Bottom-left **⚙ Tweak** button (or press the `` ` `` key):

- **Version presets** — jump between the 3 looks
- **Palette** — 4 color directions (Neon, Cream/Red/Navy, Off-white/Lime/Ink, Lavender/Purple/Orange)
- **Display / Body / Mono font** — swap type per region
- **Font scale** — 85%–120%
- **Spacing density** — Compact / Comfy

Nothing here is persisted — it's a live preview for choosing a direction. All theming is CSS
variables applied at `components/ThemeContext.tsx`; palettes/fonts/presets live in `lib/theme.ts`.

## Assets

- `public/portrait.jpg` — real photo, in the hero portrait card (swap the file, zero layout change).
- `public/assets/seal.svg` — animated star seal in the hero. Authored in **SVGator**
  (project `pi_d5a157469bb64505a8014d0737265a6b`), shipped as a self-contained CSS-animated SVG.
- `public/assets/doodle-texture.webp` — faint poster texture on the contact band. Generated on
  **Hugging Face** (Z-Image; Qwen-Image was attempted first but its ZeroGPU worker was down).

## Structure

```
app/            layout, page (/), look/[id] (preset routes), globals.css
components/     Sections, ThemeContext, ControlPanel, Chatbot, Clock, Site
lib/            data.ts (content, single source of truth), theme.ts (palettes/fonts/presets)
public/         portrait + generated assets
_legacy/        original standalone index.html (reference only)
```

The AI chatbot (**Ask AI**, bottom-right) is a front-end shell only — keyword-matched canned
answers, no backend.
