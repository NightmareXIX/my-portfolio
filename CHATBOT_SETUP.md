# Chatbot — Credential Setup & Links Needed

Companion to [CHATBOT_PLAN.md](CHATBOT_PLAN.md). Everything here is stuff only you can do.

Two files now exist:

| File | Committed? | Purpose |
|---|---|---|
| `v5/.env.local` | **No** (gitignored) | Your real keys go here |
| `v5/.env.example` | Yes | Blank template for the repo |

`v5/.gitignore` previously did **not** cover `.env*` — it does now. Worth knowing if you ever ran `git add -A` in a copy of this project.

---

## Part 1 — Gemini API key

**Cost: free.** No credit card, no billing account.

1. Go to **https://aistudio.google.com/apikey** and sign in with your Google account (`fardinislamsadnan@gmail.com` is fine).
2. Accept the Google AI Studio terms if prompted.
3. Click **"Create API key"** (blue button, top right).
4. A dialog asks you to pick a Google Cloud project:
   - If you have none, choose **"Create API key in new project"** — AI Studio makes one silently, no Cloud console trip needed.
   - If you already have a project, either works.
5. The key appears — starts with `AIza`, roughly 39 characters. Click the copy icon.
6. Paste it into `v5/.env.local` after `GEMINI_API_KEY=`:
   ```
   GEMINI_API_KEY=AIzaSy...your-key-here
   ```
   No quotes, no spaces around the `=`.

**While you're on that page**, click the key to open its detail view and note the **free-tier rate limits** shown for `gemini-2.5-flash` — requests per minute and requests per day. Tell me those two numbers. I set `GLOBAL_DAILY_CAP` to sit safely below the daily one so the site degrades gracefully instead of getting a 429 from Google.

**Two things to do on that key:**
- **Restrict it.** In the key detail view there's an API restrictions section — limit it to the Generative Language API only. If it ever leaks, the blast radius is one free-tier API rather than your whole Google Cloud project.
- **Don't** paste it into this chat, a screenshot, or a commit. If you think it's exposed, the same page has a delete button — regenerate and move on. It takes 30 seconds.

---

## Part 2 — Upstash Redis

**Cost: free.** The free tier is ~10,000 commands/day; this bot uses roughly 4 commands per message, so that's ~2,500 messages/day of headroom — far above the rate limits we're enforcing anyway.

1. Go to **https://console.upstash.com** and sign up. "Continue with GitHub" or "Continue with Google" is fastest — no card required.
2. On the dashboard, click **"Create Database"**.
3. Fill the form:
   - **Name:** `sadnan-portfolio-chat` (anything, it's just a label)
   - **Type / Primary Region:** pick the region closest to your Vercel deployment region. If unsure, **`us-east-1`** — it's Vercel's default and keeps latency low.
   - **Eviction:** leave enabled. Our keys all have TTLs, so this never matters, but it prevents a full-database error in an edge case.
   - Do **not** enable "Global" / multi-region replication — it's a paid feature and unnecessary here.
4. Click **Create**.
5. You land on the database page. Scroll to the **"REST API"** section (there's a tab or panel labelled REST).
6. You'll see two values. Copy both:
   - `UPSTASH_REDIS_REST_URL` — looks like `https://apn1-xxxx-yyyy-12345.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` — a long string
7. Paste into `v5/.env.local`.

**Important:** Upstash shows both a **read-write** token and a **read-only** token. Copy the **read-write** one — the rate limiter needs to increment counters. The read-only token will fail with a permissions error that isn't obvious from the message.

There's usually a "Copy as .env" or `@upstash/redis` snippet button on that page that gives you both lines pre-formatted — easiest path if you see it.

---

## Part 3 — App secret

One command, run it in the `v5/` folder:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the 64-character hex output into `APP_SECRET=` in `v5/.env.local`.

This salts the SHA-256 hash of visitor IPs, so the rate limiter can tell users apart without ever storing a raw IP. It's a local random value — it isn't registered anywhere and doesn't need to match anything.

---

## Part 4 — Groq (optional)

Only needed if you want automatic failover when Gemini rate-limits you. Skip it and the bot falls back to canned answers instead — a perfectly fine degradation.

1. **https://console.groq.com/keys** — sign up (GitHub/Google, free, no card).
2. **"Create API Key"**, name it anything.
3. Copy immediately — **Groq shows the key exactly once**. If you lose it, delete and make a new one.
4. Paste into `GROQ_API_KEY=`.

---

## Part 5 — Verify

Once Gemini + Upstash + `APP_SECRET` are filled in:

```powershell
cd v5
npm run dev
```

Nothing chatbot-related is built yet, so there's nothing to click. But once I build Phase 1, I'll add a `npm run check:env` that validates every variable is present and that the Upstash token actually authenticates — so you find out at setup time, not from a broken widget.

---

## Part 6 — Later, at deploy time

Vercel does **not** read `.env.local` — that file is local-only by design. When you create the Vercel project you'll re-enter each variable under **Settings → Environment Variables**. Two adjustments then:

- `ALLOWED_ORIGINS` gets your real domain, e.g. `https://sadnan.dev`
- Scope every variable to **Production + Preview + Development**

Not blocking anything now. Just so it isn't a surprise.

---

# Links I need from you

Every one of these is `href: "#"` in [v5/lib/data.ts](v5/lib/data.ts) right now — placeholders. The chatbot hands these out when it answers, so a `#` means it either links nowhere or has to awkwardly decline.

Fill in what exists. For anything private or non-existent, **write "none"** — that's genuinely useful, because then the bot says "that one's private, but he'll walk you through it" instead of implying a repo it can't produce.

### Profile links

| # | What | Currently | Your value |
|---|---|---|---|
| 1 | GitHub profile | `github.com/sadnan` (unverified — is this actually yours?) | |
| 2 | LinkedIn | `/in/kazi-fardin-islam` (path only, need full URL) | |
| 3 | Codeforces handle | not stored anywhere | |
| 4 | Portfolio production domain | not decided | |

### Project links — repo + live demo for each

| # | Project | Repo | Demo |
|---|---|---|---|
| 5 | OnnoRokom Assignment System | | |
| 6 | LLM Gateway | | |
| 7 | ICEntral | | |
| 8 | Food Delivery + AI Health | | |
| 9 | llm-guard-probe | | |

`data.ts` currently gives OnnoRokom, LLM Gateway and ICEntral both a "Repo ↗" and a "Demo ↗" button, and gives Food Delivery and llm-guard-probe repo-only. If that split is wrong, correct it here.

### Research

| # | What | Your value |
|---|---|---|
| 10 | ICTDsC 2024 Best Paper — Springer LNNS link or DOI | |
| 11 | BSc thesis (TransComp-R) — link, if public | |

### Optional but high value

| # | What | Why |
|---|---|---|
| 12 | Google Scholar / ORCID | Recruiters checking the Best Paper claim |
| 13 | Any live/hosted demo the bot should push hardest | Bot leads with it on "what should I look at first?" |

---

# The FAQ answers

Separate from links, and the thing most likely to make the bot embarrass you. These get asked constantly and **`PROFILE.md` answers none of them**. Without your words, the bot has to say "I don't know" — or worse, guess.

Answer in whatever voice you like; I'll rewrite them into the bot's tone. One or two sentences each.

1. **Relocation** — open to it? Remote-only? Specific countries or cities?
2. **Availability** — you graduate July 2026. When can you actually start? Any notice period?
3. **Work authorization** — visa status, sponsorship needs. Say "don't discuss" if you'd rather it stay off the table.
4. **Salary expectations** — a range, or "deflect and redirect to email." Deflecting is the normal choice.
5. **"Why should we hire you?"** — one paragraph in your own words. This is the answer people screenshot, so it's worth writing properly.
6. **Employment type** — full-time, internship, contract, open to all?
7. **Off-limits topics** — should the bot give out your **phone number**? Your **CGPA**? Your **age**? Right now `data.ts` has your phone in `contact`, so the bot will share it unless you say otherwise. Worth a deliberate decision — a public chatbot handing out a mobile number to anyone who asks is a different exposure than a number sitting in page footer text.
