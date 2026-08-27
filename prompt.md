# Portfolio — 5 Direction Prompt (for Claude Code)

> Attach when running: `PROFILE.md`, this prompt, and the 5 inspiration screenshots (in v1→v5 order below, one per direction).

---

Build a single-page portfolio site for **Kazi Fardin Islam (Sadnan)** — a recent BSc (Information & Communication Engineering, University of Rajshahi) graduate transitioning from a strong competitive-programming background into backend/full-stack and AI-adjacent software engineering, currently applying for entry-level SWE roles.

**Content source of truth:** Pull all copy, stats, project details, and contact info from `PROFILE.md`. Do not invent metrics, years of experience, client counts, or testimonials — every number on the page must trace back to PROFILE.md. Sadnan is a fresher; do not imply otherwise.

**Required sections (all 9, in this order, every version):**
1. **Hero** — name, role tagline, one-line pitch, primary CTA
2. **About** — the three-identities framing (backend/full-stack engineer, systems-minded builder, AI-adjacent engineer)
3. **Skills** — grouped by category (Software Engineering, AI/ML-Adjacent, Problem Solving, Collaboration & Leadership)
4. **Projects** — all 5 projects (OnnoRokom Assignment System, LLM Gateway, ICEntral, Food Delivery App, llm-guard-probe), uniform card depth for all: title, one-line tagline, tech stack tags, status, one-sentence context, 3–4 "what I built" bullets, links (repo/demo — use `#` placeholder where no real URL exists)
5. **Competitive Programming & Hackathons** — Codeforces Specialist (peak 1584), 2× ICPC Dhaka Regional Finalist (2024, 2025 — 48th/310+), IUPC results, contest authorship/coaching, hackathon finishes (HackTheAI, InnovateX 2026, BUET GameJam)
6. **Research & Publications** — Best Paper award (Springer LNNS, ICTDsC 2024), BSc thesis (TransComp-R validation study)
7. **Experience** — Programming Instructor (Rajshahi Programming Club, Jan–Jul 2026), VP IEEE RUSB CS Chapter (Apr 2025–Feb 2026)
8. **Education** — University of Rajshahi, BSc ICE, CGPA 3.60/4.00 (Mar 2022–Jul 2026)
9. **Contact / Footer** — email, phone, LinkedIn, GitHub, Portfolio (use PROFILE.md contact block)

**Conversion goal:** Primary CTA on every version is **"View Projects"**; it must appear in the hero and repeat at the end of the page. Contact details stay reachable (header or footer) regardless of direction.

**AI chatbot feature:** every version needs a visible entry point for an AI chatbot — button, panel, or command, whichever fits the direction. Placement/visual treatment is intentionally undecided — follow each direction's own note below. Build a front-end shell only (no real backend chat logic needed for this comparison pass); a static, styled interaction surface is enough.

**Intent:** all 5 should read as *a technically serious junior engineer who already ships production-grade systems* — not a bootcamp-tutorial portfolio, not generic template energy. A technical recruiter should think "this person can be trusted with real code" within a few seconds, earned through specificity (real project depth, real contest results) rather than padded stats.

**Guardrails — always:** use only real content/stats from PROFILE.md; include all 9 sections; stay fully responsive to mobile; keep contact info accurate and unobscured; reserve a chatbot entry point.
**Never:** fabricate "years of experience," client counts, or testimonials the way the reference templates do; use lorem ipsum or generic SaaS copy; blend two directions into one version; generate or source real photography — use a flat CSS color block sized/positioned exactly where a real image would sit, so swapping one in later needs zero layout changes.

Create 5 versions, each in its own folder (`v1/` … `v5/`), one per direction below. Same content, intent, and guardrails for all five. Do NOT blend directions — each version commits fully to its own aesthetic.

---

### DIRECTION 1 (v1) — Bold Dark Editorial
**Aesthetic:** dark editorial × bold display — near-black ground, oversized two-tone headline (solid fill line + ghost/outline line), single warm accent (amber/orange), duotone-treated portrait card, dashed connector annotations, sharp-cornered accent tiles, mono stat labels.
**Reference:** inspiration screenshot 1 — match feel, not content.
**Placement:** bordered portrait card upper-left with a flat duotone-amber CSS placeholder (no real photo); two-line display headline upper-right ("SOFTWARE ENGINEER"-style lockup using Sadnan's actual title); real stat row beneath using only PROFILE.md numbers (Codeforces peak, ICPC finals, project count) — never fabricated years/clients; chatbot entry as a small pill button beside the primary CTA, unstyled interior.

### DIRECTION 2 (v2) — IDE / Code-Editor Interface
**Aesthetic:** developer-tool chrome — VS Code–style window frame, file-tree sidebar, monospace code-comment intro line, colored role-badge chips, syntax-highlight accent palette (blue/green/pink on dark slate).
**Reference:** inspiration screenshot 2 — match feel, not content.
**Placement:** left file-tree = section nav, with each of the 9 sections mapped to a fake filename (e.g. `about.md`, `projects.json`, `skills.ts`, `competitive-programming.md`, `research.md`, `experience.tsx`, `contact.css`); main pane renders the active section styled like an open file. The AI chatbot lives natively as a right-hand Copilot-style panel — since this direction already frames the affordance, build it as the most complete chat shell of the five (a few clickable suggested-question chips is enough).

### DIRECTION 3 (v3) — Terminal Chat Minimal
**Aesthetic:** minimal terminal — matte black ground, single neon-green accent, huge lowercase monospace greeting, slim breadcrumb nav (`~/home ~/projects ~/about …`), bordered terminal window with blinking cursor.
**Reference:** inspiration screenshot 3 — match feel, not content.
**Placement:** headline terminal-style ("hi, I'm Sadnan") in the left column with role tagline and one-paragraph pitch below; right column is a bordered terminal panel (`~/ask-me.sh`) that doubles as the AI chatbot surface, pre-seeded with a few suggested prompt chips tied to real content (e.g. "what's your stack?", "tell me about ICEntral").

### DIRECTION 4 (v4) — ASCII Hacker CLI
**Aesthetic:** raw CLI simulation — pure black background, monospace-only type, ASCII-art name banner, `$ whoami` key–value dump (role/location/stack), `$ ls`-style directory listings, single-color (green) palette, zero imagery.
**Reference:** inspiration screenshot 4 — match feel, not content.
**Placement:** entire page framed as one continuous terminal session scrolling through the 9 sections as sequential commands (`whoami` → `ls skills` → `ls projects` → `cat competitive-programming.md` → `cat research.md` → `ls contact`); chatbot reserved as an additional runnable command (e.g. a `chat` command that opens an inline prompt line) — flag the entry point only, minimal implementation.

### DIRECTION 5 (v5) — Neo-Brutalist Poster
**Aesthetic:** high-contrast neo-brutalist poster — single loud flat color ground, huge outlined/drop-shadowed display type, thick black borders, white stat cards with hard offset shadows, hand-drawn accent marks (stars, scribbles), pill-shaped status badges.
**Reference:** inspiration screenshot 5 — match feel, not content.
**Placement:** name set as oversized two-color poster type; real stat cards (black-bordered, offset shadow) using only PROFILE.md numbers; bold horizontal nav bar with an "OPEN TO WORK" style pill; AI chatbot entry as a bold floating badge/button in the same poster style — placement only, interior unstyled.