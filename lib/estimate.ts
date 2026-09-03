import { PRICE_ROWS, type PriceRow } from "@/content";

/**
 * Transparent arithmetic for the cost estimator. Not a quote and not a claim —
 * it is `rate × gpus × hours` on the published rates already visible on the
 * page, with every input under the user's control.
 *
 * Shared by all three directions so the numbers can never diverge between them.
 */

export interface EstimateRow {
  row: PriceRow;
  low: number;
  high: number | null;
  /** Difference against our own rate, low end to low end. Positive = they cost more. */
  deltaVsOurs: number;
}

export function estimate(gpus: number, hours: number): { rows: EstimateRow[]; ours: EstimateRow } {
  const clean = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const g = clean(gpus);
  const h = clean(hours);

  const rows: EstimateRow[] = PRICE_ROWS.map((row) => ({
    row,
    low: row.low * g * h,
    high: typeof row.high === "number" ? row.high * g * h : null,
    deltaVsOurs: 0,
  }));

  const ours = rows.find((r) => r.row.isUs)!;
  for (const r of rows) r.deltaVsOurs = r.low - ours.low;

  return { rows, ours };
}

/** Whole dollars. Fractions of a cent on a six-figure number are noise. */
export function usd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** Compact form for tight cells: $1.2M, $84k. */
export function usdCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`;
  return usd(n);
}
