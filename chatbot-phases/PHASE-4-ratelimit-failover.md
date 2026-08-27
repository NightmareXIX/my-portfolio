# Phase 4 — Rate limiting, session, failover

**Type:** backend · **Depends on:** Phase 3 · **Est. size:** large
**Goal:** the bot cannot be drained. Five limit layers, server-side history, Groq failover, canned degradation.

## Context to load

| File | Why |
|---|---|
| `CHATBOT_PLAN.md` §9, §10 | Quotas, the five layers, hashed IPs, failure modes |
| `v5/.env.local` | `UPSTASH_*`, `APP_SECRET`, `GROQ_*`, `GLOBAL_DAILY_CAP`, `CHATBOT_ENABLED`, `ALLOWED_ORIGINS` — all verified, read as-is |
| `v5/app/api/chat/route.ts` | Orchestration point |
| `v5/lib/bot/prompt.ts` | The Groq prompt variant written in Phase 2 |

## Tasks

### 4.0 — Deps

`cd v5 && npm i @upstash/ratelimit @upstash/redis` (both edge-compatible).

### 4.1 — `v5/lib/bot/session.ts`

- httpOnly + Secure + `SameSite=Lax` cookie. Opaque **128-bit** random id, 24h TTL. **Not auth** — a rate-limit and history key only. No PII.
- History in Redis under the session id, **24h TTL, auto-expiring**. Trim to the **last 6 turns**.
- `hashIp(ip)` = `SHA-256(ip + APP_SECRET)`. Raw IPs never stored, never logged. (Raw IPs are personal data under GDPR; the salt costs nothing and removes the question.)

### 4.2 — `v5/lib/bot/ratelimit.ts`

| Layer | Limit | Mechanism |
|---|---|---|
| Per-session burst | 4 / 30s | Upstash sliding window, key = session cookie |
| Per-IP session | 12 / 30min | sliding window, key = hashed IP |
| Per-IP daily | 20 / 24h | fixed window |
| Global circuit breaker | **450** / 24h | Upstash counter → canned FAQ answers + "he's popular today 😤 come back tomorrow" |
| Kill switch | `CHATBOT_ENABLED=false` | checked first, instant off, no redeploy |

- **Redis down → fail closed.** Deny, don't allow unlimited. Say so in a comment; it is the counter-intuitive branch someone will "fix" later.
- Every rejection returns in-character SSE text, not a bare 429 the widget has to interpret.

### 4.3 — `v5/lib/bot/providers.ts`

- One interface, two implementations: **Gemini** (`gemini-3.5-flash-lite`, `thinkingBudget: 0`, `maxOutputTokens: 320`) primary, **Groq** (`openai/gpt-oss-20b`) failover.
- Write the interface **symmetrically** so swapping primary to Groq is a one-line change. Groq's 1,000/day is double Gemini's 500 — that swap may well end up the right default.
- Failover triggers: Gemini **429 / 5xx**, or the 450 global cap tripping. Groq then serves until its own ceiling; after that → canned FAQ answers.
- Groq gets the terse prompt variant. Same facts, same guardrails, same action-token contract.
- Mid-failover, **no duplicate output** to the client — if Gemini emitted tokens before failing, either finish on Gemini's partial or restart cleanly with a visible reset. Pick one and comment the choice.

### 4.4 — Request integrity

`Origin`/`Referer` allowlist from `ALLOWED_ORIGINS` (prod domain + `localhost:3005`) → 403 on mismatch. Body size cap. This is what stops casual `curl` abuse.

### 4.5 — Turnstile hook (build, don't enable)

~5 lines: if **both** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are set, verify the token; otherwise skip entirely. A challenge on a portfolio chat is friction for zero benefit until there is actual abuse.

### 4.6 — Logging

Record `{ts, hashedIp, tokensUsed, blocked?}`. **Never message content.** If transcripts are ever wanted for tuning, that needs a disclosed notice in the widget first — do not quietly log what strangers type.

## Out of scope

Any UI beyond showing rate-limit text in the existing bubble. Avatar, chips, navigation, CSP.

## Verify

- Send 5 messages in 30s → the 5th returns the burst message.
- `CHATBOT_ENABLED=false`, restart → widget degrades gracefully, zero upstream calls.
- Force the global counter near 450 (set the Redis key directly) → circuit-breaker path serves canned answers.
- Point `GEMINI_API_KEY` at a bad value → **Groq answers**, and the reply is coherent and in-persona. Paste it.
- Temporarily break the Upstash URL → the request is **denied**, not allowed.
- `curl` from a disallowed Origin → 403.
- History works: ask "what's his stack?" then "which of those is he deepest in?" → the follow-up has context, and the client request body still contains **only** `{ message }`.

## Stop

Paste all seven checks. Then stop.
