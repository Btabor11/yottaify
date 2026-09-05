"use client";

/**
 * The hero's motion root. Renders nothing; drives the markup Hero.tsx put in
 * the document.
 *
 * Three jobs, one rAF per scroll event:
 *
 * 1. PROGRESS. `--hp`, the reader's position through the pinned frame, is
 *    written to the hero root, and the CSS does every beat that is a pure
 *    function of it — labels retracting, titles trading weight, the ground
 *    lifting, the photograph going.
 * 2. FRAMES. A canvas over the still scrubs the assembly sequence. Frames are
 *    fetched as compressed bytes in a coarse-to-fine order, so the scrub is
 *    usable early, and decoded on demand into a small window around the
 *    current frame — a few dozen decoded 1280-wide frames would be a quarter
 *    of a gigabyte, which no page is worth. The still stays under the canvas
 *    until the first frame is drawn, so there is never a blank box.
 * 3. COPY. Each block of the headline copy is set back a little and brought
 *    home as it enters, in order, so the copy arrives with the scroll rather
 *    than all at once.
 *
 * Under reduced motion none of this runs and the markup stands as the server
 * sent it: the exploded view, its labels, the title, then the copy. Without
 * `[data-live]` on the root every rule that moves anything is inert.
 */

import { useEffect } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/lib/motion";
import { keepAwake, subscribeScroll } from "@/lib/scroll-runtime";
import { mountStoryFrame, STORY_FRAME } from "../story/frame";
import { BEATS, FRAMES, frameAt, framePath, smooth } from "./sequence";

/** `--hp` is quantised so a smooth scroll costs a style recalc every ~0.6px of a 240vh travel, not every frame. */
const HP_STEPS = 400;
/** Decoded frames kept around the current one. */
const WINDOW = 14;
/** Parallel frame fetches. */
const LANES = 4;
/** Blocks reveal once their top crosses this fraction of the viewport. */
const REVEAL_AT = 0.88;

type Decoded = ImageBitmap | HTMLImageElement;

/** Frame indices in the order worth having them: ends first, then halves, quarters… */
function coarseToFine(n: number): number[] {
  const order = [0, n - 1];
  const seen = new Set(order);
  const queue: [number, number][] = [[0, n - 1]];
  while (queue.length) {
    const [a, b] = queue.shift()!;
    const m = (a + b) >> 1;
    if (m === a || m === b) continue;
    if (!seen.has(m)) {
      seen.add(m);
      order.push(m);
    }
    queue.push([a, m], [m, b]);
  }
  for (let i = 0; i < n; i++) if (!seen.has(i)) order.push(i);
  return order;
}

async function decodeBlob(blob: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") return createImageBitmap(blob);
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function release(d: Decoded) {
  if ("close" in d) d.close();
}

export function HeroSequence() {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Checked again imperatively: React state cannot be right on the first
    // commit, and one commit is enough to start work we should not do.
    if (reduced || prefersReducedMotion()) return;

    const host = document.querySelector<HTMLElement>("[data-hero-host]");
    const root = document.querySelector<HTMLElement>(".d3");
    const box = host?.querySelector<HTMLElement>("[data-device-box]");
    const canvas = host?.querySelector<HTMLCanvasElement>(".d3-hero-canvas");
    if (!host || !root || !box || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    host.dataset.live = "";
    const abort = new AbortController();
    let disposed = false;

    /* ---- frames -------------------------------------------------------- */
    // The 1280 set where the labels are; the 720 set below that, where the
    // picture is at most a phone wide.
    const wide = window.matchMedia("(min-width: 64rem)").matches;
    const size = wide ? Math.max(...FRAMES.sizes) : Math.min(...FRAMES.sizes);
    const blobs: (Blob | null)[] = new Array(FRAMES.count).fill(null);
    const decoded = new Map<number, Decoded>();
    const decoding = new Set<number>();
    let wanted = 0;
    let drawnFrame = -1;
    let drawnGlow = -1;
    let drawnW = 0;

    const nearest = (i: number): number | null => {
      let best: number | null = null;
      let dist = Infinity;
      for (const k of decoded.keys()) {
        const d = Math.abs(k - i);
        if (d < dist) {
          dist = d;
          best = k;
        }
      }
      return best;
    };

    const evict = () => {
      while (decoded.size > WINDOW) {
        let far: number | null = null;
        let dist = -1;
        for (const k of decoded.keys()) {
          const d = Math.abs(k - wanted);
          if (d > dist) {
            dist = d;
            far = k;
          }
        }
        if (far === null) break;
        release(decoded.get(far)!);
        decoded.delete(far);
      }
    };

    const decode = (i: number) => {
      if (i < 0 || i >= FRAMES.count || decoded.has(i) || decoding.has(i)) return;
      const blob = blobs[i];
      if (!blob) return;
      decoding.add(i);
      void decodeBlob(blob)
        .then((d) => {
          decoding.delete(i);
          if (disposed) {
            release(d);
            return;
          }
          decoded.set(i, d);
          evict();
          // A frame the reader is waiting on, or a better neighbour: draw.
          // Frames arrive after the scroll that wanted them, so ask for a
          // pass rather than wait for the next wheel event.
          if (i === wanted || nearest(wanted) === i) keepAwake();
        })
        .catch(() => decoding.delete(i));
    };

    const fetchAll = async () => {
      const order = coarseToFine(FRAMES.count);
      let next = 0;
      const lane = async () => {
        while (next < order.length && !disposed) {
          const i = order[next++];
          try {
            const res = await fetch(framePath(size, i), { signal: abort.signal, priority: "low" } as RequestInit);
            if (!res.ok) continue;
            blobs[i] = await res.blob();
            // Keep the reader's neighbourhood decoded as bytes arrive.
            if (Math.abs(i - wanted) <= 2 || decoded.size === 0) decode(i);
          } catch {
            if (disposed) return;
          }
        }
      };
      await Promise.all(Array.from({ length: LANES }, lane));
    };

    /* ---- drawing ------------------------------------------------------- */
    // The box's width, taken in the frame's read phase. `fit` only writes.
    let boxWidth = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Never a backing store larger than the source: it is only upscaling.
      const w = Math.max(1, Math.min(size, Math.round(boxWidth * dpr)));
      if (w === drawnW) return false;
      drawnW = w;
      canvas.width = w;
      canvas.height = Math.max(1, Math.round(w / FRAMES.aspect));
      drawnFrame = -1;
      return true;
    };

    // `getComputedStyle` resolves the live colour, which moves with `--phase`
    // — sixty steps over the whole story, so at most a handful of them across
    // the glow beat. Read in the read phase, where style is clean, and held
    // until the phase actually moves; called from the draw it forced a style
    // recalculation every frame the glow changed.
    let colourCache = "255, 138, 76";
    let colourAt = "";
    const readLiveColour = () => {
      const phase = root.style.getPropertyValue("--phase");
      if (phase === colourAt) return;
      colourAt = phase;
      const m = getComputedStyle(canvas).color.match(/\d+(\.\d+)?/g);
      if (m && m.length >= 3) colourCache = `${m[0]}, ${m[1]}, ${m[2]}`;
    };

    const draw = (hp: number) => {
      wanted = frameAt(hp);
      decode(wanted);
      decode(wanted + 1);
      decode(wanted - 1);
      decode(wanted + 2);
      const use = decoded.has(wanted) ? wanted : nearest(wanted);
      if (use === null) return;
      const glow = Math.round(smooth(hp, BEATS.glow) * 40) / 40;
      if (use === drawnFrame && glow === drawnGlow) return;
      const img = decoded.get(use)!;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      if (glow > 0) {
        // Light from inside the module: a wash in the page's live colour,
        // clipped to the picture's own alpha.
        ctx.globalCompositeOperation = "source-atop";
        const rgb = colourCache;
        const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.42);
        g.addColorStop(0, `rgba(${rgb}, ${(0.62 * glow).toFixed(3)})`);
        g.addColorStop(0.55, `rgba(${rgb}, ${(0.28 * glow).toFixed(3)})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }
      drawnFrame = use;
      drawnGlow = glow;
      if (host.dataset.drawn === undefined) host.dataset.drawn = "";
    };

    /* ---- copy reveals -------------------------------------------------- */
    // Observed, not measured. Walking the pending blocks with
    // `getBoundingClientRect` on every scroll frame was a layout read per
    // block for a state that changes once each.
    const pending = new Set<HTMLElement>();
    const hide = (el: HTMLElement) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(1.25rem)";
      if (el.hasAttribute("data-hp-charge")) el.style.setProperty("--wght", "180");
      pending.add(el);
    };
    const show = (el: HTMLElement) => {
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
      el.style.removeProperty("--wght");
      pending.delete(el);
    };
    // Blocks already on screen — a reload mid-page — are left exactly as they
    // are. Only what is still below the fold gets the entrance.
    const threshold = window.innerHeight * REVEAL_AT;
    for (const el of host.querySelectorAll<HTMLElement>("[data-hp-reveal]")) {
      if (el.getBoundingClientRect().top >= threshold) hide(el);
    }
    const reveals = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          show(e.target as HTMLElement);
          reveals.unobserve(e.target);
        }
      },
      // The root's bottom edge pulled up to REVEAL_AT, so a block enters at
      // the same place the measured version brought it home.
      { rootMargin: `0px 0px -${Math.round((1 - REVEAL_AT) * 100)}% 0px` },
    );
    for (const el of pending) reveals.observe(el);

    /* ---- the loop ------------------------------------------------------ */
    let written = -1;
    let pinnedProgress = 0;
    const releaseStory = mountStoryFrame();
    const releaseScroll = subscribeScroll({
      read: () => {
        // The hero's travel is part of the story's single measurement; the
        // box's width and the live colour are the only things left to take,
        // and both are free here because layout and style are already clean.
        pinnedProgress = STORY_FRAME.map ? STORY_FRAME.heroProgress : 0;
        boxWidth = box.getBoundingClientRect().width;
        readLiveColour();
      },
      write: () => {
        if (fit()) drawnGlow = -1;
        const q = Math.round(pinnedProgress * HP_STEPS);
        if (q !== written) {
          written = q;
          host.style.setProperty("--hp", (q / HP_STEPS).toFixed(4));
        }
        draw(pinnedProgress);
      },
    });

    void fetchAll();

    return () => {
      disposed = true;
      abort.abort();
      releaseScroll();
      releaseStory();
      reveals.disconnect();
      for (const d of decoded.values()) release(d);
      decoded.clear();
      for (const el of pending) show(el);
      delete host.dataset.live;
      delete host.dataset.drawn;
      host.style.removeProperty("--hp");
    };
  }, [reduced]);

  return null;
}
