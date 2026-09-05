/**
 * Where the reader is in the story, measured off the page rather than assumed.
 *
 * The stage used to map scroll to shape uniformly — a seventh of the story
 * per chapter — which held only while every chapter was exactly one viewport
 * tall. The hero now pins a frame for several viewports, so the mapping is
 * read from the layout instead: each chapter's top edge is the point at which
 * its shape is fully formed, and the field interpolates between neighbours.
 *
 * One measurement, shared by the scene, the stage index and the colour phase,
 * so nothing on the stage disagrees about where the current is.
 */

import { BEATS, PIN_TRAVEL_VH } from "../hero/sequence";
import { SHAPE_ORDER } from "./shapes";

export interface StoryMap {
  /** Scroll offset into the story at which each shape in SHAPE_ORDER is fully formed. */
  anchors: number[];
  /** The hero's pinned travel: where it starts, and how far it runs. */
  hero: { top: number; span: number };
  /** The story's own scrollable span: host height less one viewport. */
  span: number;
  /** Host height at measurement, so a stale map can be noticed cheaply. */
  height: number;
}

/**
 * Measure the story once. Cheap — a handful of rects — but a layout read, so
 * callers cache the result and re-measure on resize or when the host's height
 * changes.
 */
export function measureStory(host: HTMLElement): StoryMap {
  const vh = window.innerHeight;
  const hostRect = host.getBoundingClientRect();
  const offset = (el: Element) => el.getBoundingClientRect().top - hostRect.top;
  const span = Math.max(1, hostRect.height - vh);

  const pin = host.querySelector<HTMLElement>("[data-hero-pin]");
  const hero = pin
    ? { top: offset(pin), span: Math.max(1, pin.getBoundingClientRect().height - vh) }
    : { top: 0, span: Math.max(1, vh * PIN_TRAVEL_VH) };

  const byShape = new Map<string, number>();
  host.querySelectorAll<HTMLElement>(".d3-chapter[data-shape]").forEach((el) => {
    const shape = el.dataset.shape ?? "";
    if (!byShape.has(shape)) byShape.set(shape, offset(el));
  });

  const anchors: number[] = [];
  let last = -Infinity;
  SHAPE_ORDER.forEach((shape, i) => {
    let at: number;
    if (i === 0) {
      // The device is whole when the photograph starts to go.
      at = hero.top + BEATS.dissolve.a * hero.span;
    } else {
      at = byShape.get(shape) ?? last + vh;
    }
    at = Math.min(span, Math.max(0, at));
    // Strictly increasing, or the interpolation below divides by zero.
    if (at <= last) at = last + 1;
    anchors.push(at);
    last = at;
  });

  return { anchors, hero, span, height: hostRect.height };
}

/** Fractional shape index (0 .. SHAPE_ORDER.length - 1) at scroll offset `y`. */
export function shapeIndexAt(y: number, map: StoryMap): number {
  const a = map.anchors;
  const n = a.length;
  if (y <= a[0]) return 0;
  if (y >= a[n - 1]) return n - 1;
  let k = 0;
  while (k < n - 2 && y >= a[k + 1]) k++;
  return k + (y - a[k]) / (a[k + 1] - a[k]);
}

/** Progress through the hero's pinned travel, 0..1. */
export function heroProgressAt(y: number, map: StoryMap): number {
  return Math.min(1, Math.max(0, (y - map.hero.top) / map.hero.span));
}

/**
 * The colour phase: 0 at the horizon, 1 once the last chapter has formed.
 * The device beat before the horizon is ember, and stays ember.
 */
export function phaseAt(y: number, map: StoryMap): number {
  const t = shapeIndexAt(y, map);
  return Math.min(1, Math.max(0, (t - 1) / (SHAPE_ORDER.length - 2)));
}
