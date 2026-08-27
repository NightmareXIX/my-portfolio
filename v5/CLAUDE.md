# v5 — Neo-Brutalist Portfolio

Next.js **14.2.5** App Router · React 18.3 · TypeScript 5.5 · no CSS framework, no UI library.
Dev server runs on **port 3005** — `npm run dev` (already `-p 3005`; don't pass another port).
`npm run build` · `npm run start` (also 3005) · `npm run lint`.

## Layout

- `app/` — `layout.tsx`, `page.tsx`, `globals.css` (all styling lives here), `look/[id]/page.tsx`.
- `components/` — `Site.tsx` (shell + mount point), `Sections.tsx` (all page sections),
  `ThemeContext.tsx` (palette/font/density provider + control panel), `Chatbot.tsx`, `Clock.tsx`, `Loader.tsx`.
- `lib/` — `data.ts` (content), `theme.ts` (palettes/fonts/looks), `bot/` (chatbot).

## Neo-brutalist conventions

- Borders are **3–4px solid `var(--ink)`**. Never a thin hairline, never a border-radius on structural chrome.
- Depth comes from **offset hard shadows**, never blur: `var(--shadow)` (6px), `--shadow-sm` (3px),
  `--shadow-lg` (9px), `--box2` (8px) / `--box2-hover` (13px 15px).
- **Palette CSS vars only — never a literal hex in a component.** Available:
  `--bg --ink --card --paper --accent --accent-ink --pop --pop-ink --head2 --sel`,
  plus `--disp --body --mono --fs --sec-pad --grid-gap`.
- Interactive chrome gets a **slight rotation** (1–3°) and shifts its shadow on hover.
- Type is uppercase, tight-tracked, heavy weight for anything that acts as a label or button.

## Theming

`components/ThemeContext.tsx` applies every var to a `.theme-root` wrapper, and the live control panel
swaps palettes at runtime (four palettes: neon, editorial, acid, lavender). Anything hardcoded to a hex
silently stops re-skinning — including SVG `fill`/`stroke`, which must bind to `var(--ink)` etc. too.

## No fabricated metrics

From the header of `lib/data.ts`, and it governs the chatbot's knowledge base as well:

> Content source of truth — every value traces to `profile_info/PROFILE.md`.
> No fabricated metrics, years, clients, or testimonials.

If a number isn't in `PROFILE.md`, it does not go on the site or in the bot's mouth.

## Chatbot

Specced in [`../CHATBOT_PLAN.md`](../CHATBOT_PLAN.md), executed phase-by-phase via
[`../chatbot-phases/`](../chatbot-phases/). Shared contract: `lib/bot/actions.ts` (frozen — changing it
means updating both the backend and visual tracks). Secrets live in `.env.local`; `.env.example` is the
committable template.
