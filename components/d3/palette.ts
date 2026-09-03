/* ---------------------------------------------------------------------------
   D3 scene palette.

   `--accent` in D3 is a live `color-mix` driven by scroll, which WebGL cannot
   read. The scenes are therefore given both poles and interpolate themselves,
   so the canvas travels with the page rather than lagging behind it.

   Entries annotated with a `--token` comment must match `app/(site)/d3.css`
   exactly; `scripts/audit.mjs` fails the build if they drift.
--------------------------------------------------------------------------- */

export const SCENE = {
  /** Cold pole of the accent travel. */
  volt: "#35e8ff" /* --volt */,
  /** Warm pole of the accent travel. */
  plasma: "#a06bff" /* --plasma */,
  /** Page ground, so the canvas edge is invisible. */
  bg: "#05060b" /* --bg */,
  /** Structural rule, used for the plan-view floor. */
  ruleStrong: "#2b3150" /* --rule-strong */,
  /** Paper white, for the label plane that has to stay legible. */
  ink: "#f2f4ff" /* --ink */,

  /** Device body. Darker than --surface so the wireframe reads against it. */
  device: "#151a30",
  /** Device wireframe. A lifted tint of volt — the outline, not the glow. */
  deviceEdge: "#7ceeff",
  /** Die, under the emissive pass. */
  die: "#2ad0ea",
  /** Interconnect chords. Cooler and dimmer than the edges. */
  chord: "#7cd6ff",
  /** Key light. */
  keyLight: "#cfe4ff",
} as const;
