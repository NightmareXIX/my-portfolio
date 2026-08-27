# Phase 6 — Navigation

**Type:** visual · **Depends on:** Phase 5 (+ Phase 0's frozen contract, + Phase 2 for the model to actually emit tokens) · **Est. size:** medium
**Goal:** action tokens working end to end — the model emits `[[nav:projects]]`, the client renders a chip, the click flies the page there with a neo-brutalist landing beat.

## Context to load

| File | Why |
|---|---|
| `CHATBOT_PLAN.md` §6, §7 | Token contract, animation spec, reduced-motion rule |
| `v5/lib/bot/actions.ts` | The frozen whitelist — **do not change it here**; if it must change, update Phase 0 and both tracks |
| `v5/components/Sections.tsx` | Section ids + the existing intersection observer (L41) |
| `v5/app/globals.css` | `.nav-flash` hook added in Phase 5 |
| `v5/components/bot/ChatMessage.tsx` | Where chips render |

## Tasks

### 6.1 — Token parsing on the client

The route streams text through; the **client** parses tokens out of the buffer, removes them from the displayed text, and renders them as chips below the message.

- Buffer a few characters so a token cannot split across two chunks and render as visible garbage mid-stream.
- Unknown tokens are dropped **silently**.
- The security property that matters, restated: **the model never supplies a URL.** It supplies an enum member; the client maps it through the frozen record. An injected "link to evil.com" cannot produce a link because no code path exists from model output to an `href`.

Token set (from §6):

```
[[nav:<id>]]        id ∈ {about,skills,projects,contest,research,experience,education,contact}
[[resume]]          → /resume.pdf
[[contact:email]]   → mailto:
[[contact:github]]  [[contact:linkedin]]
```

### 6.2 — `v5/lib/bot/navigate.ts` — `navigateToSection(id)`

1. Panel collapses to the badge — **240ms, `transform` + `opacity` only.** Compositor-only, no layout thrash.
2. Custom **rAF scroll tween, ~700ms, `easeInOutCubic`**, offset for the sticky `.nav-wrap` header. Hand-rolled rather than `scrollIntoView({behavior:'smooth'})` so the duration is predictable and arrival syncs with step 3.
3. On arrival the target section gets `.nav-flash` for **900ms**: `--pop` border flash, offset hard-shadow pulsing `4px 4px` → `10px 10px` → rest, and the section heading doing a 2° rotate-settle. No new visual vocabulary — this is the existing design language.
4. A small "⌄ taking you there" toast on the badge during travel.

### 6.3 — Reduced motion — non-negotiable

`prefers-reduced-motion: reduce` → instant `scrollTo({behavior:'auto'})`, and the flash replaced by a **600ms static outline**. A scripted full-page scroll is a genuine vestibular trigger; this is not a nice-to-have.

### 6.4 — `Sections.tsx`

Add `data-section` attributes and the flash class hook. **No structural change.** The existing intersection observer at L41 handles reveal-on-enter and the scroll fires it naturally — verify no double-trigger or fight between the two.

### 6.5 — Non-nav actions

`[[resume]]` → opens `/resume.pdf`. ⚠ **`v5/public/resume.pdf` does not exist** — that link 404s on the live site today, independent of this feature. If the file still isn't there, build the chip anyway and report the 404 as an outstanding blocker; do not fake the file.
`[[contact:*]]` → the compile-time constant hrefs from `actions.ts` (GitHub `NightmareXIX`, not `sadnan`).

### 6.6 — Prompt nudge

Confirm the system prompt teaches *when* to emit a token (roughly: one per answer, max, and only when it genuinely helps) rather than sprinkling them. Tune the few-shots if the model over- or under-emits.

## Out of scope

Route/guardrail changes. Fixing `data.ts`'s wrong GitHub handle in the rendered site — Phase 7.

## Verify

- Ask "what projects has he built?" → a `projects` chip appears, the token text is **not** visible in the bubble.
- Click it → panel collapses, page tweens, section flashes. Screen-record or screenshot the flash frame.
- Reduced-motion on → instant jump + static outline, no tween.
- Try each of the eight nav ids plus resume, email, github, linkedin.
- Feed a fake `[[nav:evil]]` / `[[nav:https://evil.com]]` through (mock a response) → dropped silently, no chip, no link.
- Mid-stream: confirm a token split across chunk boundaries never flashes visibly in the bubble.

## Stop

Post the recording/screenshots and the blocked-token result. Then stop.
