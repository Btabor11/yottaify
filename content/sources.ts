/**
 * SOURCE REGISTRY.
 *
 * Every number on this site points at an entry here. If a claim has no source
 * id, it does not go on the page. `accessed` is what renders as the visible
 * "as of" date next to the figure.
 *
 * `kind` drives the verification badge shown to the user:
 *   first-party        — our own rate, we set it
 *   rate-card          — provider's own published price list, publicly readable
 *   verified-in-stock  — we found the listing AND confirmed capacity was orderable
 *   unverified-listing — a published number we could not confirm as in stock
 *   aggregate          — a statistic we computed across listings we tracked
 *   vendor-spec         — hardware specification from the silicon vendor
 */

export type SourceKind =
  | "first-party"
  | "rate-card"
  | "verified-in-stock"
  | "unverified-listing"
  | "aggregate"
  | "vendor-spec";

export interface Source {
  id: string;
  /** Short label for inline citation, e.g. "Oracle price list". */
  label: string;
  /** Public URL, or null where the source is our own survey / internal figure. */
  url: string | null;
  kind: SourceKind;
  /** ISO date the figure was read. Rendered to the user. */
  accessed: string;
  /** One line the user can read to understand what this source is. */
  note: string;
}

export const SOURCES: Record<string, Source> = {
  ours: {
    id: "ours",
    label: "Our published rate",
    url: null,
    kind: "first-party",
    accessed: "2026-09-02",
    note: "Our own on-demand rate. Fixed for the initial cohort; committed terms priced lower on a per-deal basis.",
  },

  oracleList: {
    id: "oracleList",
    label: "Oracle Cloud price list",
    // Oracle's canonical public price list. Verified reachable 3 Sep 2026.
    url: "https://www.oracle.com/cloud/price-list/",
    kind: "rate-card",
    accessed: "2026-09-02",
    note: "Oracle's public price list. Rate read from the published GPU compute shapes.",
  },

  awsList: {
    id: "awsList",
    label: "AWS EC2 on-demand pricing",
    // AWS's canonical public on-demand rate card. Verified reachable 3 Sep 2026.
    url: "https://aws.amazon.com/ec2/pricing/on-demand/",
    kind: "rate-card",
    accessed: "2026-09-02",
    note: "AWS's public on-demand rate card. Per-GPU figure is the published instance rate divided by GPUs per instance.",
  },

  surveyVerified: {
    id: "surveyVerified",
    label: "Our price survey — in-stock check",
    url: null,
    kind: "verified-in-stock",
    accessed: "2026-09-02",
    note: "Lowest listing we could confirm as actually orderable: we reached the checkout or quote step and capacity was available. Provider not named because the listing was not published under terms that let us republish it as an endorsement.",
  },

  surveyMedian: {
    id: "surveyMedian",
    label: "Our price survey — median",
    url: null,
    kind: "aggregate",
    accessed: "2026-09-02",
    note: "Median of the published on-demand rates across the providers we track. A median, not a floor — half the listings we saw were higher.",
  },

  surveyUnverified: {
    id: "surveyUnverified",
    label: "Our price survey — unverified listings",
    url: null,
    kind: "unverified-listing",
    accessed: "2026-09-02",
    note: "Published rates below $7 that we could not confirm as in stock. Some showed no availability; some required a sales conversation that did not produce a bookable slot.",
  },

  surveyCommitted: {
    id: "surveyCommitted",
    label: "Our price survey — committed terms",
    url: null,
    kind: "aggregate",
    accessed: "2026-09-02",
    note: "Range of reserved and committed rates we observed for 24–60 month terms across providers.",
  },

  nvidiaBlackwellUltra: {
    id: "nvidiaBlackwellUltra",
    label: "NVIDIA Blackwell architecture",
    // NVIDIA's canonical Blackwell architecture page. Verified reachable 3 Sep 2026.
    url: "https://www.nvidia.com/en-us/data-center/technologies/blackwell-architecture/",
    kind: "vendor-spec",
    accessed: "2026-09-02",
    note: "NVIDIA's published Blackwell Ultra platform specifications.",
  },

  facility: {
    id: "facility",
    label: "Our facility",
    url: null,
    kind: "first-party",
    accessed: "2026-09-02",
    note: "Measured and calculated from our own build: fleet count, electrical load, cooling method, and site ownership.",
  },
} as const;

export function source(id: string): Source {
  const s = SOURCES[id];
  if (!s) throw new Error(`Unknown source id: ${id}`);
  return s;
}

/** Human-readable badge text per verification kind. */
export const VERIFICATION_LABEL: Record<SourceKind, string> = {
  "first-party": "Our rate",
  "rate-card": "Published rate card",
  "verified-in-stock": "Verified in stock",
  "unverified-listing": "Unverified / no stock",
  aggregate: "Aggregate of tracked listings",
  "vendor-spec": "Vendor specification",
};

/** Short badge text, for tight table cells. */
export const VERIFICATION_SHORT: Record<SourceKind, string> = {
  "first-party": "Ours",
  "rate-card": "Rate card",
  "verified-in-stock": "Verified",
  "unverified-listing": "Unverified",
  aggregate: "Aggregate",
  "vendor-spec": "Vendor",
};
