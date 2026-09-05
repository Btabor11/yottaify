/**
 * MARKET TRACKER — copy.
 *
 * The page's argument, in one sentence: the B300 market is hard to read, and
 * we can show exactly how hard. Nothing here claims we are cheapest. Everything
 * here is about legibility — what sellers publish, what trackers report, how
 * far apart those are, and how much of what is listed can actually be bought.
 */

export const MARKET = {
  eyebrow: "Market legibility",
  h1: "What the B300 market says the price is — and how much it disagrees with itself.",
  standfirst:
    "Every day we read each seller's own rate card and every public tracker that reports on them. Then we measure the gap. A published price a buyer cannot verify is not a price; it is a rumour with a dollar sign.",
  ourRail: "Our on-demand rate",
  ourRailNote: "Fixed. The one line on this page that does not move.",

  hero: {
    label: "Legibility index",
    explain:
      "How readable the market is today, 0–100. Composed from four measured things, each shown below. It is not a score of the market; it is a score of how much of the market you can actually see.",
    components: {
      agreement: { label: "Agreement", explain: "How closely sellers' own prices and trackers' reports of them line up. 100% = every figure for every seller is identical." },
      coverage: { label: "First-hand coverage", explain: "Share of sellers whose own rate we could read without a sales call." },
      visibility: { label: "Stock visibility", explain: "Share of sellers for whom anyone — the seller or a tracker that checks — publishes a stock signal at all." },
      bookable: { label: "Bookable", explain: "Share of listed B300 configurations a tracker confirms as purchasable right now." },
    },
  },

  floor: {
    eyebrow: "The floor",
    heading: "Every seller as a blade. Height is price. Light is stock. The band is disagreement.",
    legend: {
      published: "Seller's own rate",
      reported: "As reported by a tracker",
      band: "Spread between them",
      rail: "Our rate",
      inStock: "In stock",
      limited: "Limited",
      outOfStock: "Out of stock",
      none: "No stock signal",
    },
    hint: "Drag the timeline to replay the days. Hover a blade for its figures.",
  },

  spread: {
    eyebrow: "The spread",
    heading: "One seller, several prices.",
    body:
      "The filled mark is what the seller publishes. The hollow marks are what trackers say the seller charges. When they sit apart, the seller is not lying and the trackers are not lying — they read different pages on different days, and nobody dates their figures. We do.",
    empty: "No figures today.",
  },

  bookable: {
    eyebrow: "Bookable",
    heading: "Listed is not the same as available.",
    body: "One tracker polls seller APIs hourly and counts how many listed B300 configurations can actually be ordered. This is the number the rest of the market does not print.",
    attribution: "As counted by",
  },

  history: {
    eyebrow: "Over time",
    heading: "Legibility, day by day.",
    body: "The index and the median published on-demand rate, one point per day since the tracker started. A short line means a young tracker, not a stable market.",
    young: (days: number) => (days === 1 ? "One day recorded so far. The line grows daily." : `${days} days recorded.`),
    synthetic: "Synthetic history — local test data, never shown in production.",
  },

  sources: {
    eyebrow: "Sources",
    heading: "Every source, including the ones we refused.",
    body:
      "A tracker is only as honest as its list of sources, so here is ours in full: what each one is, how we read it, what its terms say, and whether it worked today. Two are listed and deliberately not read.",
    columns: { source: "Source", kind: "Kind", state: "Today", method: "What we read", terms: "Terms" },
    states: { ok: "Read", error: "Failed", declined: "Not read, by choice", gated: "Gated", blocked: "Blocked" },
  },

  method: {
    eyebrow: "Method",
    heading: "How this is built, so you can check it.",
    points: [
      { label: "Once a day", body: "A scheduled job reads every source once, early UTC morning. One request per source. We identify ourselves in the request as a tracker and link to this page." },
      { label: "First-hand first", body: "A seller's price is whatever the seller's own rate card or API says. A tracker's report is shown as a report, beside it, never in place of it." },
      { label: "Evidence kept", body: "Every figure stores the URL read, the timestamp, a hash of the response, a short excerpt around the number, and any arithmetic applied. Click a figure to see it." },
      { label: "Stock has a basis", body: "A seller's own stock field beats a tracker that checks, which beats a tracker that guesses. 'Lowest bookable' never rests on a guess." },
      { label: "Refusals are shown", body: "Sources behind a bot challenge or whose terms forbid automated reading appear in the ledger as not read, with the reason. Routing around either would make this page a hypocrite." },
      { label: "Failures are shown", body: "When a parser breaks, the source shows as failed for that day rather than silently repeating yesterday's number. A gap in the line is information." },
    ],
  },

  stock: {
    "in-stock": "In stock",
    limited: "Limited",
    "out-of-stock": "Out of stock",
    waitlist: "Waitlist",
    unknown: "Unknown",
    "not-reported": "No signal",
  } as const,

  basis: {
    provider: "seller's own stock field",
    "tracker-checked": "tracker that polls seller APIs",
    "tracker-heuristic": "tracker's estimate, not a stock check",
  } as const,

  states: {
    ok: "published",
    gated: "sales call required",
    "not-offered": "not on their price list",
    "not-read": "trackers only",
    blocked: "blocked automated reads",
    declined: "not read, by choice",
    error: "read failed today",
  } as const,

  meta: {
    title: "B300 market legibility tracker",
    description:
      "Daily, sourced, dated: what every B300 seller publishes, what public trackers report, how far apart they are, and how much listed capacity is actually bookable.",
  },
} as const;
