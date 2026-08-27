// Client-side streaming split. `parseActions` (frozen, in actions.ts) handles a COMPLETE
// string; this wraps it with the one thing a stream adds — a token that has only half
// arrived. The route already holds partial constructs back (`holdFrom` in guardrails.ts), so
// in practice nothing half-written reaches the browser. This is the client's own belt to the
// server's braces: it is why a mocked, replayed, or otherwise unscrubbed source can't flash a
// raw "[[nav:pro" in a bubble either.

import { parseActions, type ActionId } from "./actions";

/**
 * A token fragment touching the end of the buffer. Deliberately looser than "starts with
 * `[[`": one chunk can end on a single `[`, and a token whose second bracket has arrived but
 * whose fourth has not (`[[nav:projects]`) is just as visible as one that stops mid-id.
 * The cost is that a bracket the visitor genuinely typed about stays hidden for one chunk —
 * cheap, and it matches what the server already does.
 */
const TRAILING_PARTIAL = /\[{1,2}[^\[\]]*\]?$/;

/**
 * Passes to run. `parseActions` matches innermost-first, so `[[nav:[[nav:projects]]]]` leaves
 * `[[nav:]]` behind on pass one — an unknown token, which the contract says vanishes, so it
 * must not survive as visible brackets in a bubble. Two passes clear that; the third is slack.
 * Nesting deeper than this is not a security question (a token can only ever match the frozen
 * table) — it is only about not leaving punctuation on screen.
 */
const MAX_PASSES = 3;

/** Text to display, plus the chips to render under it. Unknown tokens vanish either way. */
export function splitStreaming(text: string): { clean: string; actions: ActionId[] } {
  const actions: ActionId[] = [];
  const seen = new Set<ActionId>();
  let clean = text;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const step = parseActions(clean);
    for (const id of step.actions) {
      if (!seen.has(id)) {
        seen.add(id);
        actions.push(id);
      }
    }
    if (step.clean === clean) break;
    clean = step.clean;
  }

  return { clean: clean.replace(TRAILING_PARTIAL, "").trimEnd(), actions };
}
