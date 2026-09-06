import { PROVIDER_LABEL } from "./sources";
import { median } from "./sources/base";
import type { Fetchability, Legibility, Observation, ProviderDigest, ProviderId, RunSummary, Snapshot, SourceResult, StockSignal } from "./types";

/**
 * Turn a run's observations into the day's snapshot. Pure; testable.
 *
 * Rules that matter:
 *  · A provider's "published" figure is its own on-demand rate. Where a source
 *    yields several on-demand variants (RunPod Secure vs Community) we take the
 *    one a buyer would default to — the first the source emits — and keep the
 *    rest under otherTerms so nothing is hidden.
 *  · Tracker rows about a provider are "reported". They never become
 *    "published", however confident the tracker sounds.
 *  · Spread = (max − min) / min across every on-demand figure for a provider.
 *    Providers with a single figure have no spread; they are not "in agreement",
 *    they are simply uncontested, and the page says which.
 *  · The legibility index is a composition of four shown components. It is
 *    not a score of the market; it is a score of how legible the market is.
 */

const STOCK_RANK: Record<StockSignal, number> = { "in-stock": 5, limited: 4, waitlist: 3, "out-of-stock": 2, unknown: 1, "not-reported": 0 };
const BASIS_RANK = { provider: 3, "tracker-checked": 2, "tracker-heuristic": 1 } as const;

/** The most trustworthy stock signal: by basis first, then by how much it says. */
function bestStock(rows: Observation[]): { stock: StockSignal; basis: ProviderDigest["stockBasis"] } {
  const informative = rows.filter((r) => r.stock !== "not-reported" && r.stockBasis);
  if (!informative.length) return { stock: "not-reported", basis: null };
  informative.sort((a, b) => BASIS_RANK[b.stockBasis!] - BASIS_RANK[a.stockBasis!] || STOCK_RANK[b.stock] - STOCK_RANK[a.stock]);
  return { stock: informative[0].stock, basis: informative[0].stockBasis! };
}

export function buildSnapshot(results: SourceResult[], day: string, run: RunSummary): Snapshot {
  const all = results.flatMap((r) => r.observations);
  const byProvider = new Map<ProviderId, Observation[]>();
  for (const o of all) {
    if (o.provider === "other") continue;
    byProvider.set(o.provider, [...(byProvider.get(o.provider) ?? []), o]);
  }

  const providers: ProviderDigest[] = [];
  for (const [provider, rows] of byProvider) {
    const own = rows.filter((r) => r.sourceKind === "provider");
    const ownOnDemand = own.filter((r) => r.term === "on-demand");
    const published = ownOnDemand.find((r) => r.usdPerGpuHour != null);
    const publishedState: Fetchability = published ? "ok" : (ownOnDemand[0]?.fetchability ?? (own.length ? "error" : "not-read"));

    const reported = rows
      .filter((r) => r.sourceKind === "tracker" && r.term === "on-demand" && r.usdPerGpuHour != null)
      .map((r) => ({ sourceId: r.sourceId, usdPerGpuHour: r.usdPerGpuHour as number, stock: r.stock, evidence: r.evidence }));

    const figures = [...(published ? [published.usdPerGpuHour as number] : []), ...ownOnDemand.filter((r) => r !== published && r.usdPerGpuHour != null).map((r) => r.usdPerGpuHour as number), ...reported.map((r) => r.usdPerGpuHour)];
    const low = figures.length ? Math.min(...figures) : null;
    const high = figures.length ? Math.max(...figures) : null;
    const spread = figures.length >= 2 && low ? (high! - low) / low : null;

    const { stock, basis: stockBasis } = bestStock(rows);

    const otherTerms = own
      .filter((r) => r.usdPerGpuHour != null && (r.term !== "on-demand" || r !== published))
      .map((r) => ({ term: r.term, usdPerGpuHour: r.usdPerGpuHour as number, variant: r.variant }));

    providers.push({
      provider,
      label: PROVIDER_LABEL[provider] ?? provider,
      published: published ? { usdPerGpuHour: published.usdPerGpuHour as number, evidence: published.evidence } : null,
      publishedState: published ? "ok" : publishedState,
      reported,
      spread,
      low,
      high,
      stock,
      stockBasis,
      otherTerms,
    });
  }
  // Sort: cheapest known figure first; providers with no figure at all last.
  providers.sort((a, b) => (a.low ?? 1e9) - (b.low ?? 1e9));

  // getdeploying's summary stat rides in as a variant string on an "other" row.
  const statRow = all.find((o) => o.sourceId === "getdeploying" && o.variant?.startsWith("in-stock:"));
  let inStock: Snapshot["inStock"] = null;
  if (statRow) {
    const [, count, total, provs] = statRow.variant!.split(":");
    inStock = { count: Number(count), total: Number(total), providers: Number(provs) || 0, sourceId: "getdeploying", evidence: statRow.evidence };
  }

  const onDemandFigures = all.filter((o) => o.term === "on-demand" && o.usdPerGpuHour != null && o.provider !== "other");
  const medianOnDemand = median(onDemandFigures.map((o) => o.usdPerGpuHour as number));
  const cheapest = [...onDemandFigures].sort((a, b) => (a.usdPerGpuHour as number) - (b.usdPerGpuHour as number));
  const lowestListed = cheapest[0] ? { usdPerGpuHour: cheapest[0].usdPerGpuHour as number, provider: cheapest[0].provider, sourceId: cheapest[0].sourceId } : null;
  // A heuristic never makes something "bookable"; only a provider or a tracker that actually checks.
  const bookable = cheapest.find((o) => o.stock === "in-stock" && o.stockBasis !== "tracker-heuristic");
  const lowestBookable = bookable ? { usdPerGpuHour: bookable.usdPerGpuHour as number, provider: bookable.provider, sourceId: bookable.sourceId } : null;

  const legibility = computeLegibility(providers, inStock);

  const sources: Snapshot["sources"] = results.map((r) => ({
    id: r.source.id,
    kind: r.source.kind,
    label: r.source.label,
    state: r.source.declined ? "declined" : r.error ? "error" : r.observations.length ? "ok" : "error",
    observations: r.observations.length,
    error: r.error?.message,
  }));

  return { day, run, providers, inStock, legibility, sources, medianOnDemand, lowestListed, lowestBookable };
}

export function computeLegibility(providers: ProviderDigest[], inStock: Snapshot["inStock"]): Legibility {
  const compared = providers.filter((p) => p.spread != null);
  const meanSpread = compared.length ? compared.reduce((s, p) => s + (p.spread as number), 0) / compared.length : 0;
  // A 20% mean spread reads as full disagreement. Clamp so one wild tracker cannot drive it negative.
  const agreement = Math.max(0, Math.min(1, 1 - meanSpread / 0.2));
  // Coverage counts the providers we attempted first-hand — a tracker-only provider is neither hit nor miss.
  const attempted = providers.filter((p) => p.published || ["gated", "blocked", "error"].includes(p.publishedState));
  const coverage = attempted.length ? attempted.filter((p) => p.published).length / attempted.length : 0;
  const visibility = providers.length ? providers.filter((p) => p.stock !== "not-reported").length / providers.length : 0;
  const bookable = inStock && inStock.total > 0 ? inStock.count / inStock.total : null;
  const parts = [agreement * 0.4, coverage * 0.25, visibility * 0.15, (bookable ?? visibility) * 0.2];
  const index = Math.round(parts.reduce((a, b) => a + b, 0) * 100);
  return { index, agreement: r3(agreement), coverage: r3(coverage), visibility: r3(visibility), bookable: bookable == null ? null : r3(bookable), comparedProviders: compared.length };
}

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
