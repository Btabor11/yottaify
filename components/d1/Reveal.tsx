"use client";

/**
 * D1 SCROLL CHOREOGRAPHY — one effect for the whole page.
 *
 * Components mark themselves up declaratively:
 *
 *   data-reveal              a single element
 *   data-reveal-group        stagger the element's direct children
 *   data-reveal-bar          scale a bar from its left edge
 *   data-reveal-rule         draw a hairline from its left edge
 *
 * The hidden start state is applied by JavaScript (gsap.set), never by CSS.
 * If this script fails to run, or reduced motion is on, every element is
 * simply already in its finished position — the page is complete without it.
 */

import { useEffect } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion";

export function RevealRoot({ scope }: { scope?: string }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Checked again here, imperatively. The state value above re-runs this
    // effect if the preference changes mid-session, but the media query is
    // the only thing that can be trusted before the first hidden state is set.
    if (reduced || prefersReducedMotion()) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || prefersReducedMotion()) return;

      gsap.registerPlugin(ScrollTrigger);

      const root = scope ? document.querySelector<HTMLElement>(scope) : document.body;
      if (!root) return;

      ctx = gsap.context(() => {
        // --- single elements -------------------------------------------------
        const singles = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
        singles.forEach((el) => {
          const dy = Number(el.dataset.revealY ?? 18);
          gsap.set(el, { opacity: 0, y: dy });
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        // --- staggered groups ------------------------------------------------
        const groups = gsap.utils.toArray<HTMLElement>("[data-reveal-group]", root);
        groups.forEach((group) => {
          const kids = Array.from(group.children) as HTMLElement[];
          if (!kids.length) return;
          const dy = Number(group.dataset.revealY ?? 22);
          gsap.set(kids, { opacity: 0, y: dy });
          gsap.to(kids, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "expo.out",
            stagger: { each: 0.055, from: "start" },
            scrollTrigger: { trigger: group, start: "top 86%", once: true },
          });
        });

        // --- bars ------------------------------------------------------------
        // Bars grow left to right, fastest at the start, so a long bar reads as
        // "that is a lot" rather than "that is slow".
        const barGroups = gsap.utils.toArray<HTMLElement>("[data-reveal-bars]", root);
        barGroups.forEach((group) => {
          const bars = gsap.utils.toArray<HTMLElement>("[data-reveal-bar]", group);
          if (!bars.length) return;
          gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });
          gsap.to(bars, {
            scaleX: 1,
            duration: 1.15,
            ease: "power4.out",
            stagger: 0.075,
            scrollTrigger: { trigger: group, start: "top 78%", once: true },
          });
        });

        // --- rules -----------------------------------------------------------
        const rules = gsap.utils.toArray<HTMLElement>("[data-reveal-rule]", root);
        rules.forEach((el) => {
          gsap.set(el, { scaleX: 0, transformOrigin: "left center" });
          gsap.to(el, {
            scaleX: 1,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        });

        // --- counters --------------------------------------------------------
        // Only ever used on figures that are already printed in the DOM, so the
        // real number is what a crawler and a reduced-motion user see.
        const counters = gsap.utils.toArray<HTMLElement>("[data-count-to]", root);
        counters.forEach((el) => {
          const to = Number(el.dataset.countTo);
          if (!Number.isFinite(to)) return;
          const decimals = Number(el.dataset.countDecimals ?? 0);
          const state = { v: 0 };
          gsap.to(state, {
            v: to,
            duration: 1.4,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = state.v.toLocaleString("en-US", {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              });
            },
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });
      }, root);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, scope]);

  return null;
}
