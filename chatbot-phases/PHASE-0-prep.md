# Phase 0 — Prep

**Type:** setup · **Depends on:** nothing · **Est. size:** small
**Goal:** version control, a project memory file, and the one contract both the backend and the visual track build against — so phases 1–4 and 5–6 can proceed without stepping on each other.

## Context to load

| File | Why |
|---|---|
| `CHATBOT_PLAN.md` §6, §13 | Action-token contract; the "two things to do first" list |
| `v5/package.json` | Stack/scripts for CLAUDE.md |
| `v5/lib/theme.ts` | Palette var names for CLAUDE.md conventions |
| `v5/lib/data.ts` (header comment) | The "no fabricated metrics" rule to restate |
| `v5/components/Sections.tsx` | Section ids for the action enum |

## Tasks

### 0.1 — `git init`
At the **repo root** (`d:/Programming/Projects/my-portfolio`), not inside `v5/`.
- `git init`, set `main` as branch.
- Verify a root `.gitignore` exists and covers `node_modules/`, `.next/`, `*.log`, `.env*`. Create/extend it — `v5/.gitignore` already covers `v5/`'s own, but the root has none.
- Make the initial commit of the current state **before writing any chatbot code**, so every later phase is a reviewable diff.
- Do **not** create a remote or push.

### 0.2 — `v5/CLAUDE.md`
Short (~40 lines). Contents:
- Stack: Next.js 14.2.5 App Router, React 18, TypeScript 5.5, dev on **port 3005** (`npm run dev`).
- Neo-brutalist conventions: 3–4px `var(--ink)` borders, offset hard shadows (`var(--shadow)`, `--shadow-sm`, `--shadow-lg`), **palette CSS vars only — never a literal hex** in components, slight rotations on interactive chrome.
- Theme vars available and that they swap live via the palette panel ([ThemeContext.tsx](../v5/components/ThemeContext.tsx)).
- The **no fabricated metrics** rule from `data.ts`'s header — every number traces to `profile_info/PROFILE.md`.
- Pointer: chatbot work is specced in `../CHATBOT_PLAN.md`, executed via `../chatbot-phases/`.

### 0.3 — Freeze the action-token contract
Create **`v5/lib/bot/actions.ts`**. This is the *only* file both tracks share, so it lands first and does not change afterwards without updating both.

```ts
export type ActionId =
  | `nav:${SectionId}` | "resume" | "contact:email" | "contact:github" | "contact:linkedin";
```
- `SectionId` union: `about | skills | projects | contest | research | experience | education | contact` (verified present in the DOM).
- Export a **frozen** `Record<ActionId, { label: string } & ({ scrollTo: SectionId } | { href: string })>`.
- Hrefs are **compile-time constants** taken from CHATBOT_PLAN §12: GitHub `NightmareXIX`, LinkedIn `fardin-islam-sadnan-162ba6248`, email from `data.ts`, resume `/resume.pdf`.
  ⚠ CORRECTION: `data.ts` currently says `github.com/sadnan` — wrong. Use `NightmareXIX`. (Fixing `data.ts` itself is Phase 7.)
- Export `parseActions(text: string): { clean: string; actions: ActionId[] }` — strips `[[...]]` tokens, drops unknown ones **silently**, dedupes, preserves order.
- Export `ACTION_TOKEN_RE` for the guardrail scrub in Phase 3.
- No React, no DOM, no env access in this file — pure, so Phase 3 can unit-test it.

## Out of scope
No route, no API call, no UI change, no dependency installs, no `resume.pdf`.

## Verify
- `git log --oneline` shows the initial commit; `git status` clean apart from the new files.
- `cd v5 && npx tsc --noEmit` passes.
- A throwaway node/tsx check that `parseActions("cool [[nav:projects]] and [[nav:evil]]")` → `clean` has no brackets, `actions === ["nav:projects"]`.

## Stop
Report the commit hash and the `ActionId` union as written. Do not start Phase 1.
