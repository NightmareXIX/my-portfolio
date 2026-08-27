# Phase 7 — Harden + ship

**Type:** ship · **Depends on:** Phases 1–6 · **Est. size:** medium
**Goal:** headers, cleanup, a real security pass, e2e, deploy.

## Context to load

| File | Why |
|---|---|
| `CHATBOT_PLAN.md` §10, §11, §12 | Security checklist, modified-files list, correct links |
| `v5/next.config.mjs` | Security headers go here |
| `v5/lib/data.ts` | Cleanup targets — see 7.2 |
| `v5/app/layout.tsx` | `next/font` JetBrains Mono — the CSP has to accommodate it |

## Tasks

### 7.1 — Security headers, `next.config.mjs`

- `Strict-Transport-Security`.
- **CSP** — `default-src 'self'`. Two known snags: Next.js emits inline styles, and the JetBrains Mono `next/font` fetch. **Use a nonce** rather than `'unsafe-inline'`. Verify the site still renders with the CSP live; a CSP that ships broken gets removed a week later, which is worse than not having one.
- Standard set: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, a restrictive `Permissions-Policy`.

### 7.2 — `data.ts` cleanup

- Delete `botAnswers` (the Phase 1 canned strings; the widget stopped using it then).
- **Fix the GitHub handle:** `github.com/sadnan` → `github.com/NightmareXIX`. This is a broken link on the live site right now, independent of the chatbot.
- Add the real project repo/demo links from §12.
- **Site copy stack rebalance** (§3a): `profile.role` and the `about` copy both lead with C#/ASP.NET Core, and `skills` lists EF Core ahead of anything Node. The chatbot has been telling the truth since Phase 2 while the page next to it says otherwise. Bring the copy in line: Node/Express and FastAPI lead, .NET presented as the rigour proof (86 real auth tests), not as the specialty. Keep every metric verbatim.

### 7.3 — `resume.pdf`

Place the real file at `v5/public/resume.pdf`. If it still hasn't been provided, **do not ship the `[[resume]]` chip enabled** — hide it behind a flag and report it, rather than shipping a link that 404s.

### 7.4 — `/security-review`

Run it on the full diff. Address anything real. Explicitly re-confirm the invariants:

- No `NEXT_PUBLIC_` API key anywhere. `grep -r "AQ\.\|gsk_" v5/.next/static` → nothing.
- No `dangerouslySetInnerHTML` in the chat path.
- Zod schema still strict; `history[]` from the client is still a 400.
- Redis failure still fails **closed**.
- Logs contain no message content and no raw IPs.

### 7.5 — Playwright e2e

Via the Playwright MCP, against `localhost:3005`:

- Injection attempt → canned deflection, no persona break.
- Rate-limit trip → in-character message.
- Nav chip → scroll + flash lands.
- Reduced-motion path → instant jump.
- Full conversation happy path, streaming intact.

### 7.6 — Deploy

- Vercel env vars, **server-scoped**, matching `.env.local`: `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `APP_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`, `CHATBOT_ENABLED`, `GLAZE_LEVEL`, `GLOBAL_DAILY_CAP`, `ALLOWED_ORIGINS`.
- Add the production domain to `ALLOWED_ORIGINS` **before** deploying, or every request 403s.
- Note: `fardinislamsadnan.vercel.app` currently hosts a different project — resolve that first.
- Ship at `GLAZE_LEVEL=medium` and tune live. It moves with no code change and no redeploy of logic.
- Post-deploy smoke test on the real domain; confirm the Upstash counters are actually incrementing in production.

## Verify

- `npm run build` clean, no CSP violations in the console on a full page load.
- `/security-review` output pasted, with a line on each finding: fixed, or why not.
- Playwright run green.
- Live domain: one real conversation, one injection attempt, one nav chip.

## Done

Tick every box in [README.md](README.md). Note anything deliberately deferred (e.g. Turnstile stays off until abuse appears; `GLOBAL_DAILY_CAP` may want raising once real traffic data exists).
