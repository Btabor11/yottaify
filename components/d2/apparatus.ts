import { SOURCES, source, type Source } from "@/content";

/**
 * D2's footnote apparatus.
 *
 * Every figure on the page carries a superscript that resolves to a numbered
 * source at the foot of its section — the way a filing or an annual report
 * does. This is the direction's whole argument: the transparency requirement
 * is not a callout box, it is the page's typographic structure.
 *
 * Numbering is a fixed order rather than order-of-appearance, so a footnote
 * marker means the same thing on the landing page and the pricing page. A
 * reader who learns that ³ is "lowest verified in stock" keeps that.
 */

export const FOOTNOTE_ORDER = [
  "ours",
  "surveyUnverified",
  "surveyVerified",
  "surveyMedian",
  "oracleList",
  "awsList",
  "surveyCommitted",
  "nvidiaBlackwellUltra",
  "facility",
] as const;

export function footnoteNumber(sourceId: string): number {
  const i = FOOTNOTE_ORDER.indexOf(sourceId as (typeof FOOTNOTE_ORDER)[number]);
  if (i === -1) throw new Error(`Source "${sourceId}" has no footnote number. Add it to FOOTNOTE_ORDER.`);
  return i + 1;
}

export interface Footnote {
  n: number;
  id: string;
  source: Source;
}

/** All footnotes, in numbering order. Drives the apparatus at the foot. */
export function allFootnotes(): Footnote[] {
  return FOOTNOTE_ORDER.map((id) => ({ n: footnoteNumber(id), id, source: source(id) }));
}

/** Sanity check at module load: every registered source must be numbered. */
if (process.env.NODE_ENV !== "production") {
  for (const id of Object.keys(SOURCES)) {
    if (!FOOTNOTE_ORDER.includes(id as (typeof FOOTNOTE_ORDER)[number])) {
      console.warn(`[d2/footnotes] source "${id}" is not in FOOTNOTE_ORDER and will throw if cited.`);
    }
  }
}
