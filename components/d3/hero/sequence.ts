/**
 * The device sequence: what the frames are, and when each beat happens.
 *
 * `hp` is the reader's progress through the hero's pinned travel, 0 at the
 * top of the page and 1 the moment the frame unpins. Every beat below is a
 * span of `hp`, and the same spans drive three things that must agree — the
 * CSS on the frame (through `--hp`), the canvas that scrubs the frames, and
 * the particle field that takes the module's shape and carries it off.
 *
 * Kept in one module so a beat can be moved with one edit.
 */

import manifest from "@/public/device/manifest.json";

export interface Span {
  a: number;
  b: number;
}

/** How many viewports the frame stays pinned while the reader scrolls. */
export const PIN_TRAVEL_VH = 2.4;

export const BEATS = {
  /** The nudge under the title, gone as soon as the reader moves. */
  hint: { a: 0.02, b: 0.06 } as Span,
  /** Part labels retract into their parts, one after another. */
  callouts: { a: 0.05, b: 0.24 } as Span,
  /** Per-callout stagger, in `hp`. */
  calloutStep: 0.02,
  /** The exploded module closes. Linear over the frames: the clip is eased. */
  assemble: { a: 0.06, b: 0.58 } as Span,
  /** "Taken apart." lets go of its weight and lifts away. */
  titleApartOut: { a: 0.14, b: 0.28 } as Span,
  /** "Under load." takes weight as the module closes… */
  titleLoadIn: { a: 0.52, b: 0.66 } as Span,
  /** …and lets go once the module has gone to light. */
  titleLoadOut: { a: 0.84, b: 0.94 } as Span,
  /** The module glows from within. */
  glow: { a: 0.56, b: 0.72 } as Span,
  /** The field ignites on the module's silhouette; the ground under the frame lifts. */
  ignite: { a: 0.62, b: 0.76 } as Span,
  /** The photograph goes; the particles hold the shape, then leave. */
  dissolve: { a: 0.76, b: 0.92 } as Span,
} as const;

/** 0 before `s.a`, 1 after `s.b`, linear between. */
export function ramp(hp: number, s: Span): number {
  return Math.min(1, Math.max(0, (hp - s.a) / (s.b - s.a)));
}

/** The same, eased. */
export function smooth(hp: number, s: Span): number {
  const t = ramp(hp, s);
  return t * t * (3 - 2 * t);
}

export const FRAMES = {
  count: manifest.count,
  sizes: manifest.sizes as number[],
  aspect: manifest.aspect,
  heights: manifest.heights as Record<string, number>,
  dir: "/device",
} as const;

export function framePath(size: number, index: number): string {
  return `${FRAMES.dir}/${size}/f${String(index).padStart(3, "0")}.webp`;
}

export function stillPath(kind: "exploded" | "assembled", size: number): string {
  return `${FRAMES.dir}/${kind}-${size}.webp`;
}

/** Which frame the reader is on at `hp`. */
export function frameAt(hp: number): number {
  return Math.round(ramp(hp, BEATS.assemble) * (FRAMES.count - 1));
}
