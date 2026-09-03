/**
 * SITE COPY.
 *
 * Section headings, navigation, metadata, footer. Shared by all three
 * directions — a direction may choose which of these it renders, but it may
 * not author its own strings.
 */

import { SITE } from "@/config/site";
import { FLEET, ACCESS, FACILITY } from "./operator";
import { NODE } from "./hardware";
import { RATE } from "./pricing";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** The reserve link is styled as a button everywhere, not as a nav item. */
  cta?: boolean;
}

export const NAV: NavItem[] = [
  { id: "pricing", label: "Pricing", href: "#pricing" },
  { id: "specs", label: "Hardware", href: "#specs" },
  { id: "operator", label: "Operator", href: "#operator" },
  { id: "reserve", label: "Reserve", href: "#reserve", cta: true },
];

export const HERO = {
  eyebrow: `${FLEET.total} × NVIDIA B300 · ${SITE.location.region} · ${SITE.availability}`,
  /** The headline promise. Verbatim from the brief. */
  headline: "B300 capacity in days, not months.",
  /** Split for line-by-line typographic treatment. Reassembles to `headline`. */
  headlineLines: ["B300 capacity", "in days,", "not months."],
  standfirst: `${FLEET.shape} ${ACCESS.headline} Air-cooled, in a warehouse we own in the ${SITE.location.region}. On-demand at ${RATE.full}, online ${SITE.availability}.`,
  /**
   * Four facts under the hero. Every one is checkable further down the same
   * page, and each carries the source id it rests on so a direction can cite
   * it without a component deciding which source applies.
   */
  facts: [
    {
      label: "Fleet",
      value: `${FLEET.total} × B300`,
      detail: `${FLEET.nodes} × ${FLEET.gpusPerNode}-GPU nodes`,
      sourceId: "facility",
    },
    {
      label: "Per node",
      value: `${NODE.hbmGbFormatted} GB`,
      detail: "HBM3e, one NVLink domain",
      sourceId: "nvidiaBlackwellUltra",
    },
    { label: "On-demand", value: RATE.display, detail: RATE.unit, sourceId: "ours" },
    {
      label: "Online",
      value: SITE.availabilityShort,
      detail: "target availability",
      sourceId: "facility",
    },
  ],
  ctaPrimary: "Reserve capacity",
  ctaSecondary: "See the price comparison",
  /** Sits directly under the CTA. Pre-empts the first objection. */
  ctaNote: "No payment at this step.",
} as const;

export const SECTIONS = {
  pricing: {
    index: "01",
    eyebrow: "Pricing",
    heading: "What the market actually charges",
    standfirst: `Published B300 rates, with the source and the date we read it on every row. Checked ${formatAsOf(SITE.pricingAsOf)}.`,
  },
  specs: {
    index: "02",
    eyebrow: "Hardware",
    heading: "One node, one memory domain",
    standfirst: `NVIDIA's published specification for the part, and what each number changes about the job you are trying to run.`,
  },
  reserve: {
    index: "03",
    eyebrow: "Reserve",
    heading: "Hold a slot",
    standfirst: "",
  },
  operator: {
    index: "04",
    eyebrow: "Operator",
    heading: "Who runs this, and where it sits",
    standfirst: `${FACILITY.kind} in the ${SITE.location.region}. ${FACILITY.ownership}. ${FACILITY.advantage}.`,
  },
} as const;

export const FOOTER = {
  wordmarkNote: `${FLEET.total} × NVIDIA B300 · ${SITE.location.region}`,
  columns: [
    {
      id: "site",
      label: "Site",
      links: [
        // `direction` links are relative to the current design direction, so
        // /d2's footer points at /d2/pricing without the component knowing.
        { label: "Pricing comparison", href: "/pricing", scope: "direction" },
        { label: "Reserve capacity", href: "#reserve", scope: "direction" },
        { label: "Hardware", href: "#specs", scope: "direction" },
      ],
    },
    {
      id: "legal",
      label: "Legal",
      links: [
        { label: "Privacy Policy", href: "/legal/privacy", scope: "absolute" },
        { label: "Terms of Service", href: "/legal/terms", scope: "absolute" },
      ],
    },
  ] as const satisfies readonly {
    id: string;
    label: string;
    links: readonly { label: string; href: string; scope: "direction" | "absolute" }[];
  }[],
  /** Rendered at the bottom of every page. The honesty, compressed. */
  disclosure: `${SITE.name} has no customers, no uptime history, and no third-party certifications. Every figure on this site carries a source and the date it was checked. Rates verified ${formatAsOf(SITE.pricingAsOf)} and subject to change.`,
  get copyright() {
    return `© ${new Date().getFullYear()} ${SITE.legalName}`;
  },
} as const;

export const META = {
  home: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  pricing: {
    title: `B300 GPU pricing comparison — ${SITE.name}`,
    description: `Published NVIDIA B300 rental rates across neoclouds and hyperscalers, each with its source and the date it was checked. Our on-demand rate is $6.75 per GPU-hour. Verified ${formatAsOf(SITE.pricingAsOf)}.`,
    /** H1 for /pricing. Different from the landing section heading on purpose. */
    h1: "NVIDIA B300 rental pricing, sourced and dated",
    standfirst: `Every published B300 rate we could find, what it costs per GPU-hour, and whether we could confirm the capacity was actually available. Last checked ${formatAsOf(SITE.pricingAsOf)}.`,
  },
  legal: {
    draftBanner: "Draft — pending legal review",
    privacy: {
      title: `Privacy Policy — ${SITE.name}`,
      description: `How ${SITE.name} handles information submitted through the reservation form.`,
      h1: "Privacy Policy",
    },
    terms: {
      title: `Terms of Service — ${SITE.name}`,
      description: `Terms governing use of the ${SITE.name} website.`,
      h1: "Terms of Service",
    },
  },
} as const;

/**
 * Resolve a footer link for the direction rendering it.
 *   direction-scoped "/pricing"  in d2 → "/d2/pricing"
 *   direction-scoped "#reserve"  in d2 → "/d2#reserve"
 *   absolute         "/legal/..."      → unchanged
 */
export function resolveFooterHref(
  link: { href: string; scope: "direction" | "absolute" },
  direction: string,
): string {
  if (link.scope === "absolute") return link.href;
  return link.href.startsWith("#") ? `/${direction}${link.href}` : `/${direction}${link.href}`;
}

/** "2026-09-02" → "2 September 2026". Used everywhere an "as of" date renders. */
export function formatAsOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

/** "2026-09-02" → "2 Sep 2026". For tight table cells. */
export function formatAsOfShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}
