// One Upstash client for the whole bot. Edge-compatible (REST over fetch, no TCP).
//
// `redis()` returns null when the credentials are absent. Every caller MUST treat null and a
// thrown request the same way: as Redis being down. And Redis down means
// FAIL CLOSED on rate limiting — see the comment in `ratelimit.ts`.

import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let resolved = false;

export function redis(): Redis | null {
  if (resolved) return client;
  resolved = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return (client = null);
  try {
    client = new Redis({
      url,
      token,
      // One retry, fast. A chat widget cannot spend seconds re-trying a counter; if Upstash
      // is genuinely down we want to reach the fail-closed branch quickly, not hang the user.
      retry: { retries: 1, backoff: () => 150 },
    });
  } catch {
    // A malformed URL throws right here rather than at request time. Still "Redis is down".
    client = null;
  }
  return client;
}

/** Test seam: forget the memoised client so a changed env is picked up. */
export function resetRedisForTests(): void {
  client = null;
  resolved = false;
}
