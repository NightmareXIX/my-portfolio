// Chip click → the page flies to a section.
//
// Step 1 of that spec (the panel collapsing to the badge) is React state and lives in
// `components/Chatbot.tsx`; steps 2-4 — the tween, the landing flash, the travel toast's
// lifetime — are here, because they are DOM-level and the panel is unmounted by the time
// they run.
//
// SECURITY: every href below comes from the frozen `ACTIONS` table, never from `spec` fields
// the model could influence — `runAction` takes an `ActionId`, which only exists because the
// client already matched the token against that table. There is no string→href path.

import { ACTIONS, type ActionId, type SectionId } from "./actions";

/** Panel collapse, before the scroll starts. Read by Chatbot.tsx, which owns that step. */
export const NAV_COLLAPSE_MS = 240;
/** The scroll tween itself. */
export const NAV_TWEEN_MS = 700;
/** Landing beat, full motion. */
export const NAV_FLASH_MS = 900;
/** Landing beat, `prefers-reduced-motion: reduce` — a static outline, no animation. */
export const NAV_FLASH_STATIC_MS = 600;
/** Used when `.nav-wrap` can't be measured. Mirrors `html { scroll-padding-top }`. */
export const FALLBACK_HEADER_OFFSET = 104;
/** Breathing room between the fixed header's bottom edge and the section's top border. */
const HEADER_GAP = 14;

const FLASH_CLASS = "nav-flash";
const FLASH_STATIC_CLASS = "nav-flash-static";

type NavOptions = {
  /** Fires once the tween has landed AND the flash has finished — the travel toast's cue. */
  onSettled?: () => void;
};

export function easeInOutCubic(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Where the page should end up: the section's document-space top, lifted by the fixed header,
 * clamped into what the document can actually scroll. Pure — the clamp is the part worth
 * testing, since the last section can't reach the top of the viewport and the tween must not
 * spend 700ms easing toward a position the browser will refuse.
 */
export function targetScrollTop(sectionTop: number, headerOffset: number, maxScroll: number): number {
  const limit = Math.max(0, maxScroll);
  return Math.max(0, Math.min(sectionTop - headerOffset, limit));
}

/** Measured, not hardcoded: the header's height moves with the font-scale theme control. */
export function headerOffset(): number {
  const nav = document.querySelector<HTMLElement>(".nav-wrap");
  if (!nav) return FALLBACK_HEADER_OFFSET;
  const rect = nav.getBoundingClientRect();
  if (rect.height <= 0) return FALLBACK_HEADER_OFFSET;
  // `.nav-wrap` is `position: fixed`, so its viewport-space top IS its inset from the top.
  return rect.height + Math.max(0, rect.top) + HEADER_GAP;
}

/**
 * `data-section` first, `id` as the fallback. The two are on the same elements today; the
 * attribute exists so a future anchor rename can't silently break the chips.
 */
export function findSection(id: SectionId): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(`[data-section="${id}"]`) ??
    document.getElementById(id)
  );
}

export function isNavAction(id: ActionId): boolean {
  return "scrollTo" in ACTIONS[id];
}

// One navigation at a time. A second chip click mid-flight cancels the first outright rather
// than letting two rAF loops write `scrollY` on alternating frames.
let cancelTween: (() => void) | null = null;
let cancelFlash: (() => void) | null = null;

/** The landing beat. Re-adding the class needs a reflow or the animation won't restart. */
function land(el: HTMLElement, reduced: boolean, onSettled?: () => void): void {
  cancelFlash?.();
  const cls = reduced ? FLASH_STATIC_CLASS : FLASH_CLASS;
  el.classList.remove(FLASH_CLASS, FLASH_STATIC_CLASS);
  void el.offsetWidth;
  el.classList.add(cls);

  const timer = window.setTimeout(() => {
    el.classList.remove(cls);
    cancelFlash = null;
    onSettled?.();
  }, reduced ? NAV_FLASH_STATIC_MS : NAV_FLASH_MS);

  cancelFlash = () => {
    window.clearTimeout(timer);
    el.classList.remove(cls);
    cancelFlash = null;
    onSettled?.();
  };
}

/**
 * Hand-rolled rather than `scrollIntoView({ behavior: "smooth" })` so the duration is a known
 * 700ms and the flash can be fired exactly on arrival. Returns false if the section isn't in
 * the DOM — the caller treats that as "nothing happened" rather than pretending it travelled.
 */
export function navigateToSection(id: SectionId, opts: NavOptions = {}): boolean {
  if (typeof window === "undefined") return false;
  const el = findSection(id);
  if (!el) return false;

  cancelTween?.();
  cancelTween = null;

  const reduced = prefersReducedMotion();
  const from = window.scrollY;
  const to = targetScrollTop(
    el.getBoundingClientRect().top + from,
    headerOffset(),
    document.documentElement.scrollHeight - window.innerHeight
  );

  // `html { scroll-behavior: smooth }` in globals.css would otherwise hijack this: every
  // per-frame `scrollTo` would start its own smooth scroll, and — worse — the reduced-motion
  // jump below would become the exact scripted glide that rule exists to avoid. The tween
  // owns the property for its duration and hands it back untouched.
  const root = document.documentElement;
  const priorBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  const restore = () => { root.style.scrollBehavior = priorBehavior; };

  if (reduced || Math.abs(to - from) < 1) {
    window.scrollTo(0, to);
    restore();
    land(el, reduced, opts.onSettled);
    return true;
  }

  let raf = 0;
  let startedAt = 0;
  const step = (now: number) => {
    if (!startedAt) startedAt = now;
    const t = Math.min(1, (now - startedAt) / NAV_TWEEN_MS);
    window.scrollTo(0, from + (to - from) * easeInOutCubic(t));
    if (t < 1) {
      raf = window.requestAnimationFrame(step);
      return;
    }
    cancelTween = null;
    restore();
    land(el, false, opts.onSettled);
  };
  raf = window.requestAnimationFrame(step);

  cancelTween = () => {
    window.cancelAnimationFrame(raf);
    cancelTween = null;
    restore();
  };
  return true;
}

/** mailto: must navigate, not open a tab — a popup-blocked tab loses the address entirely. */
function openHref(href: string): void {
  if (href.startsWith("mailto:")) {
    window.location.href = href;
    return;
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

export type ActionOutcome = "nav" | "link" | "none";

/** The one entry point a chip click needs. Unknown ids can't reach here — see the header. */
export function runAction(id: ActionId, opts: NavOptions = {}): ActionOutcome {
  const spec = ACTIONS[id];
  if (!spec) return "none";
  if ("scrollTo" in spec) return navigateToSection(spec.scrollTo, opts) ? "nav" : "none";
  openHref(spec.href);
  return "link";
}
