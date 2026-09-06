import type { Snapshot, StockSignal } from "@/lib/market/types";

/**
 * The reference line every chart on this page is drawn against: the lowest
 * rate any source confirmed as actually in stock.
 *
 * It used to be a rate of ours. It is not any more — the site does not publish
 * one — and this is the better datum regardless, because it is the only figure
 * on the page a reader could act on today. Falls back to the median when
 * nothing was confirmed bookable, and to null when there is nothing at all.
 */
export function railRate(snap: Snapshot): number | null {
  return snap.lowestBookable?.usdPerGpuHour ?? snap.medianOnDemand;
}

export const usd = (n: number | null | undefined, dp = 2): string => (n == null ? "—" : `$${n.toFixed(dp)}`);
export const pct = (n: number | null | undefined, dp = 0): string => (n == null ? "—" : `${(n * 100).toFixed(dp)}%`);

export function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function dayLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Status is a reserved palette: colour + glyph + label, never colour alone. */
export const STOCK_GLYPH: Record<StockSignal, string> = {
  "in-stock": "●",
  limited: "◐",
  waitlist: "◔",
  "out-of-stock": "○",
  unknown: "◌",
  "not-reported": "·",
};

/** Token for the status colour. Resolved by the direction's CSS. */
export const STOCK_TOKEN: Record<StockSignal, string> = {
  "in-stock": "var(--accent-2)",
  limited: "var(--caution)",
  waitlist: "var(--caution)",
  "out-of-stock": "var(--alarm)",
  unknown: "var(--ink-3)",
  "not-reported": "var(--ink-3)",
};
