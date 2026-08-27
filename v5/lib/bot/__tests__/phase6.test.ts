// Phase 6 — the parts of navigation that are decidable without a DOM: the streaming token
// split, the scroll arithmetic, and the nav/link fork. The browser half (fold → tween →
// flash, reduced motion, real chip clicks) is exercised live; see the phase report.

import { describe, expect, it } from "vitest";

import { ACTIONS, type ActionId } from "../actions";
import {
  easeInOutCubic,
  FALLBACK_HEADER_OFFSET,
  isNavAction,
  NAV_COLLAPSE_MS,
  NAV_FLASH_MS,
  NAV_FLASH_STATIC_MS,
  NAV_TWEEN_MS,
  targetScrollTop,
} from "../navigate";
import { splitStreaming } from "../tokens";

/** Replay a reply the way the widget sees it: the accumulated buffer after every chunk. */
function replay(chunks: readonly string[]): { text: string; actions: ActionId[] }[] {
  let acc = "";
  return chunks.map((c) => {
    acc += c;
    const { clean, actions } = splitStreaming(acc);
    return { text: clean, actions };
  });
}

describe("splitStreaming — completed replies", () => {
  it("lifts a known token out of the text and into a chip", () => {
    const { clean, actions } = splitStreaming("he's backend-pilled [[nav:skills]]");
    expect(clean).toBe("he's backend-pilled");
    expect(actions).toEqual(["nav:skills"]);
  });

  it("drops an unknown token silently — no chip, no visible text", () => {
    for (const evil of [
      "[[nav:evil]]",
      "[[nav:https://evil.com]]",
      "[[https://evil.com]]",
      "[[resume:https://evil.com]]",
      "[[NAV:PROJECTS]]",
      "[[ ]]",
    ]) {
      const { clean, actions } = splitStreaming(`ok ${evil}`);
      expect(actions).toEqual([]);
      expect(clean).toBe("ok");
      expect(clean).not.toContain("[");
      expect(clean).not.toContain("evil");
    }
  });

  it("keeps a known token and drops an unknown one in the same reply", () => {
    const { clean, actions } = splitStreaming("a [[nav:evil]] b [[nav:contact]] c");
    expect(actions).toEqual(["nav:contact"]);
    expect(clean).toBe("a  b  c");
  });

  it("leaves no bracket residue behind a nested token", () => {
    // parseActions matches innermost-first: one pass would leave a visible "[[nav:]]".
    const { clean, actions } = splitStreaming("here you go [[nav:[[nav:projects]]]]");
    expect(clean).toBe("here you go");
    expect(actions).toEqual(["nav:projects"]);
  });

  it("drops a nested pair that resolves to nothing known", () => {
    const { clean, actions } = splitStreaming("x [[nav:[[nav:evil]]]] y");
    expect(clean).toBe("x  y");
    expect(actions).toEqual([]);
  });

  it("dedupes, preserving first-seen order", () => {
    const { actions } = splitStreaming("[[nav:projects]] x [[nav:about]] y [[nav:projects]]");
    expect(actions).toEqual(["nav:projects", "nav:about"]);
  });

  it("leaves ordinary text with brackets in the middle alone", () => {
    expect(splitStreaming("he wrote a [note] about it").clean).toBe("he wrote a [note] about it");
  });
});

describe("splitStreaming — mid-stream", () => {
  it("never shows a token that split across chunk boundaries", () => {
    // Every boundary inside "[[nav:projects]]" — the token must be invisible at all of them.
    const reply = "five of them, receipts and all [[nav:projects]]";
    const at = reply.indexOf("[[");
    for (let cut = at; cut <= reply.length; cut++) {
      const frames = replay([reply.slice(0, cut), reply.slice(cut)]);
      for (const f of frames) {
        expect(f.text).not.toContain("[");
        expect(f.text).not.toContain("]");
        expect(f.text).not.toContain("nav:");
      }
      // …and it still arrives as a chip once the whole thing has landed.
      expect(frames[frames.length - 1].actions).toEqual(["nav:projects"]);
    }
  });

  it("survives a one-character-at-a-time stream", () => {
    const reply = "peak 1584 🫡 [[nav:contest]]";
    const frames = replay(Array.from(reply));
    for (const f of frames) {
      expect(f.text).not.toContain("[");
      expect(f.text).not.toContain("]");
    }
    expect(frames[frames.length - 1]).toEqual({ text: "peak 1584 🫡", actions: ["nav:contest"] });
  });

  it("hides a half-arrived unknown token too, then drops it", () => {
    const frames = replay(["nope ", "[[nav:ev", "il]]"]);
    expect(frames.map((f) => f.text)).toEqual(["nope", "nope", "nope"]);
    expect(frames[2].actions).toEqual([]);
  });

  it("holds a trailing token whose closing brackets are still arriving", () => {
    expect(splitStreaming("text [[nav:projects]").clean).toBe("text");
    expect(splitStreaming("text [").clean).toBe("text");
    expect(splitStreaming("text [[").clean).toBe("text");
  });
});

describe("easeInOutCubic", () => {
  it("pins the endpoints and the midpoint", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10);
  });

  it("clamps out-of-range t — a late frame can't overshoot the target", () => {
    expect(easeInOutCubic(-3)).toBe(0);
    expect(easeInOutCubic(4)).toBe(1);
  });

  it("is monotonic and symmetric about the midpoint", () => {
    let prev = -1;
    for (let i = 0; i <= 100; i++) {
      const v = easeInOutCubic(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeCloseTo(1 - easeInOutCubic(1 - i / 100), 10);
      prev = v;
    }
  });

  it("starts and ends slowly — that is the whole point of the curve", () => {
    expect(easeInOutCubic(0.1)).toBeLessThan(0.1);
    expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);
  });
});

describe("targetScrollTop", () => {
  it("lifts the section by the header offset", () => {
    expect(targetScrollTop(2000, 104, 9000)).toBe(1896);
  });

  it("never scrolls above the top of the document", () => {
    expect(targetScrollTop(40, 104, 9000)).toBe(0);
    expect(targetScrollTop(0, 104, 9000)).toBe(0);
  });

  it("clamps to what the document can actually scroll", () => {
    // The last section can't reach the top — the tween must aim where the browser will stop.
    expect(targetScrollTop(8800, 104, 6000)).toBe(6000);
  });

  it("handles a page shorter than the viewport", () => {
    expect(targetScrollTop(300, 104, -200)).toBe(0);
  });
});

describe("action fork", () => {
  it("classifies every id in the frozen table", () => {
    for (const id of Object.keys(ACTIONS) as ActionId[]) {
      expect(isNavAction(id)).toBe("scrollTo" in ACTIONS[id]);
    }
  });

  it("treats the eight section ids as nav and the four links as links", () => {
    const nav = (Object.keys(ACTIONS) as ActionId[]).filter(isNavAction);
    expect(nav).toHaveLength(8);
    expect((Object.keys(ACTIONS) as ActionId[]).filter((id) => !isNavAction(id))).toEqual([
      "resume",
      "contact:email",
      "contact:github",
      "contact:linkedin",
    ]);
  });
});

describe("link actions resolve to the frozen constants", () => {
  // The browser pass can observe `window.open` for the three tab-opening actions; the mailto
  // leg sets `location.href`, which can't be spied on, so it is pinned here instead.
  it("points email at the address from §12 and nowhere else", () => {
    const email = ACTIONS["contact:email"];
    expect(email).toEqual({ label: "Email", href: "mailto:fardinislamsadnan@gmail.com" });
  });

  it("uses the NightmareXIX handle, not sadnan", () => {
    expect(ACTIONS["contact:github"]).toEqual({
      label: "GitHub",
      href: "https://github.com/NightmareXIX",
    });
  });

  it("keeps every non-nav href relative or https — never a script: or data: scheme", () => {
    for (const id of Object.keys(ACTIONS) as ActionId[]) {
      const spec = ACTIONS[id];
      if ("scrollTo" in spec) continue;
      expect(spec.href).toMatch(/^(https:\/\/|mailto:|\/)/);
    }
  });
});

describe("navigation timings", () => {
  it("holds the specified durations", () => {
    expect(NAV_COLLAPSE_MS).toBe(240);
    expect(NAV_TWEEN_MS).toBe(700);
    expect(NAV_FLASH_MS).toBe(900);
    expect(NAV_FLASH_STATIC_MS).toBe(600);
    expect(FALLBACK_HEADER_OFFSET).toBe(104);
  });
});
