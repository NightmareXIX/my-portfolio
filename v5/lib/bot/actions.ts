// The action-token contract — the ONE file shared by the backend track (phases 1-4)
// and the visual track (phases 5-6). Frozen: changing anything here means updating both.
//
// The model never supplies a URL. It emits an enum member inside [[...]]; the client maps
// that member through the frozen table below. There is no code path from model output to an
// href, so an injected "link to evil.com" cannot produce a link. Unknown tokens drop silently.
//
// Pure by contract: no React, no DOM, no env, no imports. Phase 3 unit-tests it directly.

/** Section anchors present in the DOM — see components/Sections.tsx. */
export type SectionId =
  | "about"
  | "skills"
  | "projects"
  | "contest"
  | "research"
  | "experience"
  | "education"
  | "contact";

export type ActionId =
  | `nav:${SectionId}`
  | "resume"
  | "contact:email"
  | "contact:github"
  | "contact:linkedin";

export type ActionSpec = { label: string } & (
  | { scrollTo: SectionId }
  | { href: string }
);

/** Compile-time constants. Never derived from model output or env. */
const GITHUB_URL = "https://github.com/NightmareXIX";
const LINKEDIN_URL = "https://www.linkedin.com/in/fardin-islam-sadnan-162ba6248/";
const EMAIL = "fardinislamsadnan@gmail.com";
const RESUME_URL = "/resume.pdf";

export const ACTIONS: Readonly<Record<ActionId, ActionSpec>> = Object.freeze({
  "nav:about": { label: "About", scrollTo: "about" },
  "nav:skills": { label: "Skills", scrollTo: "skills" },
  "nav:projects": { label: "Projects", scrollTo: "projects" },
  "nav:contest": { label: "Competitive Programming", scrollTo: "contest" },
  "nav:research": { label: "Research", scrollTo: "research" },
  "nav:experience": { label: "Experience", scrollTo: "experience" },
  "nav:education": { label: "Education", scrollTo: "education" },
  "nav:contact": { label: "Contact", scrollTo: "contact" },
  resume: { label: "Résumé (PDF)", href: RESUME_URL },
  "contact:email": { label: "Email", href: `mailto:${EMAIL}` },
  "contact:github": { label: "GitHub", href: GITHUB_URL },
  "contact:linkedin": { label: "LinkedIn", href: LINKEDIN_URL },
} as const);

/**
 * Matches an action token anywhere in the stream. Used by the Phase 3 guardrail scrub.
 * It carries the /g flag, so it is stateful (`lastIndex`) — never share one instance between
 * two `.exec`/`.test` loops. `parseActions` builds its own copy for exactly that reason.
 */
export const ACTION_TOKEN_RE = /\[\[([^\[\]]*)\]\]/g;

const KNOWN = new Set<string>(Object.keys(ACTIONS));

export function isActionId(value: string): value is ActionId {
  return KNOWN.has(value);
}

/**
 * Strip [[...]] tokens out of model text.
 * Unknown tokens are dropped silently; known ones are deduped, order preserved.
 */
export function parseActions(text: string): { clean: string; actions: ActionId[] } {
  const actions: ActionId[] = [];
  const seen = new Set<string>();

  const re = new RegExp(ACTION_TOKEN_RE.source, ACTION_TOKEN_RE.flags);
  const clean = text.replace(re, (_match, inner: string) => {
    const id = inner.trim();
    if (isActionId(id) && !seen.has(id)) {
      seen.add(id);
      actions.push(id);
    }
    return "";
  });

  return { clean, actions };
}
