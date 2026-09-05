"use client";

/**
 * ONE SCROLL RUNTIME.
 *
 * Seven things on this page react to scroll: the field's progress, the colour
 * phase, the hero's pinned scrub, the stage index, the nav gauge, the nav's
 * ground, and the scene's photograph box. Each used to own a `scroll`
 * listener and a `requestAnimationFrame` of its own, which is two separate
 * problems.
 *
 * LAYOUT THRASH. Seven callbacks in a frame, each measuring and then writing.
 * Separate callbacks cannot be batched by the browser: a write invalidates
 * style for the whole document — `--phase` lives on the `.d3` root, so it
 * always does — and the next callback's `getBoundingClientRect` forces a full
 * recalculation and layout to answer it. On the built site that was 11.6
 * layout reads per frame and 42% of frames over budget while scrolling.
 *
 * LATENCY. A `scroll` listener that schedules a frame always describes where
 * the page *was*. Lenis writes the scroll position from inside its own frame;
 * a listener woken by that write cannot paint before the next one. Every
 * scroll-driven value trailed the scroll by a frame, and the particle field —
 * reading its progress inside a third loop, r3f's — by two.
 *
 * This is the fix for both. One listener, one frame, and inside that frame a
 * strict order: every reader runs before every writer. Reads see a clean
 * layout and share a single recalculation; writes happen with nothing left to
 * measure. When Lenis is running it drives this loop directly, so the frame
 * that moves the page is the frame that paints it.
 *
 * The contract is the entire point and the type system cannot enforce it:
 *
 *   · `read`  may measure. It must not touch the DOM.
 *   · `write` may touch the DOM. It must not measure.
 *
 * Breaking that puts the thrash back exactly where it was.
 */

export interface ScrollFrame {
  /** Seconds since the previous pass, clamped. Ease with this, not per frame. */
  dt: number;
  scrollY: number;
  vw: number;
  vh: number;
  /** `documentElement.scrollHeight`, measured with the rest of the reads. */
  docHeight: number;
  /** The viewport changed size this pass, so measurements are stale. */
  resized: boolean;
}

export interface ScrollSubscriber {
  /** Measure. Never mutate. Runs before every write in the frame. */
  read?: (frame: ScrollFrame) => void;
  /** Mutate. Never measure. Runs after every read in the frame. */
  write?: (frame: ScrollFrame) => void;
  /**
   * Lower runs first, within its phase. The shared story measurement claims
   * -1 so everything downstream of it reads a value from this frame rather
   * than the last one.
   */
  order?: number;
}

const subscribers = new Set<ScrollSubscriber>();
let ordered: ScrollSubscriber[] = [];
let listChanged = true;

const frame: ScrollFrame = { dt: 1 / 60, scrollY: 0, vw: 0, vh: 0, docHeight: 0, resized: false };

let raf = 0;
let last = 0;
let lastScrollY = -1;
let lastVw = -1;
let lastVh = -1;
/**
 * Frames still owed to subscribers that are converging on a target after the
 * scroll itself has stopped — the eased colour phase, mainly. They re-arm it
 * each pass while they need it, so a page at rest is genuinely idle.
 */
let awake = 0;
/** Lenis is ticking us. Scheduling our own frame would just double the work. */
let driven = false;
let listening = false;

function schedule(): void {
  if (driven || raf || typeof window === "undefined") return;
  raf = requestAnimationFrame(tick);
}

/**
 * Ask for at least `frames` more passes. Called from a write by anything that
 * has not finished easing, and on subscribe so a fresh consumer gets a first
 * pass even if the page never moves again.
 */
export function keepAwake(frames = 2): void {
  awake = Math.max(awake, frames);
  schedule();
}

function tick(now: number): void {
  raf = 0;

  const dt = last === 0 ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
  last = now;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scrollY = window.scrollY;
  const resized = vw !== lastVw || vh !== lastVh;
  const owed = awake > 0;
  if (owed) awake -= 1;

  // Nothing moved and nobody is mid-ease. Self-driven, the loop stops here;
  // driven by Lenis, this is the whole cost of a frame at rest.
  if (scrollY === lastScrollY && !resized && !owed) return;

  lastScrollY = scrollY;
  lastVw = vw;
  lastVh = vh;

  frame.dt = dt;
  frame.scrollY = scrollY;
  frame.vw = vw;
  frame.vh = vh;
  frame.resized = resized;
  // Read here rather than where it is wanted: layout is clean at the top of
  // the read phase, so this shares the one recalculation with everything else.
  frame.docHeight = document.documentElement.scrollHeight;

  if (listChanged) {
    ordered = [...subscribers].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    listChanged = false;
  }

  // The two phases. Nothing between them may write, and nothing after them
  // may read, or the frame costs two layouts instead of one.
  for (const s of ordered) s.read?.(frame);
  for (const s of ordered) s.write?.(frame);
}

function onScroll(): void {
  schedule();
}

function attach(): void {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

function detach(): void {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
}

/** Register for the frame. Returns the unsubscribe. */
export function subscribeScroll(sub: ScrollSubscriber): () => void {
  subscribers.add(sub);
  listChanged = true;
  attach();
  // Two passes, not one: the first establishes the shared measurements, the
  // second lets this subscriber act on them.
  keepAwake(2);
  return () => {
    subscribers.delete(sub);
    listChanged = true;
    if (!subscribers.size) detach();
  };
}

/**
 * Hand the loop to Lenis.
 *
 * Lenis runs on GSAP's ticker, writes the scroll position, and then calls
 * `tickScroll` in the same frame — which is the point. A `scroll` listener
 * woken by that write is a frame late by construction, and on a page where
 * the colour, the hero scrub and the particle field are all scroll-driven,
 * a frame late is exactly what "mushy" means.
 *
 * Returns the release, so a Lenis teardown hands the loop back.
 */
export function driveScroll(): () => void {
  driven = true;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  return () => {
    driven = false;
    last = 0;
    if (subscribers.size) schedule();
  };
}

/** The per-frame beat, called by whoever is driving. */
export function tickScroll(now: number): void {
  if (!driven || !subscribers.size) return;
  tick(now);
}

/**
 * Force the next pass to run even if the scroll position is unchanged.
 * For anything that invalidates a cached measurement out of band — fonts
 * landing, an accordion opening, the hero pinning itself.
 */
export function invalidateScroll(): void {
  lastScrollY = -1;
  lastVw = -1;
  keepAwake(2);
}

/**
 * Time-normalised exponential approach.
 *
 * `current += (target - current) * 0.06` is the usual shorthand and it is
 * wrong: it ties the rate to the frame rate, so the same easing settles twice
 * as fast on a 120Hz display as on a 60Hz one. `rate` here is per second.
 */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
