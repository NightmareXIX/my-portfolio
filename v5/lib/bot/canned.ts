// The floor. When every upstream leg is exhausted — global cap tripped AND Groq spent, or
// both providers erroring — the widget still answers, from a fixed table, with no model call.
//
// Facts here are copied from `knowledge.ts` and must stay in sync with it; they carry the same
// no-fabricated-metrics rule as the rest of the site. Action tokens are real `ActionId`s from
// the frozen table, so the degraded path renders the same chips as the live one.

import type { ActionId } from "./actions";

/** Appended to a canned answer when the reason is the global circuit breaker, not an error. */
export const POPULAR_TODAY = "he's popular today 😤 come back tomorrow for the full experience.";

type Faq = { match: RegExp; answer: string; action: ActionId };

/**
 * Ordered — first match wins, so put the specific patterns above the general ones. These are
 * intentionally few: a big keyword table is a worse bot pretending to be a better one, and the
 * honest failure ("i'm running on backup answers") reads better than a near-miss.
 */
const FAQS: readonly Faq[] = [
  {
    // Above the generic stack matcher on purpose: "is he a .NET dev?" is a headline question
    // (it is a few-shot exemplar in every tone), and the HARD RULE in knowledge.ts about never
    // calling .NET his main stack has to survive the degraded path too.
    match: /(\.net|\bdotnet\b|\bc#|\bcsharp\b|asp\.?net|\bentity framework\b)/i,
    answer:
      "he built one genuinely solid .NET project — 86 real auth tests, no mocking shortcuts — but node and fastapi are where he actually lives. the .NET run was him learning the ecosystem properly.",
    action: "nav:projects",
  },
  {
    match: /\b(stack|tech|technolog|languages?|tools?|skills?)\b/i,
    answer:
      "he's backend-first: node/express and fastapi are home turf, postgres underneath, next.js + typescript on the front, plus docker and redis.",
    action: "nav:skills",
  },
  {
    match: /\b(codeforces|icpc|contest|competitive|rating|programming contest)\b/i,
    answer:
      "codeforces Specialist, peak 1584, and a 2× ICPC dhaka regional finalist — 48th out of 310+ in 2025.",
    action: "nav:contest",
  },
  {
    match: /\b(project|built|build|portfolio|gateway|icentral|work samples?)\b/i,
    answer:
      "the headliners are the LLM Gateway (fastapi + redis, mid-stream provider failover with zero duplicate output) and ICEntral (react/node/postgres, dockerized).",
    action: "nav:projects",
  },
  {
    match: /\b(research|paper|publication|springer|orcid)\b/i,
    answer: "he's got published research with a Best Paper to his name — the section has the details.",
    action: "nav:research",
  },
  {
    match: /\b(study|studies|degree|university|cgpa|graduat|education|school)\b/i,
    answer:
      "BSc in Information & Communication Engineering, University of Rajshahi, CGPA 3.60/4.00, graduating 2026.",
    action: "nav:education",
  },
  {
    match: /\b(experience|job|intern|employ|worked)\b/i,
    answer: "his experience section has the actual roles and dates — worth a look rather than me paraphrasing.",
    action: "nav:experience",
  },
  {
    match: /\b(resume|cv|curriculum)\b/i,
    answer: "the résumé's right there as a PDF, that'll be faster than me.",
    action: "resume",
  },
  {
    match: /\b(contact|email|reach|hire|hiring|available|linkedin|github)\b/i,
    answer: "easiest route is email — he actually answers.",
    action: "contact:email",
  },
];

const FALLBACK =
  "i'm running on backup answers right now so i can't riff properly, but everything about him is on this page.";

/**
 * Pick a canned reply for a message. Always returns something — the degraded path has no
 * "no answer" state. The returned string already contains its action token, so it goes through
 * the exact same scrub-and-parse pipeline as a model reply.
 */
export function cannedAnswer(message: string, suffix?: string): string {
  const hit = FAQS.find((faq) => faq.match.test(message));
  const body = hit ? `${hit.answer} [[${hit.action}]]` : `${FALLBACK} [[nav:about]]`;
  return suffix ? `${suffix} ${body}` : body;
}
