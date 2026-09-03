/* ---------------------------------------------------------------------------
   D2 scene palette.

   The D2 canvas draws lines only — it is an engraving, not a render — so the
   palette is two inks. Entries annotated with a `--token` comment must match
   `app/d2/d2.css` exactly; `scripts/audit.mjs` fails the build if they drift.
--------------------------------------------------------------------------- */

export const SCENE = {
  /** Plate ink. Opacity does the tonal work, never a lighter grey. */
  ink: "#16150f" /* --ink */,
  /** Ledger red. Reserved for the one line that carries the argument. */
  red: "#b2331e" /* --accent */,
} as const;
