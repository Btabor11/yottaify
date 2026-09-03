"use client";

/**
 * D3's single motion root. Three jobs, one rAF budget.
 *
 * 1. PHASE. Scroll progress through the document is written to `--phase` on
 *    the .d3 root. Every accent on the page is a color-mix against that
 *    number, so the whole document changes temperature as you descend it:
 *    volt cyan at the top, plasma violet at the bottom. This is the direction's
 *    animated colour, and it costs one custom-property write per frame rather
 *    than a repaint per element.
 *
 * 2. LOAD. `data-load` elements animate their variable-font width axis from
 *    narrow to wide as they enter — type that takes up load. Because the axis
 *    is a font-variation-setting and not a transform, the strokes stay correct
 *    and the layout is reserved at the final width from first paint.
 *
 * 3. REVEAL. `data-r`, `data-r-group`, `data-r-bar` — the same declarative
 *    vocabulary as D1, so components stay markup.
 *
 * Under reduced motion none of this runs: `--phase` is pinned by CSS and every
 * element is already in its finished state.
 */

import { useEffect } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion";

export function Field() {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Checked again imperatively: React state cannot be right on the first
    // commit, and one commit is long enough to hide half the page.
    if (reduced || prefersReducedMotion()) return;

    const root = document.querySelector<HTMLElement>(".d3");
    if (!root) return;

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;
    let raf = 0;

    // --- 1. phase ---------------------------------------------------------
    let target = 0;
    let current = 0;
    let written = -1;

    /**
     * The palette advances in steps, not continuously.
     *
     * `--phase` feeds `--accent`, and most of the page paints with `--accent`,
     * so every distinct value costs a style recalculation and repaint of the
     * entire document. Writing one per frame spent the whole frame budget on
     * it and scrolling fell to a crawl. Sixty steps across a page this tall is
     * a colour change every few hundred pixels of scroll, which on a drift
     * this slow and this gradual in oklch is below what the eye picks out —
     * and it is roughly two orders of magnitude less work.
     */
    const STEPS = 60;

    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      // Eased follow, so a flick of the wheel does not strobe the palette.
      current += (target - current) * 0.06;
      const step = Math.round(current * STEPS);
      if (step !== written) {
        written = step;
        root.style.setProperty("--phase", (step / STEPS).toFixed(4));
      }
      // Close enough to have stopped moving: let the loop end rather than
      // chase the last fraction forever, so a page at rest is genuinely idle.
      // Land exactly on the target's step first, or a run that stops just shy
      // of a boundary leaves the palette one step behind where it belongs.
      if (Math.abs(target - current) < 1 / (STEPS * 4)) {
        current = target;
        const settled = Math.round(target * STEPS);
        if (settled !== written) {
          written = settled;
          root.style.setProperty("--phase", (settled / STEPS).toFixed(4));
        }
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    readScroll();
    current = target;
    written = Math.round(current * STEPS);
    root.style.setProperty("--phase", (written / STEPS).toFixed(4));
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);

    // --- 2 + 3. gsap ------------------------------------------------------
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || prefersReducedMotion()) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Type under load. Animating the axis via a proxy object rather than
        // gsap's CSS plugin, because font-variation-settings is a string.
        gsap.utils.toArray<HTMLElement>("[data-load]").forEach((el) => {
          const from = Number(el.dataset.loadFrom ?? 62);
          const to = Number(el.dataset.loadTo ?? 100);
          const state = { w: from };
          el.style.setProperty("--wdth", String(from));
          gsap.to(state, {
            w: to,
            duration: 1.3,
            ease: "expo.out",
            onUpdate: () => el.style.setProperty("--wdth", state.w.toFixed(1)),
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-r]").forEach((el) => {
          gsap.set(el, { opacity: 0, y: Number(el.dataset.rY ?? 20) });
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-r-group]").forEach((group) => {
          const kids = Array.from(group.children) as HTMLElement[];
          if (!kids.length) return;
          gsap.set(kids, { opacity: 0, y: 24 });
          gsap.to(kids, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: "expo.out",
            stagger: 0.06,
            scrollTrigger: { trigger: group, start: "top 86%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-r-bars]").forEach((group) => {
          const bars = gsap.utils.toArray<HTMLElement>("[data-r-bar]", group);
          if (!bars.length) return;
          gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });
          gsap.to(bars, {
            scaleX: 1,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.08,
            scrollTrigger: { trigger: group, start: "top 80%", once: true },
          });
        });

        // Columns rise from the baseline. Separate from bars because a column
        // that grew from its centre would read as a glitch, not as a load.
        gsap.utils.toArray<HTMLElement>("[data-r-cols]").forEach((group) => {
          const cols = gsap.utils.toArray<HTMLElement>("[data-r-col]", group);
          if (!cols.length) return;
          gsap.set(cols, { scaleY: 0, transformOrigin: "center bottom" });
          gsap.to(cols, {
            scaleY: 1,
            duration: 1.25,
            ease: "power4.out",
            stagger: 0.07,
            scrollTrigger: { trigger: group, start: "top 82%", once: true },
          });
        });

        // Figures that count up. The final value is already in the DOM, so a
        // crawler and a reduced-motion reader both see the real number.
        gsap.utils.toArray<HTMLElement>("[data-count-to]").forEach((el) => {
          const to = Number(el.dataset.countTo);
          if (!Number.isFinite(to)) return;
          const decimals = Number(el.dataset.countDecimals ?? 0);
          const state = { v: 0 };
          gsap.to(state, {
            v: to,
            duration: 1.5,
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
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      ctx?.revert();
      root.style.removeProperty("--phase");
    };
  }, [reduced]);

  return null;
}
