/**
 * MARKET TRACKER — types.
 *
 * What this tracks is not "the price of a B300". It is *what the market says
 * the price is*, from two kinds of source:
 *
 *   provider  — a seller's own published rate card or API. First-hand.
 *   tracker   — a third-party aggregator's report of a provider's rate.
 *               Second-hand, shown as "as reported by X".
 *
 * The interesting quantity is the disagreement between them. A provider whose
 * own page says $7.89 while three trackers report $6.94, $7.39 and $7.89 is a
 * legibility problem, and legibility is what a buyer actually lacks.
 *
 * Every observation carries evidence: the URL read, when, a hash of the raw
 * body, and a short excerpt around the figure. The page can show its work.
 */

export type SourceKind = "provider" | "tracker";

export type Term = "on-demand" | "spot" | "reserved" | "serverless";

export type StockSignal =
  | "in-stock"
  | "limited"
  | "out-of-stock"
  | "waitlist"
  | "not-reported"   // the source publishes no stock information
  | "unknown";       // the source has a stock field but it was empty

export type Fetchability =
  | "ok"              // read successfully this run
  | "not-read"        // we have no first-hand source for this provider; trackers only
  | "gated"           // the seller requires a sales conversation for this SKU
  | "not-offered"     // the seller does not list this SKU
  | "blocked"         // a bot challenge or WAF prevents automated reads
  | "declined"        // we chose not to fetch (ToS forbids automated collection)
  | "error";          // fetch or parse failed this run

/** Canonical provider identifiers. Trackers map their own slugs onto these. */
export type ProviderId =
  | "runpod" | "vast" | "nebius" | "hyperstack" | "modal" | "aws" | "oracle"
  | "coreweave" | "together" | "lambda"
  // Providers we do not read first-hand but that trackers report on.
  | "gpu-ai" | "spheron" | "bentaus" | "gcore" | "lyceum" | "verda" | "massed-compute"
  | "scaleway" | "latitude" | "enverge" | "fal" | "prime-intellect" | "datacrunch"
  | "lium" | "sesterce" | "theai-cloud" | "impossible-cloud" | "other";

export interface Evidence {
  /** Where the figure was read. Shown as the citation. */
  url: string;
  /** ISO timestamp of the read. */
  readAt: string;
  /** SHA-256 (first 16 hex) of the raw response, so a re-read can prove sameness. */
  bodyHash: string;
  /** ≤ 240 chars around the figure, whitespace-collapsed. Human-checkable. */
  excerpt: string;
  /** How the figure was derived if not verbatim, e.g. "$142.416 ÷ 8 GPUs". */
  derivation?: string;
}

export interface Observation {
  /** Which source produced this row. */
  sourceId: string;
  sourceKind: SourceKind;
  /** Who the row is about. For a provider source this equals the provider itself. */
  provider: ProviderId;
  /** Free-text label from the source, e.g. "Runpod Secure Cloud", "p6-b300.48xlarge". */
  variant?: string;
  term: Term;
  /** USD per GPU-hour, already normalised. Null when gated / not offered. */
  usdPerGpuHour: number | null;
  /** GPUs in the priced unit, when the source prices per instance. */
  gpusPerUnit?: number;
  region?: string;
  stock: StockSignal;
  /**
   * How much the stock signal is worth.
   *   provider           the seller's own API or page says so
   *   tracker-checked    a tracker that polls provider APIs for stock (hourly)
   *   tracker-heuristic  a tracker's inferred availability, not a stock check
   * "Lowest bookable" never rests on a heuristic.
   */
  stockBasis?: "provider" | "tracker-checked" | "tracker-heuristic";
  /** Any numeric stock/availability figure the source exposes (0–1). */
  availabilityPct?: number;
  fetchability: Fetchability;
  evidence: Evidence;
}

export interface SourceMeta {
  id: string;
  kind: SourceKind;
  label: string;
  /** The human-visible page a reader can open to check. */
  homepage: string;
  /** What we read, one line, for the methodology section. */
  method: string;
  /** robots.txt / terms notes, verbatim-ish, for the methodology section. */
  terms?: string;
  /** Deliberately not fetched. Rendered on the page as a refusal, with the reason. */
  declined?: { reason: string };
}

export interface SourceResult {
  source: SourceMeta;
  observations: Observation[];
  /** Populated when the whole source failed. Observations may still be empty. */
  error?: { message: string; stage: "fetch" | "parse" };
  durationMs: number;
}

export interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  sourcesOk: number;
  sourcesFailed: number;
  observations: number;
}

/**
 * One provider's row in the daily snapshot: what they say, what others say
 * about them, and how far apart those are.
 */
export interface ProviderDigest {
  provider: ProviderId;
  label: string;
  /** First-hand on-demand rate, or null with the reason. */
  published: { usdPerGpuHour: number; evidence: Evidence } | null;
  publishedState: Fetchability;
  /** Tracker reports about this provider's on-demand rate. */
  reported: { sourceId: string; usdPerGpuHour: number; stock: StockSignal; evidence: Evidence }[];
  /** Spread across all on-demand figures (published + reported): (max − min) / min. */
  spread: number | null;
  /** Lowest and highest on-demand figures seen for this provider today. */
  low: number | null;
  high: number | null;
  /** Best available stock signal: provider's own, else a tracker that checks, else a heuristic. */
  stock: StockSignal;
  stockBasis: "provider" | "tracker-checked" | "tracker-heuristic" | null;
  /** Other terms the provider publishes (spot, reserved), for the detail view. */
  otherTerms: { term: Term; usdPerGpuHour: number; variant?: string }[];
}

export interface Legibility {
  /**
   * 0–100. Composed, never asserted: each component is shown alongside.
   *   agreement   — 1 − mean spread across providers with ≥ 2 figures, clamped
   *   coverage    — share of providers whose own rate we could read first-hand
   *   visibility  — share of providers exposing any stock signal at all
   *   bookable    — share of listed configs a tracker confirms in stock
   */
  index: number;
  agreement: number;
  coverage: number;
  visibility: number;
  bookable: number | null;
  /** How many providers had ≥ 2 independent figures, so agreement means something. */
  comparedProviders: number;
}

export interface Snapshot {
  /** YYYY-MM-DD, UTC. One snapshot per day; a re-run replaces it. */
  day: string;
  run: RunSummary;
  ourRate: number;
  providers: ProviderDigest[];
  /** getdeploying's "N of M configs in stock", when read. */
  inStock: { count: number; total: number; providers: number; sourceId: string; evidence: Evidence } | null;
  legibility: Legibility;
  /** Every source, including refusals and failures, so the page can list them. */
  sources: { id: string; kind: SourceKind; label: string; state: Fetchability | "declined"; observations: number; error?: string }[];
  /** Median of all on-demand figures across every source today. */
  medianOnDemand: number | null;
  /** Lowest on-demand figure any source shows, regardless of stock. */
  lowestListed: { usdPerGpuHour: number; provider: ProviderId; sourceId: string } | null;
  /** Lowest on-demand figure a source marks in stock. */
  lowestBookable: { usdPerGpuHour: number; provider: ProviderId; sourceId: string } | null;
  /** Set only by the dev-only synthetic history script. The page badges it. */
  synthetic?: boolean;
}
