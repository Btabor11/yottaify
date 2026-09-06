/**
 * SITE COPY.
 *
 * Section headings, navigation, metadata, footer. Shared by all three
 * directions — a direction may choose which of these it renders, but it may
 * not author its own strings.
 */

import { SITE } from "@/config/site";
import { FLEET, ACCESS, FACILITY, SUPPORT, OWNERSHIP } from "./operator";
import { NODE } from "./hardware";
import { QUOTE } from "./pricing";

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
  { id: "assurance", label: "Assurance", href: "#assurance" },
  { id: "process", label: "Process", href: "#process" },
  { id: "faq", label: "Questions", href: "#faq" },
  { id: "reserve", label: "Reserve", href: "#reserve", cta: true },
];

export const HERO = {
  /** The status pip before the eyebrow. Changes to "Live" on the day. */
  status: "Pre-launch",
  eyebrow: `${FLEET.total} × NVIDIA B300 · ${SITE.location.region} · ${SITE.availability}`,
  /** The headline promise. Verbatim from the brief. */
  headline: "B300 capacity in days, not months.",
  /** Split for line-by-line typographic treatment. Reassembles to `headline`. */
  headlineLines: ["B300 capacity", "in days,", "not months."],
  standfirst: `${FLEET.shape} ${ACCESS.headline} In a warehouse we own outright in the ${SITE.location.region} — ${OWNERSHIP.short.toLowerCase()}, single tenant, with an operator on site. Online ${SITE.availability}.`,
  /**
   * Four facts under the hero. Every one is checkable further down the same
   * page, and each carries the source id it rests on so a direction can cite
   * it without a component deciding which source applies.
   *
   * There is no rate here on purpose — see QUOTE in content/pricing.ts. The
   * slot it used to occupy now carries the thing a hyperscaler cannot match,
   * which is a better use of the fourth tile than a number would be.
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
    { label: "Support", value: "On site", detail: "24/7, by the owners", sourceId: "facility" },
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
  operator: {
    index: "03",
    eyebrow: "Operator",
    heading: "Who runs this, and where it sits",
    standfirst: `${FACILITY.kind} in the ${SITE.location.region}, ${FACILITY.ownership.toLowerCase()}. ${OWNERSHIP.short}. ${SUPPORT.short}.`,
  },
  name: {
    index: "03.2",
    eyebrow: "The name",
    heading: `Why ${SITE.name}`,
    standfirst: "",
  },
  assurance: {
    index: "04",
    eyebrow: "Assurance",
    heading: "Security, on the record",
    standfirst:
      "The certifications we are working towards and where each one honestly stands, plus the part of the security story a single-tenant building already gives you.",
  },
  process: {
    index: "05",
    eyebrow: "Process",
    heading: "Every step, in order",
    standfirst:
      "What to have ready, what a reservation does, and what happens between a slot and a running job.",
  },
  reserve: {
    index: "07",
    eyebrow: "Reserve",
    heading: "Hold a slot",
    standfirst: "",
  },
  faq: {
    index: "06",
    eyebrow: "Questions",
    heading: "Asked before reserving",
    standfirst:
      "Answered with what we know, and marked where the answer is set on the call instead.",
  },
} as const;

/**
 * Drawing title block. Every paper section opens with one: the sheet number,
 * the title, the date the figures were checked, and the scale. It is the
 * device that says "this page can be argued with" without saying it.
 */
export const TITLEBLOCK = {
  sheet: "Sheet",
  title: "Title",
  checked: "Checked",
  scale: "Scale",
  scaleValue: "Not to scale",
  of: "of",
  total: 7,
} as const;

export const FOOTER = {
  wordmarkNote: `${FLEET.total} × NVIDIA B300 · ${SITE.location.region}`,
  columns: [
    {
      id: "site",
      label: "Site",
      links: [
        { label: "Pricing comparison", href: "/pricing", scope: "site" },
        { label: "Leases, 1–5 years", href: "/#leases", scope: "site" },
        { label: "Reserve capacity", href: "/#reserve", scope: "site" },
        { label: "Hardware", href: "/#specs", scope: "site" },
        { label: "Assurance", href: "/#assurance", scope: "site" },
        { label: "Facility and power", href: "/facility", scope: "site" },
        { label: "The name", href: "/#name", scope: "site" },
        { label: "How it works", href: "/#process", scope: "site" },
        { label: "Questions", href: "/#faq", scope: "site" },
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
    links: readonly { label: string; href: string; scope: "site" | "absolute" }[];
  }[],
  /** Rendered at the bottom of every page. The honesty, compressed. */
  disclosure: `${SITE.name} has no customers, no operating history, and no third-party certifications in hand — the ones we are working towards are listed with their honest status. We do not publish our own rate; it is quoted against the job on the call. Every third-party figure on this site carries a source and the date it was checked. Rates verified ${formatAsOf(SITE.pricingAsOf)} and subject to change.`,
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
    description: `Published NVIDIA B300 rental rates across neoclouds and hyperscalers, each with its source and the date it was checked. Our own capacity is quoted against the job on a call. Verified ${formatAsOf(SITE.pricingAsOf)}.`,
    /** H1 for /pricing. Different from the landing section heading on purpose. */
    h1: "NVIDIA B300 rental pricing, sourced and dated",
    standfirst: `Every published B300 rate we could find, what it costs per GPU-hour, and whether we could confirm the capacity was actually available. ${QUOTE.position} — the figure is set on the call. Last checked ${formatAsOf(SITE.pricingAsOf)}.`,
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
 * Resolve a footer link.
 *
 * Kept as a function rather than inlining the href: when there were three
 * design directions this rewrote every link to the current one, and the
 * footer component still calls it. Now that the site has a single root it is
 * an identity function, and the `scope` field is what documents that a link
 * is ours rather than external.
 */
export function resolveFooterHref(link: { href: string; scope: "site" | "absolute" }): string {
  return link.href;
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
