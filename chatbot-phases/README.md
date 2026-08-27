# Chatbot Build — Phase Index

Execution plan split out of [CHATBOT_PLAN.md](../CHATBOT_PLAN.md). One phase per file.
The plan is the **spec**; these files are the **work orders**. Where they disagree, the plan wins —
except where a phase file records a correction found by inspecting the actual repo (marked `⚠ CORRECTION`).

## How to run a phase

Say: **"execute phase N"**. The session then:

1. Opens `chatbot-phases/PHASE-N-*.md` and reads the **Context to load** table (only those files — not the whole repo).
2. Does everything under **Tasks**, nothing under **Out of scope**.
3. Runs **Verify** and reports the actual output.
4. Ticks the phase's checkbox in this file's status table.
5. **Stops.** No rolling into phase N+1.

## Status

| Phase | File | Depends on | Type | Done |
|---|---|---|---|---|
| 0 | [PHASE-0-prep.md](PHASE-0-prep.md) | — | setup | ☐ |
| 1 | [PHASE-1-plumbing.md](PHASE-1-plumbing.md) | 0 | backend | ☐ |
| 2 | [PHASE-2-knowledge-persona.md](PHASE-2-knowledge-persona.md) | 1 | backend | ☐ |
| 3 | [PHASE-3-guardrails.md](PHASE-3-guardrails.md) | 2 | backend | ☐ |
| 4 | [PHASE-4-ratelimit-failover.md](PHASE-4-ratelimit-failover.md) | 3 | backend | ☐ |
| 5 | [PHASE-5-avatar-panel.md](PHASE-5-avatar-panel.md) | 0 (+1 to see it stream) | visual | ☐ |
| 6 | [PHASE-6-navigation.md](PHASE-6-navigation.md) | 5, and §6 token contract | visual | ☐ |
| 7 | [PHASE-7-harden-ship.md](PHASE-7-harden-ship.md) | 1–6 | ship | ☐ |

**Parallelism.** 1→2→3→4 is a strict chain. 5→6 only needs Phase 0 plus the frozen action-token
contract, which Phase 0 writes to `v5/lib/bot/actions.ts` *before* anything else. So 5 and 6 can run in a
separate session alongside 2–4 if you want the persona and the animation reviewed independently.

## Blockers carried from the plan (§12)

These do not stop Phase 0–4, but Phase 5/7 will trip on them:

- **`v5/public/resume.pdf` is missing.** [Sections.tsx:77](../v5/components/Sections.tsx#L77) links it today → live 404. Needed by Phase 6 (`[[resume]]` chip) and Phase 7.
- **Visa / work-authorization answer undecided.** Phase 2 needs one of: state your status · "sponsorship required" · "email me". Phase 2 will stop and ask if it is still unset.
- **Bot reference image** — plan asks for `v5/public/assets/bot-reference.png`. ⚠ CORRECTION: `v5/public/assets/bot_icon.jpeg` **already exists** and is presumably it. Phase 5 uses that path; rename if it is the wrong image.

## Repo facts verified at split time (2026-08-27)

- `v5/` deps are **next 14.2.5, react 18.3.1** only. None of `@google/genai`, `@upstash/*`, `zod` installed yet → Phase 1/4 install them.
- `v5/.env.local` exists with every key the plan lists, values set. **Read it, never regenerate it.**
- `v5/.gitignore` already covers `.env.local`. ✅
- Section ids in the DOM: `#top #about #skills #projects #contest #research #experience #education #contact` — matches the plan's nav map exactly.
- Chat CSS lives at [globals.css:245-266](../v5/app/globals.css#L245-L266).
- Theme vars: `--bg --ink --card --paper --accent --accent-ink --pop --pop-ink --head2 --sel` in [theme.ts](../v5/lib/theme.ts). The avatar binds to these.
- **Not a git repo yet.** Phase 0 fixes this first.
