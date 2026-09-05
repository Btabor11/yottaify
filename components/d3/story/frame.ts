"use client";

/**
 * WHERE THE READER IS, MEASURED ONCE.
 *
 * Five things want this number: the scene's morph progress, the colour phase,
 * the hero's scrub, the stage index, and the mount's progress ref. Each used
 * to take the pin host's rect and run `measureStory` on its own cache, which
 * is the same layout read four times over and four chances for them to
 * disagree about where the current is by a frame.
 *
 * Now it is read once, at the head of the scroll runtime's read phase, and
 * everything downstream reads plain numbers off `STORY_FRAME`. Because it
 * claims the first slot in the frame, a consumer reading it in either phase
 * is reading this frame's value, not the last one's.
 *
 * `mountStoryFrame` is reference-counted: the first consumer starts the
 * measurement, the last one stops it. On a route with no story the map stays
 * null and consumers fall back to whatever they did before.
 */

import { subscribeScroll, type ScrollFrame } from "@/lib/scroll-runtime";
import { heroProgressAt, measureStory, phaseAt, shapeIndexAt, type StoryMap } from "./progress";

export interface StoryFrame {
  /** Null until the pin host is in the document, and on routes without one. */
  map: StoryMap | null;
  /** Scroll offset into the story, clamped to its scrollable span. */
  y: number;
  /** `y` as 0..1 — what the field morphs by and what the gauge reads. */
  progress: number;
  /** Fractional index into SHAPE_ORDER. */
  shapeIndex: number;
  /** 0..1 through the hero's pinned travel. */
  heroProgress: number;
  /** 0..1 colour phase: ember at the horizon, hbm once the die has formed. */
  phase: number;
}

/**
 * Mutable on purpose. This is read every frame by five consumers; allocating
 * a fresh object for each of them would be the only garbage this page makes
 * while scrolling.
 */
export const STORY_FRAME: StoryFrame = {
  map: null,
  y: 0,
  progress: 0,
  shapeIndex: 0,
  heroProgress: 0,
  phase: 0,
};

let host: HTMLElement | null = null;
let refs = 0;
let release: (() => void) | null = null;

const reader = {
  order: -1,
  read(frame: ScrollFrame) {
    if (!host || !host.isConnected) {
      host = document.querySelector<HTMLElement>("[data-pin-host]");
      if (!host) return;
    }
    const rect = host.getBoundingClientRect();
    // Re-measure when the story's height changes — a resize, fonts landing,
    // the hero pinning itself. Cheap to check, expensive to do.
    if (!STORY_FRAME.map || STORY_FRAME.map.height !== rect.height || frame.resized) {
      STORY_FRAME.map = measureStory(host);
    }
    const map = STORY_FRAME.map;
    const y = Math.min(map.span, Math.max(0, -rect.top));
    STORY_FRAME.y = y;
    STORY_FRAME.progress = y / map.span;
    STORY_FRAME.shapeIndex = shapeIndexAt(y, map);
    STORY_FRAME.heroProgress = heroProgressAt(y, map);
    STORY_FRAME.phase = phaseAt(y, map);
  },
} satisfies Parameters<typeof subscribeScroll>[0];

/** Start the shared measurement. Reference-counted; returns the release. */
export function mountStoryFrame(): () => void {
  refs += 1;
  if (refs === 1) release = subscribeScroll(reader);
  return () => {
    refs -= 1;
    if (refs === 0) {
      release?.();
      release = null;
      host = null;
      STORY_FRAME.map = null;
    }
  };
}
