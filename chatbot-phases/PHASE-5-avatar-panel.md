# Phase 5 — Avatar + panel

**Type:** visual · **Depends on:** Phase 0 (contract) — Phase 1 to watch it stream · **Est. size:** large
**Goal:** the bot looks and feels like it belongs in v5. Themed SVG mascot with five states, and the widget split into real components with proper streaming UI.

**Runs in parallel with 2–4 if you want.** It shares only `v5/lib/bot/actions.ts`, frozen in Phase 0.

## Context to load

| File | Why |
|---|---|
| `CHATBOT_PLAN.md` §8, §1 | Avatar spec, motion states, what happens to the existing shell |
| `v5/public/assets/bot_icon.jpeg` | The reference image. ⚠ CORRECTION: plan says `bot-reference.png`; the file actually in the repo is `bot_icon.jpeg`. **Look at it** before drawing. |
| `v5/lib/theme.ts` | `--ink --sel --pop --accent --card --paper` (+ `--pop-ink --accent-ink --head2 --bg`). Easy to miss and the whole point — hardcoded hex kills live re-skinning. |
| `v5/app/globals.css` L245-266 | The existing chat styling base being extended |
| `v5/components/Chatbot.tsx` | Current shell, being split |
| `v5/components/Site.tsx` | Mount point — verify only, the widget must stay inside `ThemeProvider` |

## Tasks

### 5.1 — `v5/components/bot/BotAvatar.tsx`

Single inline SVG, **hand-authored** — not SVGator. SVGator bakes colors into a self-contained file and cannot read `var(--pop)` from the theme root, which kills live re-skinning across the four palettes. (If you would rather have SVGator's easing polish and give up palette binding, say so before starting.)

Matching the reference: round head, two antennae with tipped ends, rounded visor with curved-smile eyes, striped mouth, two stubby feet.

- **3px `var(--ink)` stroke on every shape** — the reference is flat and strokeless; the strokes are what make it v5.
- **Fills bound to CSS vars, never hex:** head `var(--sel)`, visor `var(--pop)`, feet + mouth `var(--accent)`, antenna tips `var(--pop)`.
- Offset hard shadow `4px 4px 0 var(--ink)` on the badge, matching `#chatBadge`'s existing hover treatment.
- Three sizes: badge **40px**, header **28px**, message **22px**.

**States** (CSS keyframes only — no JS, no runtime cost):

| State | Motion |
|---|---|
| Idle | 4s bob, antennae swaying out of phase |
| Blink | eyes squash to a line ~every 5s, **jittered** so it isn't metronomic |
| Thinking | visor cycles `--pop` → `--accent`, antenna tips pulse |
| Speaking | mouth stripes animate a 3-frame wave |
| Deflecting | one 12° head tilt + a raised eyebrow arc — this is what sells the quirky refusal |

All states gated behind `prefers-reduced-motion: reduce`.

### 5.2 — Component split

- `v5/components/bot/ChatPanel.tsx` — panel chrome, scroll management, streaming, chip row, input.
- `v5/components/bot/ChatMessage.tsx` — one bubble. **Plain text nodes only.** No `dangerouslySetInnerHTML` in this path, ever. Renders the action-chip row beneath the bubble (chips are inert until Phase 6 wires `navigate.ts`).
- `v5/components/Chatbot.tsx` — reduced to shell + state + the SSE fetch loop.
- `v5/components/Site.tsx` — **verify only**, no edit. The widget stays inside the theme root so it re-skins with the live palette panel.

### 5.3 — `globals.css` (+~120 lines)

Extend, don't replace, `#chatBadge` / `.chat-panel` / `.ch-*`. Add: avatar sizing + keyframes, a streaming caret, action-chip styling (reuse `.ch-chips`' visual language), and the `.nav-flash` class Phase 6 will trigger. Palette vars only.

### 5.4 — Streaming UI

Avatar drives off real state: `thinking` while awaiting first token → `speaking` while deltas arrive → `idle` on done → `deflecting` when the response is a guardrail/rate-limit canned reply. Blinking caret during stream, auto-scroll that does **not** fight a user who has scrolled up.

## Out of scope

Scroll tween, `.nav-flash` firing, chip click behaviour — all Phase 6. Any prompt/route change.

## Verify

- Cycle all four palettes with the live panel → the avatar re-skins, **zero hardcoded hex** in `BotAvatar.tsx` (grep for `#` to confirm).
- Screenshot each of the five states.
- Toggle OS reduced-motion → all avatar animation stops, layout unchanged.
- Mobile width (375px) → panel fits, nothing clips.
- Streaming reads smoothly: caret present, avatar state transitions land at the right moments.
- `npx tsc --noEmit` and `npm run build` pass.

## Stop

Post the screenshots. Then stop.
