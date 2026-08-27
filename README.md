# Kazi Fardin Islam — Portfolio

The source code for my personal portfolio website: a single-page site with an AI chatbot
that answers questions about my work.

**Live at → [fardinislamsadnan.vercel.app](https://fardinislamsadnan.vercel.app)**

---

## What this repo is

If you landed here from the site and are wondering what you're looking at — this is the
whole thing. The website is a [Next.js](https://nextjs.org) app that lives in the `v5/`
folder. Open it, run two commands, and you have the site running on your own machine.

There is no build server, no database and no CMS. The page content is a TypeScript file
you can edit by hand, and the site is deployed by pushing to `main`.

```
v5/            The website. Everything below is inside it.
  app/           Pages, plus the API route the chatbot talks to
  components/    The UI, split into sections; components/bot/ is the chat widget
  lib/
    data.ts        All page content — every project, stat and link lives here
    theme.ts       The colour palettes and fonts
    bot/           The chatbot: prompt, guardrails, rate limits, providers
  public/        Portrait, résumé PDF, SVG assets
  middleware.ts  Sets the security headers on every response

profile_info/  My résumé source and profile notes — where the site's copy came from
v3/            An earlier design direction, plain HTML, kept for reference
```

## The site

One page, nine sections, built as a neo-brutalist poster — heavy black rules, a loud
yellow ground, oversized display type.

It ships in three looks, each on its own URL:

| Look | URL | Style |
|---|---|---|
| Poster | [`/look/poster`](https://fardinislamsadnan.vercel.app/look/poster) | Loud yellow, Arial Black, tight grid |
| Editorial | [`/look/editorial`](https://fardinislamsadnan.vercel.app/look/editorial) | Cream, red and navy, serif, roomier |
| Acid | [`/look/acid`](https://fardinislamsadnan.vercel.app/look/acid) | Off-white and electric lime, dense |

Theming is plain CSS custom properties applied at the root, so a look is a set of values
in `lib/theme.ts` rather than a separate stylesheet.

## The chatbot

Bottom-right, labelled **Ask AI**. The bot is called **Glaze-Bot** and it has exactly one
subject: me. Ask it about my stack, a project or my contest results.

How a question travels, end to end:

1. The widget posts your message to `app/api/chat/route.ts`.
2. The route checks it — rate limits first, then an input filter for prompt-injection
   attempts.
3. It asks **Google Gemini**, streaming the answer back word by word.
4. If Gemini is rate-limited or down, it silently retries on **Groq**.
5. If both are unavailable, a small set of hand-written answers covers the common
   questions, so the bot never simply breaks.

A few things worth knowing if you're reading the code:

- **Conversation history never round-trips through the browser.** It is held server-side
  in Redis under an httpOnly cookie, so a visitor cannot edit the transcript and replay
  it as if the bot had said something it did not.
- **Nothing you type is logged.** The log line is a timestamp, a hashed IP, a token count
  and which provider answered — no message content, no raw IP addresses.
- **The model never supplies a link.** When it wants to point at a section it emits a
  marker like `[[nav:projects]]`, which the front end maps to a real destination through a
  fixed table in `lib/bot/actions.ts`.
- **Two switches need no redeploy.** `CHATBOT_ENABLED=false` turns the bot off, and
  `GLAZE_LEVEL` (`mild` / `medium` / `unhinged`) sets how enthusiastic it is.

## Running it locally

You need [Node.js](https://nodejs.org) 18.17 or newer. Then:

```bash
git clone https://github.com/NightmareXIX/my-portfolio.git
cd my-portfolio/v5
npm install
npm run dev
```

Open <http://localhost:3005>.

**You do not need any API keys to see the site.** Without them the page renders exactly as
it does in production and the chatbot falls back to its canned answers.

To run the chatbot for real, copy the template and fill it in:

```bash
cp .env.example .env.local
```

`.env.example` documents every variable inline. The three that matter:

| Variable | What it is | Where to get it |
|---|---|---|
| `GEMINI_API_KEY` | The main model | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — free, no card |
| `UPSTASH_REDIS_REST_URL` + `_TOKEN` | Rate limits and chat history | [console.upstash.com](https://console.upstash.com) — free tier is plenty |
| `APP_SECRET` | Salt for hashing visitor IPs | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

`GROQ_API_KEY` is optional but recommended — it is what keeps the bot answering once
Gemini's free daily quota runs out.

> **Never commit `.env.local`.** It is gitignored, and `.env.example` holds placeholders only.

## Other commands

```bash
npm test         # 135 unit tests over the guardrails, rate limits and navigation.
                 # Pure functions only — no network calls, no API keys needed.
npm run build    # Production build. Run this before deploying.
```

## Deploying

The site is on [Vercel](https://vercel.com), deployed automatically on every push to
`main`. For a fresh project:

1. Import the repo, and set **Root Directory** to `v5` — the Next.js app is not at the
   repository root.
2. Add every variable from `v5/.env.example` under **Settings → Environment Variables**.
3. Make sure `ALLOWED_ORIGINS` contains your production URL, or the chat route will
   reject every request with a 403.

`v5/vercel.json` pins the framework to `nextjs`. **Leave that file in place.** Without a
framework preset, Vercel builds `middleware.ts` with a generic builder that crashes on
every request; the header comment in `v5/middleware.ts` explains why in full.

## Built with

[Next.js 14](https://nextjs.org) (App Router) · [React 18](https://react.dev) ·
[TypeScript](https://www.typescriptlang.org) · [Zod](https://zod.dev) ·
[Google Gemini](https://ai.google.dev) + [Groq](https://groq.com) ·
[Upstash Redis](https://upstash.com) · [Vitest](https://vitest.dev) · deployed on
[Vercel](https://vercel.com). No CSS framework — the styles are hand-written.

## Contact

Kazi Fardin Islam (Sadnan) — Dhaka, Bangladesh
[fardinislamsadnan@gmail.com](mailto:fardinislamsadnan@gmail.com) ·
[LinkedIn](https://www.linkedin.com/in/fardin-islam-sadnan-162ba6248) ·
[GitHub](https://github.com/NightmareXIX)
