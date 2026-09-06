/**
 * VERIFIED MARKET PRICING — as of 2 Sep 2026.
 *
 * READ THIS BEFORE EDITING COPY THAT TOUCHES PRICE.
 *
 * This module holds THIRD-PARTY published rates only. Our own per-GPU-hour
 * figure is deliberately absent from the site: it is agreed on the call, once
 * the shape and term of the job are known. The number itself lives in
 * `lib/server/rate.ts`, which no component may import, and `npm run audit`
 * fails if it appears anywhere a browser can reach.
 *
 * What the page argues instead is a POSITION (`QUOTE`, below): our quote lands
 * under the lowest rate anyone could confirm as actually bookable. That is a
 * true, checkable statement — the benchmark it rests on is on the page with its
 * source and its date — and it survives the rate moving.
 *
 * FORBIDDEN, anywhere on this site:
 *   "lowest price" · "cheapest" · "beats every neocloud" · any price superlative
 *
 * The lead is AVAILABILITY. Price is the second argument.
 */

import { source, VERIFICATION_LABEL, VERIFICATION_SHORT, type SourceKind } from "./sources";
import { FLEET } from "./operator";

/**
 * The row every comparison on the site is measured against: the lowest rate we
 * could take to a checkout and actually buy. Not the lowest number published —
 * the lowest number that was real. Multiples, deltas and the chart datum all
 * key off this, so the comparison is between a buyer's two real options.
 */
export const BENCHMARK_ROW_ID = "verified-low";

export type PriceCategory = "hyperscaler" | "verified" | "median" | "unverified" | "committed";

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
  /** True for the row the rest of the table is measured against. */
  isBenchmark?: boolean;
}

export const PRICE_ROWS: PriceRow[] = [
  {
    id: "neocloud-low",
    provider: "Neocloud listings, low end",
    qualifier: "Multiple providers",
    category: "unverified",
    low: 6.5,
    high: 7.5,
    display: "$6.50–7.50",
    term: "On-demand",
    sourceId: "surveyUnverified",
    note: "The cheapest published B300 numbers we found anywhere. We could not book capacity at any of them — out of stock, unconfirmable, or a sales process that never produced a slot. They are in the table because leaving them out would flatter us.",
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
    note: "The cheapest B300-class capacity we could confirm as actually available to buy. This is the benchmark the rest of this page is measured against, because it is the real alternative to us.",
    isBenchmark: true,
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
    provider: "Oracle",
    id: "oracle",
    qualifier: "Oracle Cloud Infrastructure",
    category: "hyperscaler",
    low: 15.0,
    display: "$15.00",
    term: "On-demand",
    sourceId: "oracleList",
  },
  {
    // "on-demand" is in the name, not just the term column, because the charts
    // have no term column and AWS now appears twice in the table.
    provider: "AWS on-demand",
    id: "aws",
    qualifier: "Amazon EC2",
    category: "hyperscaler",
    low: 17.8,
    display: "$17.80",
    term: "On-demand",
    sourceId: "awsList",
  },
  {
    id: "aws-capacity-blocks",
    provider: "AWS Capacity Blocks",
    qualifier: "Amazon EC2, same B300 instance",
    category: "hyperscaler",
    low: 14.04,
    display: "$14.04",
    term: "Reserved block",
    sourceId: "awsCapacityBlocks",
    note: "Cheaper than AWS on-demand above, and the lowest hyperscaler rate here. You book the block ahead and pay it up front, which is the lead time this page is about.",
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
    note: "Long commitments buy a lower rate everywhere, including here. This is the market range, not a rate card of ours. Interruptible spot capacity is cheaper still — we have seen B300 spot from about $4.30 — but spot can be reclaimed mid-run, which is a different product from guaranteed capacity and is not what this row prices.",
  },
];

/** Rows to chart on the landing page, in the order that tells the story. */
export const CHART_ROW_IDS = ["neocloud-low", "verified-low", "median", "oracle", "aws"] as const;

export function row(id: string): PriceRow {
  const r = PRICE_ROWS.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown price row: ${id}`);
  return r;
}

export const CHART_ROWS: PriceRow[] = CHART_ROW_IDS.map(row);

/** The benchmark row, resolved once. Everything comparative reads from this. */
export const BENCHMARK: PriceRow = row(BENCHMARK_ROW_ID);

/** Largest rate on the chart, for bar scaling. Computed, never hardcoded. */
export const CHART_MAX = Math.max(...CHART_ROWS.map((r) => r.high ?? r.low));

/**
 * OUR POSITION, WITHOUT A NUMBER.
 *
 * Every place a rate of ours would once have been printed now renders one of
 * these strings. They are claims about where we sit relative to a figure that
 * *is* on the page, dated and sourced, so nothing here has to be taken on
 * trust — and none of it has to be revised when the rate moves.
 */
export const QUOTE = {
  /** Drop-in for a rate cell or a stat tile. */
  short: "On the call",
  /** Drop-in where the unit reads naturally after it. */
  unit: "per GPU-hour",
  /** One line, for a table row or a chart label. */
  label: "Quoted on the call",
  /** The competitive claim. Relative to BENCHMARK, which is on the page. */
  position: "Under the lowest rate we could confirm as bookable",
  /** Short enough for a chart band or a sidebar. */
  positionShort: "Under the verified floor",
  /** Why there is no figure here, said before the reader has to ask. */
  why:
    "We do not print a per-GPU-hour figure on this site. Capacity this small gets priced against the job — how many GPUs, for how long, on what term — and a headline number would be wrong for almost everyone who read it. What we will commit to in public is the position: our on-demand quote comes in under the lowest rate on this page that anyone could confirm was actually in stock, and committed terms price below that again.",
  /** What the reader should do instead. */
  cta: "Tell us the job and we will quote it",
  sourceId: "ours",
} as const;

/**
 * THE POSITIONING PARAGRAPH.
 * The honest version of the price argument.
 */
export const PRICE_POSITION = {
  eyebrow: "The honest version",
  heading: "Cheaper listings exist. Bookable ones mostly do not.",
  body:
    "There are published B300 rates in the $6.50–6.95 range. We went looking for them. What we found was capacity that was out of stock, listings that could not be confirmed, or a sales process that never produced a slot you could actually take. The lowest rate we could verify as in stock was $7.89, and that is the number we hold ourselves against.",
  body2:
    "So the argument is not that some number of ours is the smallest on the internet. It is that the alternative you can actually buy today costs what the table below says it costs, it takes weeks to get, and we come in under it on a date you can hold us to. Every rate below carries where we got it and when we checked, which is not a courtesy — it is the only way you can tell the difference.",
  /** The delivery-time contrast, which is the actual lead. */
  leadClaim: {
    /** Caption over the two lead-time bars. */
    title: "Time to capacity",
    oursLabel: "Here",
    ours: "Days",
    theirsLabel: "Hyperscaler",
    theirs: "Four to ten weeks",
    theirsQualifier: "Hyperscaler quoted lead time to provision reserved capacity.",
  },
} as const;

export const AVAILABILITY_CLAIM = {
  headline: "B300 capacity in days, not months.",
  support: `${FLEET.totalWord.charAt(0).toUpperCase() + FLEET.totalWord.slice(1)} GPUs, ${FLEET.nodesWord} nodes, one building we own. Nothing to procure, no queue ahead of you but the other reservations, and no regional capacity committee. Hyperscalers quote four to ten weeks to provision reserved capacity. We are working in days.`,
} as const;

/** Methodology, shown in full on /pricing. This page's credibility depends on it. */
export const METHODOLOGY = {
  heading: "How this table was built",
  points: [
    {
      label: "What counts as a rate",
      body: "Published per-GPU-hour pricing for B300-class capacity. Most rows are on-demand; where a row is a reserved product the term column says so, because reserving a block ahead and taking capacity now are not the same purchase. Where a provider prices by instance, we divide by the number of GPUs in that instance and say so.",
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
      label: "Why our own rate is not a row",
      body: `Because a single headline figure would be wrong for almost every reader. A two-GPU evaluation and a two-year commitment on all ${FLEET.nodesWord} nodes are not the same purchase and should not carry the same number. We quote against the job on the call. What we will say in public is where the quote lands: under the lowest rate in this table that we could confirm was in stock.`,
    },
    {
      label: "What we do not claim",
      body: "That this is the cheapest capacity available. Published numbers below the verified floor exist and are in the table; we could not book them, and neither could you on the day we looked.",
    },
    {
      label: "How often this changes",
      body: "Rates move. Every row carries the date we read it. If a figure here is stale, it is stale with a visible timestamp rather than quietly wrong.",
    },
  ],
} as const;

/**
 * Arithmetic on published rates only. Recomputed at render so it cannot drift.
 *
 * Two decimals below 2×, one above, so that a row barely above the benchmark
 * does not round to "1.0×" and read as parity.
 */
export function multipleOfBenchmark(rate: number): string {
  const ratio = rate / BENCHMARK.low;
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

/** Transparent arithmetic for the cost estimator. Not a claim, just multiplication. */
export const ESTIMATOR = {
  heading: "Price the job at the market",
  body:
    "Published rates × your GPU count × your hours. This is what the alternatives cost for the run you have in mind, with no assumptions of ours in the number — change any input. Ours is the one line that is not here, because it is set on the call.",
  defaultGpus: 8 as number,
  defaultHours: 730 as number,
  hoursNote: "730 h ≈ one month running continuously",
  /** Sits under the benchmark total. The competitive claim, in the estimator. */
  benchmarkNote: "The lowest total anyone could actually book on the day we checked",
  ourNote: "Ours comes in under that line. The figure is set against your job, on the call.",
  disclaimer:
    "Straight multiplication of the published rates above. Not a quote, and it excludes anything a provider bills separately.",
} as const;
