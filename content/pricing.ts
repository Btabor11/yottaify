/**
 * VERIFIED MARKET PRICING — as of 2 Sep 2026.
 *
 * READ THIS BEFORE EDITING COPY THAT TOUCHES PRICE.
 *
 * We are NOT the cheapest listed rate. There are published listings below
 * $6.75. What is true, and stronger, is that the sub-$7 listings are largely
 * phantom capacity — the cheapest rate anyone can verify as actually in stock
 * is $7.89, and hyperscalers quote four to ten weeks to provision.
 *
 * FORBIDDEN, anywhere on this site:
 *   "lowest price" · "cheapest" · "beats every neocloud" · any price superlative
 *
 * The lead is AVAILABILITY. Price is the second argument.
 */

import { source, VERIFICATION_LABEL, VERIFICATION_SHORT, type SourceKind } from "./sources";

export const OUR_RATE = 6.75;

/**
 * Our rate, pre-formatted in every shape a component needs. Derived from
 * OUR_RATE so the number exists exactly once in the codebase.
 */
export const RATE = {
  value: OUR_RATE,
  display: `$${OUR_RATE.toFixed(2)}`,
  unit: "per GPU-hour",
  unitShort: "/ GPU-hr",
  get full() {
    return `${this.display} ${this.unit}`;
  },
  get fullShort() {
    return `${this.display} ${this.unitShort}`;
  },
} as const;

export type PriceCategory = "ours" | "hyperscaler" | "verified" | "median" | "unverified" | "committed";

export interface PriceRow {
  id: string;
  /** Display name. Unnamed aggregate rows describe the set, not a provider. */
  provider: string;
  /** Optional second line — instance shape, term, caveat. */
  qualifier?: string;
  category: PriceCategory;
  /** Numeric low / high in USD per GPU-hour. Used for charts and sorting. */
  low: number;
  high?: number;
  /** Pre-formatted rate string. Components render this verbatim. */
  display: string;
  term: string;
  sourceId: string;
  /** Shown to the user as the caveat on the row. */
  note?: string;
  /** True for the row that is us — drives highlight styling, not ranking. */
  isUs?: boolean;
}

export const PRICE_ROWS: PriceRow[] = [
  {
    id: "ours",
    provider: "This fleet",
    qualifier: "Bare metal, 8-GPU node",
    category: "ours",
    low: OUR_RATE,
    display: "$6.75",
    term: "On-demand",
    sourceId: "ours",
    note: "Committed terms price below this. Rate quoted on the call.",
    isUs: true,
  },
  {
    id: "neocloud-low",
    provider: "Neocloud listings, low end",
    qualifier: "Multiple providers",
    category: "unverified",
    low: 6.5,
    high: 6.95,
    display: "$6.50–6.95",
    term: "On-demand",
    sourceId: "surveyUnverified",
    note: "Below our rate — and frequently unverified or out of stock. We could not book capacity at any of these prices.",
  },
  {
    id: "verified-low",
    provider: "Lowest verified in-stock listing",
    qualifier: "Confirmed orderable",
    category: "verified",
    low: 7.89,
    display: "$7.89",
    term: "On-demand",
    sourceId: "surveyVerified",
    note: "The cheapest B300-class capacity we could confirm as actually available to buy.",
  },
  {
    id: "median",
    provider: "Median on-demand",
    qualifier: "Across providers we track",
    category: "median",
    low: 7.85,
    high: 7.87,
    display: "$7.85–7.87",
    term: "On-demand",
    sourceId: "surveyMedian",
    note: "Midpoint of tracked published rates. Half of what we saw was higher.",
  },
  {
    id: "oracle",
    provider: "Oracle",
    qualifier: "Oracle Cloud Infrastructure",
    category: "hyperscaler",
    low: 15.0,
    display: "$15.00",
    term: "On-demand",
    sourceId: "oracleList",
  },
  {
    id: "aws",
    provider: "AWS",
    qualifier: "Amazon EC2",
    category: "hyperscaler",
    low: 17.8,
    display: "$17.80",
    term: "On-demand",
    sourceId: "awsList",
  },
  {
    id: "committed",
    provider: "Reserved / committed",
    qualifier: "Across providers we track",
    category: "committed",
    low: 4.25,
    high: 5.62,
    display: "$4.25–5.62",
    term: "24–60 month",
    sourceId: "surveyCommitted",
    note: "Long commitments buy a lower rate everywhere, including here. This is the market range, not our rate card.",
  },
];

/** Rows to chart on the landing page, in the order that tells the story. */
export const CHART_ROW_IDS = ["ours", "neocloud-low", "verified-low", "median", "oracle", "aws"] as const;

export function row(id: string): PriceRow {
  const r = PRICE_ROWS.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown price row: ${id}`);
  return r;
}

export const CHART_ROWS: PriceRow[] = CHART_ROW_IDS.map(row);

/** Largest rate on the chart, for bar scaling. Computed, never hardcoded. */
export const CHART_MAX = Math.max(...CHART_ROWS.map((r) => r.high ?? r.low));

/**
 * Arithmetic on published rates only. Recomputed at render so it cannot drift.
 *
 * Two decimals below 2×, one above. At one decimal, the $6.50 neocloud listing
 * rounds to "1.0×" — which reads as parity when it is in fact CHEAPER than us.
 * Rounding away the one comparison that is unflattering is exactly the kind of
 * thing this page exists not to do.
 */
export function multipleOfOurRate(rate: number): string {
  const ratio = rate / OUR_RATE;
  return `${ratio.toFixed(ratio < 2 ? 2 : 1)}×`;
}

export function verificationLabel(sourceId: string): string {
  return VERIFICATION_LABEL[source(sourceId).kind];
}

export function verificationShort(sourceId: string): string {
  return VERIFICATION_SHORT[source(sourceId).kind];
}

export function verificationKind(sourceId: string): SourceKind {
  return source(sourceId).kind;
}

/**
 * THE POSITIONING PARAGRAPH.
 * The honest version of the price argument. Every direction uses this copy.
 */
export const PRICE_POSITION = {
  eyebrow: "The honest version",
  heading: "Cheaper listings exist. Bookable ones mostly do not.",
  body:
    "There are published B300 rates below ours — $6.50 to $6.95 across several neoclouds. We went looking for them. What we found was capacity that was out of stock, listings that could not be confirmed, or a sales process that never produced a slot you could actually take. The cheapest rate we could verify as in stock was $7.89.",
  body2:
    "So the argument is not that this is the lowest number on the internet. It is that this is a real number attached to real hardware with a date on it. Every rate below carries where we got it and when we checked, which is not a courtesy — it is the only way you can tell the difference.",
  /** The delivery-time contrast, which is the actual lead. */
  leadClaim: {
    ours: "Days",
    theirs: "Four to ten weeks",
    theirsQualifier: "Hyperscaler quoted lead time to provision reserved capacity.",
  },
} as const;

export const AVAILABILITY_CLAIM = {
  headline: "B300 capacity in days, not months.",
  support:
    "Sixteen GPUs, two nodes, one building we own. Nothing to procure, no queue ahead of you but the other reservations, and no regional capacity committee. Hyperscalers quote four to ten weeks to provision reserved capacity. We are working in days.",
} as const;

/** Methodology, shown in full on /pricing. This page's credibility depends on it. */
export const METHODOLOGY = {
  heading: "How this table was built",
  points: [
    {
      label: "What counts as a rate",
      body: "Published per-GPU-hour on-demand pricing for B300-class capacity. Where a provider prices by instance, we divide by the number of GPUs in that instance and say so.",
    },
    {
      label: "What counts as verified",
      body: "We got to a checkout or quote step and capacity was orderable. A price on a marketing page with no bookable stock behind it is listed here as unverified, because that is what it is.",
    },
    {
      label: "Why some rows are unnamed",
      body: "Named rows link to the provider's own public rate card. Unnamed rows are aggregates from our own survey, or listings we are not republishing as an endorsement. We would rather show you the number without the logo than not show you the number.",
    },
    {
      label: "What we do not claim",
      body: "That this is the cheapest capacity available. It is not. Listings below our rate exist; we could not book them. We also do not publish our committed rate card, because committed pricing depends on term and volume.",
    },
    {
      label: "How often this changes",
      body: "Rates move. Every row carries the date we read it. If a figure here is stale, it is stale with a visible timestamp rather than quietly wrong.",
    },
  ],
} as const;

/** Transparent arithmetic for the cost estimator. Not a claim, just multiplication. */
export const ESTIMATOR = {
  heading: "Run the arithmetic yourself",
  body: "Published rates × your GPU count × your hours. No assumptions of ours in the number — change any input.",
  defaultGpus: 8 as number,
  defaultHours: 730 as number,
  hoursNote: "730 h ≈ one month running continuously",
  disclaimer:
    "Straight multiplication of the published rates above. Not a quote, and it excludes anything a provider bills separately.",
} as const;
