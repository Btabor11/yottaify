import { PRICE_ROWS, BENCHMARK_ROW_ID, type PriceRow } from "@/content";

/**
 * Transparent arithmetic for the cost estimator. Not a quote and not a claim —
 * it is `rate × gpus × hours` on the published third-party rates already
 * visible on the page, with every input under the user's control.
 *
 * Our own rate is deliberately not in here. It is not in `PRICE_ROWS`, it is
 * not importable from `@/content`, and this module runs inside a client
 * component — so anything it touched would ship in the bundle. What the
 * estimator prices is the alternatives; where we land relative to them is
 * stated in words (`QUOTE` in content/pricing.ts) and settled on the call.
 */

export interface EstimateRow {
  row: PriceRow;
  low: number;
  high: number | null;
  /**
   * Difference against the benchmark — the lowest rate anyone could confirm as
   * in stock — low end to low end. Positive = this row costs more than the
   * cheapest thing a buyer could actually have bought on the day we checked.
   */
  deltaVsBenchmark: number;
}

export function estimate(
  gpus: number,
  hours: number,
): { rows: EstimateRow[]; benchmark: EstimateRow } {
  const clean = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const g = clean(gpus);
  const h = clean(hours);

  const rows: EstimateRow[] = PRICE_ROWS.map((row) => ({
    row,
    low: row.low * g * h,
    high: typeof row.high === "number" ? row.high * g * h : null,
    deltaVsBenchmark: 0,
  }));

  const benchmark = rows.find((r) => r.row.id === BENCHMARK_ROW_ID)!;
  for (const r of rows) r.deltaVsBenchmark = r.low - benchmark.low;

  return { rows, benchmark };
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
