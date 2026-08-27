# my-portfolio

Personal portfolio of **Kazi Fardin Islam (Sadnan)** — plus the design exploration that led to it.

Live: https://fardinislamsadnan.vercel.app

---

## What ships

The deployed site is **`v5/`** — a Next.js 14 (App Router) app with an AI chatbot
that answers questions about my work.

Everything else in this repo is the record of how it got there: earlier design
directions, reference material, and the phase-by-phase build plan for the bot.

## Layout

```
v5/                     ← THE SITE. Vercel's Root Directory points here.
  app/                  App Router pages + the edge chat route
  components/           UI; components/bot/ is the chat widget
  lib/                  data.ts (content), theme.ts, bot/ (the whole chatbot)
  lib/bot/__tests__/    135 vitest tests over guardrails, rate limits, navigation
  middleware.ts         Per-request CSP nonce
  public/               Portrait, resume, SVG assets

chatbot-phases/         The 8-phase build plan the bot was written against
CHATBOT_PLAN.md         Full architecture spec for the chatbot
CHATBOT_SETUP.md        How to get API keys and fill in .env.local
profile_info/           Source material — resume, profile notes
inspiration/            Screenshots that fed the visual direction
v3/                     An earlier design direction, kept for reference
index.html              Static index of the v1–v5 directions
```

## Running it locally

```bash
cd v5
npm install
cp .env.example .env.local   # then fill it in — see CHATBOT_SETUP.md
npm run dev                  # http://localhost:3005
```

```bash
npm test         # vitest — the bot's guardrail + rate-limit suite
npm run build    # production build; must pass before deploying
```

The site renders fine with no keys set — the chatbot degrades to canned
answers rather than breaking. `CHATBOT_ENABLED=false` turns it off entirely.

## Deploying

Vercel project → **Settings → General → Root Directory = `v5`**, then set every
variable from `v5/.env.example` under Settings → Environment Variables.

`ALLOWED_ORIGINS` **must** contain the production origin
(`https://fardinislamsadnan.vercel.app`) or the chat route rejects every request
with a 403.

## Secrets

No key is ever committed. `.env.local` is gitignored; `.env.example` is the
template and carries only placeholder values.
