"use client";

/**
 * D3's single motion root. Three jobs, one rAF budget.
 *
 * 1. PHASE. Scroll progress through the story is written to `--phase` on
 *    the .d3 root. Every live colour on the page is a color-mix against that
 *    number, so the page changes temperature as the current travels: ember at
 *    the service, hbm once it reaches memory. This is the direction's animated
 *    colour, and it costs one custom-property write per step rather than a
 *    repaint per element.
 *
 * 2. LOAD. `data-load` elements animate their variable-font weight axis from
 *    hairline to full as they enter — type that takes load. Because the axis
 *    is a font-variation-setting and not a transform, the strokes stay correct
 *    and the layout is reserved at the final weight from first paint.
 *
 * 3. REVEAL. `data-r`, `data-r-group`, `data-r-bar` — the same declarative
 *    vocabulary as D1, so components stay markup.
 *
 * Under reduced motion none of this runs: `--phase` is pinned by CSS and every
 * element is already in its finished state.
 */

import { useEffect } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion";
import { approach, keepAwake, subscribeScroll } from "@/lib/scroll-runtime";
import { mountStoryFrame, STORY_FRAME } from "./story/frame";

/**
 * Wrap each rendered line of an element's direct text into a block span with
 * `white-space: nowrap`, measured at the element's current (resting) weight.
 * Child elements — the italic voice clause is already a block — are left
 * alone. Text content is unchanged, so the accessible name is unchanged.
 */
function lockLines(el: HTMLElement) {
  if (el.dataset.linesLocked) return;
  el.dataset.linesLocked = "1";
  // JSX like `{a}. {b}.` renders as several text nodes separated by the
  // `<!-- -->` markers the server puts between them. Drop the markers and
  // merge the text, or a lone full stop becomes a line of its own.
  for (const n of Array.from(el.childNodes)) if (n.nodeType === Node.COMMENT_NODE) n.remove();
  el.normalize();
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
    const parts = node.textContent.split(/(\s+)/).filter(Boolean);
    const probes = parts.map((p) => {
      const s = document.createElement("span");
      s.textContent = p;
      return s;
    });
    const frag = document.createDocumentFragment();
    probes.forEach((s) => frag.appendChild(s));
    node.replaceWith(frag);

    const lines: HTMLSpanElement[][] = [];
    let top: number | null = null;
    for (const s of probes) {
      const r = s.getBoundingClientRect();
      // Whitespace probes have no box of their own; keep them with the
      // preceding word so the line's text reads back exactly.
      if (r.width === 0 && lines.length) {
        lines[lines.length - 1].push(s);
        continue;
      }
      if (top === null || Math.abs(r.top - top) > 1) {
        top = r.top;
        lines.push([]);
      }
      lines[lines.length - 1].push(s);
    }
    for (const line of lines) {
      const wrap = document.createElement("span");
      wrap.className = "d3-line";
      line[0].before(wrap);
      wrap.textContent = line.map((s) => s.textContent).join("");
      line.forEach((s) => s.remove());
    }
  }
}

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

    // --- 1. phase ---------------------------------------------------------
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
    /**
     * Per second, not per frame. The old `* 0.06` each frame tied the settle
     * to the refresh rate — the same scroll cooled twice as fast on a 120Hz
     * display as on a 60Hz one.
     */
    const FOLLOW = 3.7;
    /**
     * The floor on the interval between two writes, in seconds.
     *
     * `--phase` is an inherited custom property on the `.d3` root, so a single
     * write invalidates the computed style of the entire document — about
     * 2,500 elements — whether or not they use `--live`. Blink will not prune
     * that walk, and re-declaring `--phase` further down does not stop it
     * (measured: it saves 6%). Sixty steps bound how *finely* the colour
     * travels; nothing bounded how *often* it was written, so a fast scroll
     * spent the frame budget recalculating style. On the built page that was
     * 2.2s of style recalc in a 6s read-through and 22% of frames dropped.
     *
     * Ten writes a second costs 6%, and the difference is invisible: the ease
     * below already has a ~270ms time constant, so the colour cannot move a
     * perceptible amount inside 100ms. A settling write ignores the floor, so
     * the resting colour is always exactly right.
     */
    const MIN_WRITE_INTERVAL = 0.1;

    // Phase is the reader's position in the story, not in the document: ember
    // through the device and the horizon, cooling chapter by chapter until the
    // current reaches the die, and staying there through the paperwork. The
    // chapter positions come from the shared story measurement. Pages without
    // a story fall back to the document.
    const releaseStory = mountStoryFrame();
    const targetPhase = (docHeight: number, vh: number, scrollY: number) => {
      if (STORY_FRAME.map) return STORY_FRAME.phase;
      const max = docHeight - vh;
      return max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    };

    let sinceWrite = 0;
    const writePhase = (value: number) => {
      const step = Math.round(value * STEPS);
      if (step === written) return;
      written = step;
      sinceWrite = 0;
      root.style.setProperty("--phase", (step / STEPS).toFixed(4));
    };

    let primed = false;
    const releaseScroll = subscribeScroll({
      // Nothing to measure: the story frame has already done it, and the
      // document fallback rides on numbers the runtime read for everyone.
      write: (frame) => {
        const target = targetPhase(frame.docHeight, frame.vh, frame.scrollY);
        // A reload halfway down the page starts at the colour that belongs
        // there. Only movement from then on is eased.
        if (!primed) {
          primed = true;
          current = target;
          writePhase(target);
          return;
        }
        current = approach(current, target, FOLLOW, frame.dt);
        sinceWrite += frame.dt;
        // Close enough to have stopped: land exactly on the target's step
        // rather than chase the last fraction, so a page at rest is idle.
        // Snapping first, or a run that stops just shy of a boundary leaves
        // the palette one step behind where it belongs. This write ignores
        // the interval floor — the colour it lands on is the one that stays.
        if (Math.abs(target - current) < 1 / (STEPS * 4)) {
          current = target;
          writePhase(target);
          return;
        }
        if (sinceWrite >= MIN_WRITE_INTERVAL) writePhase(current);
        keepAwake();
      },
    });

    // --- 2 + 3. gsap ------------------------------------------------------
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        // Line locking measures the display face; measuring the fallback
        // would lock the wrong breaks.
        document.fonts?.ready ?? Promise.resolve(),
      ]);
      if (cancelled || prefersReducedMotion()) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Type under load. The weight axis is driven through a custom
        // property via a proxy object rather than gsap's CSS plugin, because
        // font-variation-settings is a string. A headline enters as a
        // hairline and thickens to its resting weight.
        gsap.utils.toArray<HTMLElement>("[data-load]").forEach((el) => {
          const from = Number(el.dataset.loadFrom ?? 300);
          const to = Number(el.dataset.loadTo ?? 760);
          // Lock the line breaks at the resting weight before the weight
          // moves. Glyph advances change with weight, and a headline that
          // re-wraps mid-charge is a layout shift the reader feels.
          lockLines(el);
          const state = { w: from };
          el.style.setProperty("--wght", String(from));
          gsap.to(state, {
            w: to,
            duration: 1.4,
            ease: "expo.out",
            onUpdate: () => el.style.setProperty("--wght", state.w.toFixed(0)),
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
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
      releaseScroll();
      releaseStory();
      ctx?.revert();
      root.style.removeProperty("--phase");
    };
  }, [reduced]);

  return null;
}
