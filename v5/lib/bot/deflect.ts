// Client-side classifier for "the bot just deflected".
//
// Phase 5 drives the avatar's `deflecting` state off the reply text, and only off the reply
// text, because the wire contract (`types.ts`) carries no reason code and Phase 5 is forbidden
// from touching the route. So this file matches the reply against fragments of the fixed
// strings the server can send without a model call:
//
//   guardrails.ts  L1 canned refusals (injection / empty / over-length)
//   ratelimit.ts   LIMIT_TEXT (kill switch, burst, ip-session, ip-daily, infra)
//   canned.ts      POPULAR_TODAY + the degraded-path FALLBACK
//   route.ts       the timeout error message
//   Chatbot.tsx    the client's own network-failure text
//
// Pure, no imports: `ratelimit.ts` pulls in the Upstash client and can never be bundled into a
// client component, so the fragments are duplicated here rather than imported. `deflect.test.ts`
// imports the real server tables and asserts every one of their strings still matches — if
// somebody rewords a canned line, that test fails rather than the avatar quietly going flat.
//
// Fragments are long and verbatim on purpose. A short one ("nice try") is a phrase the live
// model could plausibly produce mid-answer, which would tilt the head on a normal reply.

const DEFLECT_FRAGMENTS: readonly string[] = [
  // L1 input gate
  "i only have one bit and the bit is sadnan",
  "i don't take new instructions",
  "contractually incapable of caring",
  "but respect for the attempt",
  "trim it under 400",
  // rate limits + kill switch
  "i'm off the clock right now",
  "you're typing faster than i can hype",
  "we've been at this a while and i need a breather",
  "maxed out your daily sadnan lore",
  "my brain's rebooting",
  // canned floor
  "he's popular today",
  "i'm running on backup answers",
  // transport failures
  "brain buffering",
  "couldn't reach the brain",
];

/** True when `text` is one of the fixed non-model replies listed above. */
export function isDeflection(text: string): boolean {
  const hay = text.toLowerCase();
  return DEFLECT_FRAGMENTS.some((fragment) => hay.includes(fragment));
}
