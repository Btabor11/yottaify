/* ---------------------------------------------------------------------------
   D1 scene palette.

   WebGL materials cannot read CSS custom properties, so the values the canvas
   needs live here rather than as hex scattered through a component. Entries
   annotated with a `--token` comment must match `app/d1/d1.css` exactly;
   `scripts/audit.mjs` fails the build if they drift.

   Everything else is a material colour with no CSS counterpart — the package
   substrate, the board, the die — and exists only inside the scene.
--------------------------------------------------------------------------- */

export const SCENE = {
  /** Signal teal. Edges, chords, the lit face of the die. */
  accent: "#4fe3c1" /* --accent */,
  /** Near-black ground the canvas sits on, so fog matches the page. */
  bg: "#07090a" /* --bg */,

  /** Brightest tint of the accent. NVLink pulse only — never a surface. */
  accentHot: "#9dfff0",
  /** GPU package substrate. */
  package: "#0f1517",
  /** Package edge wire. */
  packageEdge: "#4a6067",
  /** HBM stack lid — slightly bluer and more metallic than the substrate. */
  hbm: "#101d1f",
  /** Die base, under the emissive pass. */
  die: "#12312c",
  /** Baseboard. */
  board: "#0b1112",
  /** Baseboard trace wire. */
  boardEdge: "#2b3437",
  /** Key light. Cool white, as if from overhead fluorescents. */
  keyLight: "#cfe9ec",
} as const;
