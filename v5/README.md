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

## The AI chatbot

**Ask AI**, bottom-right. Real backend: an edge SSE route (`app/api/chat/route.ts`) streaming
Gemini, failing over to Groq, with a canned-FAQ floor underneath. Specced in
[`../CHATBOT_PLAN.md`](../CHATBOT_PLAN.md), built phase-by-phase in
[`../chatbot-phases/`](../chatbot-phases/).

```bash
cp .env.example .env.local     # then fill it in — see ../CHATBOT_SETUP.md
npm run test                   # 135 unit tests, zero API calls
npm run dev                    # http://localhost:3005
```

### Shipped state

| | |
|---|---|
| Route | Edge, SSE, `{ message }` only — a client-supplied `history[]` is a 400 |
| Guardrails | L1 input gate · L2 system prompt · L3 strict Zod · L4 streamed output scrub |
| Limits | burst 4/30s · per-IP 12/30min · per-IP 20/24h · global 450/day Gemini + 1000/day Groq |
| Redis down | **Fails closed** — denies rather than waving requests through |
| History | Server-side in Redis, 24h TTL, keyed by an httpOnly cookie. Never round-trips the client |
| Logs | `{ts, hashedIp, tokensUsed, provider, blocked?}` — **no message content, no raw IPs** |
| Actions | `[[nav:*]]` / `[[resume]]` / `[[contact:*]]` → chips, mapped through the frozen `lib/bot/actions.ts`. The model never supplies a URL |
| Tone | `GLAZE_LEVEL=mild\|medium\|unhinged` — env-only, no code change |
| Kill switch | `CHATBOT_ENABLED=false` — instant off, no redeploy |

### Security headers

`next.config.mjs` carries HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, a deny-all
`Permissions-Policy` and COOP. The **CSP lives in `middleware.ts`** because it carries a
per-request nonce — which is also why `app/page.tsx` and `app/look/[id]/page.tsx` are
`force-dynamic`: a statically prerendered page is baked without a nonce, and a nonce'd
`script-src` would then block every script. `script-src` has no `unsafe-inline` of any kind.

## Deploy checklist

- [ ] Vercel env vars, **server-scoped** (never `NEXT_PUBLIC_`): `GEMINI_API_KEY`,
      `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `APP_SECRET`,
      `GROQ_API_KEY`, `GROQ_MODEL`, `CHATBOT_ENABLED`, `GLAZE_LEVEL`, `GLOBAL_DAILY_CAP`,
      `GROQ_DAILY_CAP`, `ALLOWED_ORIGINS`.
- [ ] **`ALLOWED_ORIGINS` must contain the production domain before the deploy**, or every
      request 403s. It is a comma-separated origin list; keep `http://localhost:3005` on it.
- [ ] `fardinislamsadnan.vercel.app` currently hosts a different project — resolve that first.
- [ ] Ship at `GLAZE_LEVEL=medium`, tune live (env-only, no logic redeploy).
- [ ] Post-deploy smoke: one real conversation, one injection attempt, one nav chip, and
      confirm the Upstash counters (`sb:budget:*`, `sb:rl:*`) increment in production.

### Deliberately deferred

- **Turnstile** stays off — both keys blank. It is built (`lib/bot/integrity.ts`) and
  activates on two env vars; friction for no benefit until real abuse appears.
- **`GLOBAL_DAILY_CAP=450`** sits under Gemini's 500/day free tier. Worth raising only once
  real traffic data exists.
- **Visa / work-authorization answer** is still unanswered in `knowledge.ts` — the bot says it
  doesn't know, which is the weakest answer for the recruiter most likely to ask. See
  `CHATBOT_PLAN.md` §12.
- **`SHARE_PHONE = true`** in `lib/bot/knowledge.ts` — the bot will volunteer the mobile
  number. One boolean to flip.
