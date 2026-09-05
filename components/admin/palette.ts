/* ---------------------------------------------------------------------------
   Night Board scene palette.

   WebGL cannot read a CSS custom property, so the one scene on the desk is
   given the literals directly. Every entry annotated with a `--token` comment
   must match `app/admin/admin.css` exactly; scripts/audit.mjs fails the build
   if they drift, which is the only reason hardcoding them here is allowed.
--------------------------------------------------------------------------- */

export const SCENE = {
  /** Ground, so the canvas edge is invisible against the plate. */
  bg: "#070b12" /* --bg */,
  /** The survey lattice. */
  rule: "#24314a" /* --rule-strong */,
  /** Shallow water: a sounding that has only just been taken. */
  shoal: "#3ee8d0" /* --shoal */,
  /** Deep water: a sounding that has reached the floor. */
  deep: "#6ec8ff" /* --deep */,
  /** Slack water: closed, withdrawn or held. Off the depth scale. */
  spent: "#61798c" /* --spent */,
  /** Paper white, for the brightest bead cores. */
  ink: "#e8f4f2" /* --ink */,
  /** Sodium, for anything held back or flagged. */
  caution: "#f0c85a" /* --caution */,
} as const;
