"use client";

/**
 * MOTION PRIMITIVES.
 *
 * `prefers-reduced-motion: reduce` is honoured absolutely: every helper here
 * returns a no-op or an instant-final-state variant when reduced motion is on.
 * The rule is that the reduced-motion render is a complete, finished page — not
 * a degraded one. Nothing is revealed by animation only.
 */

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { driveScroll, invalidateScroll, tickScroll } from "./scroll-runtime";

/** SSR-safe layout effect. */
export const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The preference, read straight from the media query.
 *
 * Every effect that is about to start an animation must call this rather than
 * trust a React state value. State cannot be correct on the first commit —
 * the server does not know the preference — and one commit is long enough for
 * a scroll runner to set `opacity: 0` on half the page.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const MQ = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Live-updating reduced-motion flag.
 *
 * `useSyncExternalStore` so the value is correct on the first client render
 * rather than one commit late, and re-renders if the user changes the setting
 * while the page is open.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/**
 * How a direction's scroll should feel. Each direction passes its own, because
 * scroll weight is as much a part of its point of view as its typeface:
 * the instrument panel tracks tightly, the document has inertia.
 */
export interface ScrollFeel {
  /** Seconds for a wheel impulse to resolve. Higher = heavier. */
  duration?: number;
  /** Wheel delta scaling. Below 1 makes the page feel weighty. */
  wheelMultiplier?: number;
  touchMultiplier?: number;
}

/**
 * Lenis smooth scroll, scoped to a direction's layout.
 *
 * Skipped entirely under reduced motion — hijacking scroll is exactly what
 * that preference is asking us not to do. Also syncs Lenis to GSAP's ticker
 * so ScrollTrigger and Lenis do not fight over the frame.
 *
 * And, once it is up, Lenis drives the scroll runtime. Order inside the one
 * frame is: Lenis writes the scroll position → ScrollTrigger updates → every
 * scroll-driven value on the page is measured and painted. Waking that work
 * from a `scroll` listener instead, as it used to be, put it a frame behind
 * the position that caused it, which on a page where the colour, the hero
 * scrub and the particle field all follow the scroll is the whole difference
 * between tracking the hand and lagging it.
 */
export function useLenis(enabled = true, feel: ScrollFeel = {}): void {
  const reduced = useReducedMotion();
  const { duration = 1.05, wheelMultiplier = 1, touchMultiplier = 1.6 } = feel;

  useEffect(() => {
    if (!enabled || reduced) return;

    let destroyed = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (destroyed) return;

      gsap.registerPlugin(ScrollTrigger);

      // Anchor targets clear the fixed header with `scroll-margin-top`, which
      // native anchor scrolling honours and `lenis.scrollTo` does not. Read
      // the real computed value off the one target every page is required to
      // have, so the two can never drift apart.
      const main = document.getElementById("main");
      const clearance = main ? parseFloat(getComputedStyle(main).scrollMarginTop) || 0 : 0;

      const lenis = new Lenis({
        duration,
        // Gentle exponential ease-out. Long tail, no rubber-band overshoot.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier,
        touchMultiplier,
        // Lenis takes the anchors. The stylesheet used to hand them to native
        // smooth-scroll, which fought Lenis for the scroll position.
        anchors: { offset: -clearance },
      });

      lenis.on("scroll", ScrollTrigger.update);

      const releaseDrive = driveScroll();
      const tick = (time: number) => {
        lenis.raf(time * 1000);
        tickScroll(time * 1000);
      };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      // Pinning the hero changes the document's height under everything that
      // has measured it.
      invalidateScroll();

      cleanup = () => {
        gsap.ticker.remove(tick);
        releaseDrive();
        lenis.destroy();
      };
    })();

    return () => {
      destroyed = true;
      cleanup?.();
    };
  }, [enabled, reduced, duration, wheelMultiplier, touchMultiplier]);
}

/**
 * True once the element has entered the viewport. Used to mount 3D scenes and
 * start canvas loops only when visible, and to stop them when they are not.
 */
export function useInView<T extends Element>(
  options: { rootMargin?: string; threshold?: number; once?: boolean } = {},
): [React.RefObject<T | null>, boolean] {
  const { rootMargin = "200px", threshold = 0, once = false } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, once]);

  // No observer (very old browsers): treat as always in view without a
  // cascading setState. SSR and modern clients keep the observed value.
  const noObserver = typeof window !== "undefined" && typeof IntersectionObserver === "undefined";
  return [ref, noObserver || inView];
}

let webglSnapshot: boolean | undefined;

function subscribeWebGL(_onChange: () => void): () => void {
  return () => {};
}

function getWebGLSnapshot(): boolean {
  if (webglSnapshot !== undefined) return webglSnapshot;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglSnapshot = Boolean(gl);
    // Release the context immediately; we only wanted the answer.
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSnapshot = false;
  }
  return webglSnapshot;
}

/** WebGL availability, resolved once. Drives 3D fallbacks. */
export function useWebGLSupported(): boolean | null {
  return useSyncExternalStore(subscribeWebGL, getWebGLSnapshot, () => null);
}

/** Shared easing vocabulary, so timing feels like one hand made it. */
export const EASE = {
  /** Default for entrances. Fast out of the gate, long settle. */
  out: [0.16, 1, 0.3, 1] as const,
  /** Symmetric, for state changes and layout shifts. */
  inOut: [0.65, 0.05, 0.36, 1] as const,
  /** Mechanical. Slight anticipation, no bounce. For the "engineered" feel. */
  mech: [0.5, 0, 0.1, 1] as const,
  /** GSAP string equivalents. */
  gsapOut: "expo.out",
  gsapInOut: "power3.inOut",
  gsapMech: "power4.out",
} as const;

export const DUR = {
  micro: 0.18,
  fast: 0.32,
  base: 0.6,
  slow: 0.9,
  reveal: 1.2,
} as const;

/** Stagger helper: index → delay, capped so long lists never crawl. */
export function stagger(index: number, step = 0.06, cap = 0.6): number {
  return Math.min(index * step, cap);
}
