# Phase 1 — Plumbing

**Type:** backend · **Depends on:** Phase 0 · **Est. size:** medium
**Goal:** prove the pipe. Browser → edge route → Gemini → streamed tokens back into the existing widget. No personality, no guardrails, no limits.

## Context to load

| File | Why |
|---|---|
| `CHATBOT_PLAN.md` §2, §9 (model + `thinkingBudget`), §11 | Architecture, runtime, model config |
| `v5/.env.local` | **Read, do not regenerate.** Credentials are verified working. |
| `v5/components/Chatbot.tsx` | Being rewritten |
| `v5/package.json` | Add the dep |

## Tasks

### 1.1 — Dependency
`cd v5 && npm i @google/genai zod`. (Upstash comes in Phase 4.) Commit the lockfile change.

### 1.2 — `v5/app/api/chat/route.ts`
- `export const runtime = "edge"`. POST only; anything else → 405.
- Zod body schema: `{ message: string }`, **strict** (reject unknown keys), 1–400 chars. Enforce `Content-Type: application/json`.
- Read `GEMINI_API_KEY`, `GEMINI_MODEL` from `process.env`. If missing → 500 with a generic message; never echo the key or its length.
- Call Gemini **streaming** with:
  - `thinkingConfig: { thinkingBudget: 0 }` — the model thinks by default and it buys nothing here.
  - `maxOutputTokens: 320`.
  - A **placeholder** system prompt: one or two lines, "you answer questions about Kazi Fardin Islam's portfolio, be brief." The real prompt is Phase 2 — do not start writing persona or knowledge here.
- Stream out as **SSE** (`text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`). Event shape must be the one Phase 3/4/6 will extend: `data: {"type":"text","delta":"..."}` and a terminal `data: {"type":"done"}`; errors as `{"type":"error","message":"..."}`. Define it once in `v5/lib/bot/types.ts` and import from both sides.
- Timeout the upstream call at **15s** → error event `"brain buffering 😵‍💫"`.
- No history yet — single-turn. History is Phase 4 (server-side Redis; the client will *never* send it).

### 1.3 — Minimal client wiring
Edit **`v5/components/Chatbot.tsx`** in place. Do not split it into `bot/ChatPanel` etc. — that restructure is Phase 5.
- Delete `reply()` and the `botAnswers` import. Leave the `botAnswers` export in `data.ts` alone for now (Phase 7 removes it) so nothing else breaks.
- `ask()` POSTs `{ message }` to `/api/chat`, reads the SSE stream, appends deltas to a live bot message.
- Render every message as a **plain text node**. No `dangerouslySetInnerHTML`, not now, not ever in this path.
- Basic states only: in-flight (disable input, simple "…"), error (show the error message as a bot bubble). Keep the existing chips and markup/CSS as-is.

## Out of scope
Persona, knowledge base, glaze levels, guardrails, rate limiting, Groq, session cookie, Redis, avatar, action chips, navigation, CSP headers.

## Verify
- `npm run dev` on **3005**; open the widget, ask "who is Sadnan?" → tokens visibly stream in, not one blob at the end.
- `npx tsc --noEmit` passes; `npm run build` passes.
- `curl` the route with a 500-char body → 400. With `{"message":"hi","history":[]}` → 400 (strict schema).
- Confirm **no key in the client bundle**: `grep -r "AQ\." v5/.next/static` finds nothing.

## Stop
Show it streaming, paste the verify output, then stop. Phase 2 is the persona.
