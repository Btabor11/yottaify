import type { Evidence, Fetchability, Observation, ProviderId, SourceMeta, StockSignal, Term } from "../types";
import type { Fetched } from "../http";

/**
 * A source is one thing we read once a day. `fetch()` either returns
 * observations or throws; the orchestrator turns a throw into a recorded
 * failure so one broken parser never blanks the whole snapshot.
 *
 * Sources that we deliberately do not read still exist here, with
 * `meta.declined`, so the page can list them and say why.
 */
export interface Source {
  meta: SourceMeta;
  fetch(): Promise<Observation[]>;
}

export function evidence(f: Fetched, anchor: RegExp | string, derivation?: string): Evidence {
  return { url: f.url, readAt: f.readAt, bodyHash: f.hash, excerpt: f.excerpt(anchor), ...(derivation ? { derivation } : {}) };
}

interface ObsInput {
  source: SourceMeta;
  provider: ProviderId;
  term: Term;
  usdPerGpuHour: number | null;
  evidence: Evidence;
  variant?: string;
  gpusPerUnit?: number;
  region?: string;
  stock?: StockSignal;
  stockBasis?: Observation["stockBasis"];
  availabilityPct?: number;
  fetchability?: Fetchability;
}

export function obs(i: ObsInput): Observation {
  return {
    sourceId: i.source.id,
    sourceKind: i.source.kind,
    provider: i.provider,
    variant: i.variant,
    term: i.term,
    usdPerGpuHour: i.usdPerGpuHour,
    gpusPerUnit: i.gpusPerUnit,
    region: i.region,
    stock: i.stock ?? "not-reported",
    stockBasis: i.stockBasis ?? (i.stock && i.stock !== "not-reported" ? (i.source.kind === "provider" ? "provider" : "tracker-checked") : undefined),
    availabilityPct: i.availabilityPct,
    fetchability: i.fetchability ?? (i.usdPerGpuHour == null ? "gated" : "ok"),
    evidence: i.evidence,
  };
}

/** Median of a non-empty numeric array. */
export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
