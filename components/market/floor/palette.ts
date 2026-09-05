/* ---------------------------------------------------------------------------
   Market floor scene palette.                                    @sheet d3.css

   WebGL cannot read CSS variables, so the scene carries its colours as
   literals. Entries annotated with a `--token` comment must match
   app/(site)/d3.css exactly; `scripts/audit.mjs` fails the build if they drift.
   Everything else is scene-only material colour, not a design token.

   Colour does two jobs on the floor. Emphasis (our rail, hover, the seller's
   own published module) is the accent — ember. Stock is a status palette:
   hbm for in stock, caution for limited, alarm for out of stock. They never
   trade places.
--------------------------------------------------------------------------- */

export const FLOOR = {
  bg: "#0b0a09" /* --bg */,
  surface: "#13110e" /* --surface */,
  ruleStrong: "#342e28" /* --rule-strong */,
  ink: "#f3eee4" /* --ink */,
  ink2: "#b3aa9c" /* --ink-2 */,
  ink3: "#8a8175" /* --ink-3 */,
  /** Emphasis: the rail, hover, published modules. */
  accent: "#ff8a4c" /* --ember */,
  /** In stock, and the cool pole the page's live colour travels toward. */
  accent2: "#6fe3d2" /* --hbm */,
  caution: "#f2c14e" /* --caution */,
  alarm: "#ff7b6b" /* --alarm */,

  /** Scene-only. Key light: near-white with a touch of warmth, so metal reads as metal. */
  keyLight: "#fff1e4",
  /** Scene-only. Rim light from the cool side, so edges separate from the dark floor. */
  rimLight: "#6fe3d2",
  /** Scene-only. The CC0 rack model is painted green steel in the file; tinted to dark neutral. */
  rackTint: "#3a3531",
  /** Scene-only. Glass riser under each module. */
  riser: "#f3eee4",
} as const;
