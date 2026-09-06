/**
 * THE FACILITY SHEET — /facility.
 *
 * Everything about the building and its service lives here and only here.
 *
 * It is one click away, with its own sheet number, linked from the operator
 * section and the footer. Someone deciding where to run a model does not open
 * with a question about service voltage, and a site that leads with one reads
 * as an electrical contractor rather than a compute provider. The reader who
 * does want it finds it in four seconds; the reader who does not never has to
 * scroll past it.
 *
 * The electrical FIGURES are absent right now and the page says so plainly.
 * They described a two-node build and the fleet is six nodes — see the POWER
 * header in content/operator.ts. What is published instead is the part that is
 * settled: the topology, the tenancy and who holds the keys.
 */

import { SITE } from "@/config/site";
import { FACILITY, POWER, FLEET, OWNERSHIP, SUPPORT } from "./operator";
import { formatAsOf } from "./copy";

export const FACILITY_SHEET = {
  /** Own numbering series, like /pricing. This is not one of the landing sheets. */
  index: "F-01",
  eyebrow: "Facility",
  h1: "The building, the service and who can walk into it",
  standfirst: `The physical detail behind ${FLEET.total} GPUs in a building we own. It is on its own page because it is reference material rather than an argument — and because the electrical figures for a ${FLEET.nodesWord}-node build are not settled enough to print.`,
  meta: {
    title: `Facility, power and physical security — ${SITE.name}`,
    description: `The building, the electrical service and the physical posture behind ${FLEET.total} NVIDIA B300 GPUs in the ${SITE.location.region}. Single tenant, owned outright, ${OWNERSHIP.short.toLowerCase()}.`,
  },

  building: {
    eyebrow: "The building",
    heading: `${FACILITY.notColo}.`,
    body: FACILITY.notColoDetail,
    facts: [
      { label: "Kind", detail: FACILITY.kind },
      { label: "Tenure", detail: `${FACILITY.ownership}. ${FACILITY.advantage}.` },
      { label: "Region", detail: `${SITE.location.region}. Street address not published.` },
      { label: "Tenancy", detail: "Single tenant. No shared floor, no shared cage." },
      { label: "Cooling", detail: `${FLEET.cooling}, sized for the whole fleet.` },
      { label: "Operator", detail: `${OWNERSHIP.short}. ${SUPPORT.short}.` },
    ],
  },

  service: {
    eyebrow: "Electrical service",
    heading: "Sized for the building, not for today.",
    body: `${POWER.summary} All ${FLEET.total} units drawing at once is not how a fleet this size actually runs; it is the case the service is specified against, deliberately with headroom rather than at the limit. Air cooling is specified for the same case.`,
    /** The one-line diagram's own caption. The drawing is Fig. 01. */
    figureNote: `The single-line diagram below is the drawing an electrician would produce for this building: utility, meter, main, bus, ${FLEET.nodesWord} feeders, ${FLEET.nodesWord} loads. It is the topology, and the topology is settled.`,
    /**
     * Deliberately not a figure table. See the header of POWER in
     * content/operator.ts: the old numbers described a two-node build and
     * re-stating them for six would be an estimate wearing a measurement's
     * clothes. These are the things about the service that ARE settled.
     */
    readout: [
      { label: "Topology", value: "Utility, meter, main, bus" },
      { label: "Feeders", value: `${FLEET.nodes}, one per node` },
      { label: "Cooling", value: FLEET.cooling },
      { label: "Figures", value: "Not yet published" },
    ],
    caveat: POWER.pending,
    sourceId: POWER.sourceId,
  },

  /** Closing line under the sheet, matching the disclosure pattern elsewhere. */
  get checked() {
    return `Facility facts for our own build, stated ${formatAsOf(SITE.pricingAsOf)}. Electrical figures are withheld until the ${FLEET.nodesWord}-node service is final and metered.`;
  },
} as const;
