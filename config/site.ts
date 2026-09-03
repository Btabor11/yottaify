/**
 * SINGLE SOURCE OF IDENTITY.
 *
 * The company name is not final — two candidates are still being decided
 * between. Every name, tagline, URL, and handle in the entire codebase reads
 * from this object. To rename the company, edit `name` (and `shortName` /
 * `legalName` / `domain` if they differ) here and nowhere else.
 *
 * Verify a rename with:  npm run verify:identity
 * (greps the tree for any literal occurrence of the name outside this file)
 */

export const NAME_CANDIDATES = ["Cluer", "Ozark Compute"] as const;

export const SITE = {
  /** Front-of-house name. Appears in the logo, <title>, OG tags, footer, form copy. */
  name: "Cluer",
  /** Used where a shorter mark reads better (mobile nav, wordmark glyph). */
  shortName: "Cluer",
  /** Placeholder until entity formation completes — not yet a verified legal name. */
  legalName: "Cluer",
  /** Two-character monogram for the logo mark. Derived so it follows renames. */
  get monogram() {
    return this.shortName.slice(0, 2).toUpperCase();
  },

  /** Headline promise. The one sentence the whole site exists to deliver. */
  tagline: "B300 capacity in days, not months.",
  /** ~150 char meta description. */
  description:
    "Sixteen NVIDIA B300 GPUs in two 8-GPU NVLink nodes, in a privately owned Arkansas facility. Bare metal, $6.75/GPU-hour on-demand, available November 2026.",

  /** Placeholder — domain not yet registered. */
  domain: "example.com",
  get url() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? `https://${this.domain}`;
  },

  /** Placeholder contact routes — replace with real inboxes before launch. */
  email: {
    sales: "reservations@example.com",
    general: "hello@example.com",
  },

  /** Empty string = link is not rendered. No invented accounts. */
  social: {
    linkedin: "",
    x: "",
    github: "",
  },

  /** Where the hardware physically is. Region only — no street address published. */
  location: {
    region: "Arkansas Ozarks",
    country: "United States",
    /** Deliberately vague: the facility address is not public. */
    detail: "Privately owned warehouse, Arkansas Ozarks",
  },

  /** Which design direction `/` currently redirects to. Promote a winner by editing this. */
  frontRunner: "d1" as "d1" | "d2" | "d3",

  /** Global "as of" date for market pricing. Every rate on the site was checked on this date. */
  pricingAsOf: "2026-09-02",

  /** Target date the fleet comes online. */
  availability: "November 2026",
  /** Same fact, short enough for a table cell or a stat tile without wrapping. */
  availabilityShort: "Nov 2026",
} as const;

export type SiteConfig = typeof SITE;

/** Design directions, for nav/switcher and metadata. */
export const DIRECTIONS = [
  {
    slug: "d1",
    label: "Cold Room",
    blurb: "Instrument panel. Dark, telemetric, monospaced.",
  },
  {
    slug: "d2",
    label: "Ledger",
    blurb: "Editorial print. Warm paper, serif, footnoted.",
  },
  {
    slug: "d3",
    label: "Substation",
    blurb: "Kinetic. Saturated, WebGL, high-voltage.",
  },
] as const;

export type DirectionSlug = (typeof DIRECTIONS)[number]["slug"];
