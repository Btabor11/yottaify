/* ---------------------------------------------------------------------------
   D3 scene palette.

   `--live` in D3 is a color-mix driven by scroll, which WebGL cannot read.
   The scene is therefore given both poles and interpolates itself, so the
   canvas travels with the page rather than lagging behind it.

   Entries annotated with a `--token` comment must match `app/(site)/d3.css`
   exactly; `scripts/audit.mjs` fails the build if they drift.
--------------------------------------------------------------------------- */

export const SCENE = {
  /** Warm pole of the live colour: a conductor under load. */
  ember: "#ff8a4c" /* --ember */,
  /** Cool pole: the colour the story cools to once current reaches memory. */
  hbm: "#6fe3d2" /* --hbm */,
  /** Page ground, so the canvas edge is invisible. */
  bg: "#0b0a09" /* --bg */,
  /** Paper white, for the brightest particle cores. */
  ink: "#f3eee4" /* --ink */,
  /** Sodium yellow, for the provisional. */
  caution: "#f2c14e" /* --caution */,
} as const;
