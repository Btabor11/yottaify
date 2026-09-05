/**
 * The chart's projection. One implementation, two renderers.
 *
 * The sounding field is drawn twice: once as server-rendered SVG that every
 * reader gets, and once as a WebGL scene that may replace it on a machine
 * with the headroom. They have to be the same picture — a canvas that fades
 * in over a still and lands somewhere else is a worse experience than not
 * having the canvas — so both call the functions below rather than each
 * deriving its own geometry.
 *
 * Chart space is three unit axes:
 *
 *   u  time      0 at the oldest row in the window, 1 at now
 *   v  depth     0 at the surface, 1 on the floor
 *   w  magnitude 0 flat on the plane, 1 at the largest request on the board
 *
 * They project to a dimetric plane: time runs right and slightly up, depth
 * runs down and slightly right, magnitude stands straight off the surface.
 * The result reads as a chart first and as a solid second, which is the right
 * way round for something whose job is to be read.
 */

export const VIEW = { w: 1000, h: 600 } as const;

/**
 * Where chart-space (0,0,0) lands.
 *
 * The left inset is not slack: the depth axis is labelled inside the frame,
 * following the plane's own slope, and those labels need the water to their
 * right rather than a margin outside the picture.
 */
const ORIGIN = { x: 148, y: 248 } as const;

export interface Basis {
  ux: number;
  uy: number;
  vx: number;
  vy: number;
  wy: number;
}

/**
 * The plane's two in-surface axes, and how far one unit of w stands off it.
 *
 * Sized so nothing can leave the frame. The extremes are the tallest mark at
 * the far corner — y = 248 − 104 − 104 = 40 — and the near corner of the
 * plane at y = 548, which leaves the bottom strip for the time axis.
 */
const BASIS: Basis = {
  ux: 700,
  uy: -104,
  vx: 130,
  vy: 300,
  wy: -104,
};

/**
 * The projection basis, optionally tilted.
 *
 * Tilt is how the WebGL scene answers the pointer: shortening one axis and
 * lengthening the other rotates the plane, in the same way turning a drawing
 * board does. At tilt zero it is byte-for-byte the basis the SVG used, so the
 * cross-fade from still to scene has nothing to give away.
 */
export function basis(tiltX = 0, tiltY = 0): Basis {
  return {
    ux: BASIS.ux * (1 - tiltX * 0.06),
    uy: BASIS.uy - tiltY * 26 - tiltX * 30,
    vx: BASIS.vx + tiltX * 46,
    vy: BASIS.vy * (1 - tiltY * 0.1),
    wy: BASIS.wy * (1 + tiltY * 0.14),
  };
}

export function project(u: number, v: number, w = 0, b: Basis = BASIS): [number, number] {
  return [ORIGIN.x + u * b.ux + v * b.vx, ORIGIN.y + u * b.uy + v * b.vy + w * b.wy];
}

/** The four corners of the survey plane, for an outline. */
export function planeCorners(b: Basis = BASIS): Array<[number, number]> {
  return [project(0, 0, 0, b), project(1, 0, 0, b), project(1, 1, 0, b), project(0, 1, 0, b)];
}

/**
 * The lattice. `u` lines run along time, `v` lines along depth.
 *
 * Returned as flat segments so the SVG can map them to <line> and the scene
 * can pour the same numbers straight into a LineSegments buffer.
 */
export function lattice(uSteps = 8, vSteps = 5, b: Basis = BASIS): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  for (let i = 0; i <= uSteps; i++) {
    const u = i / uSteps;
    const [x1, y1] = project(u, 0, 0, b);
    const [x2, y2] = project(u, 1, 0, b);
    out.push([x1, y1, x2, y2]);
  }
  for (let j = 0; j <= vSteps; j++) {
    const v = j / vSteps;
    const [x1, y1] = project(0, v, 0, b);
    const [x2, y2] = project(1, v, 0, b);
    out.push([x1, y1, x2, y2]);
  }
  return out;
}

/** Radius of a sounding bead, in view units, from its magnitude. */
export function beadRadius(magnitude: number): number {
  return 3.4 + Math.sqrt(Math.max(0, magnitude)) * 7.2;
}

/**
 * A point in chart space as a percentage of the frame.
 *
 * The frame is held at the viewBox's exact aspect ratio, so `meet` neither
 * letterboxes nor crops and a percentage lands on the same pixel the SVG
 * would have drawn. That is what lets the axis labels be real HTML text
 * sitting over the plot — and stay correct when the WebGL scene replaces the
 * drawing underneath them.
 */
export function percent(u: number, v: number, w = 0, b: Basis = BASIS): { left: string; top: string } {
  const [x, y] = project(u, v, w, b);
  return { left: `${(x / VIEW.w) * 100}%`, top: `${(y / VIEW.h) * 100}%` };
}

/**
 * Painter's order: things further from the eye are drawn first.
 *
 * With no depth buffer in SVG this is the only thing stopping a shallow
 * sounding from being hidden behind a deep one, and the scene sorts the same
 * way so the two agree about which bead is in front.
 */
export function paintOrder<T extends { x: number; depth: number }>(points: T[]): T[] {
  return [...points].sort((a, b) => a.depth + a.x * 0.001 - (b.depth + b.x * 0.001));
}
