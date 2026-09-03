/**
 * VERIFIED OPERATOR FACTS.
 *
 * Fleet size is exactly sixteen. Not "up to", not "over", not "100+".
 * Electrical figures are measured/calculated for our own build.
 */

import { SITE } from "@/config/site";

export const FLEET_TOTAL = 16;
export const GPUS_PER_NODE = 8;
export const NODE_COUNT = FLEET_TOTAL / GPUS_PER_NODE; // 2

export const FLEET = {
  total: FLEET_TOTAL,
  /** Spelled out, because "sixteen" reads as a deliberate number and "16" reads as a placeholder. */
  totalWord: "sixteen",
  nodes: NODE_COUNT,
  gpusPerNode: GPUS_PER_NODE,
  cooling: "Air-cooled",
  shape: `${FLEET_TOTAL} B300s, configured as ${NODE_COUNT} ${GPUS_PER_NODE}-GPU nodes.`,
  sourceId: "facility",
} as const;

export const POWER = {
  /** Facility load with all 16 units running. */
  loadKw: "35",
  loadKwApprox: true,
  amps: "97",
  ampsApprox: true,
  voltage: "208 V",
  phase: "three-phase",
  /** Short form for tight cells. Avoids "Ø", which the mono faces do not all carry. */
  service: "~97 A @ 208 V 3-phase",
  /** Pre-composed because the arithmetic ties together and must not be re-derived. */
  summary: "~35 kW at the meter. ~97 A on 208 V three-phase.",
  sourceId: "facility",
} as const;

export const FACILITY = {
  kind: "Privately owned warehouse",
  region: SITE.location.region,
  ownership: "Owned outright",
  /** The structural cost advantage. Stated plainly because it is the real reason. */
  advantage: "No colocation fees",
  advantageDetail:
    "The building is ours. There is no landlord taking a margin on every kilowatt and no rack rent priced off someone else's capital stack. That is the whole reason the rate is what it is — not a promotional price, not venture subsidy, just a cost structure most new entrants do not have.",
  sourceId: "facility",
} as const;

export const ACCESS = {
  model: "Bare metal",
  interface: "SSH and a scheduler",
  headline: "Bare metal. SSH and a scheduler.",
  /** Framed as a feature, not an apology. */
  body:
    "Not a containerized cloud platform. There is no control plane between you and the device, no orchestration layer to learn, no abstraction deciding how your job gets placed. You get root on the box, the driver stack, and a scheduler to queue against. If you were planning to fight a platform to get at the hardware, there is nothing here to fight.",
  /** What we are explicitly not offering, so nobody discovers it in week two. */
  notIncluded: [
    "No managed notebooks or hosted IDE.",
    "No object storage product. Bring your own, or use local NVMe.",
    "No autoscaling. The fleet is sixteen GPUs and the number is knowable.",
  ],
  sourceId: "facility",
} as const;

export const CONTRACT = {
  model: "Take-or-pay",
  headline: "Take-or-pay. Fixed capacity at a fixed price.",
  termYears: "2–3 years",
  body:
    "Fixed capacity at a fixed price for two to three years. You commit to the slot, we commit to the rate, and neither side re-prices when the market moves. Committed terms price below the on-demand rate — how far below depends on term length and volume, which is what the call is for.",
  sourceId: "facility",
} as const;

export const TIMELINE = {
  target: SITE.availability,
  /** Milestones we can state. Nothing implied about progress we cannot evidence. */
  phases: [
    {
      id: "site",
      label: "Site",
      status: "Secured",
      detail: `${FACILITY.kind}, ${FACILITY.region}. ${FACILITY.ownership}.`,
    },
    {
      id: "power",
      label: "Power",
      status: "Specified",
      detail: `${POWER.summary} Air cooling sized for ${FLEET_TOTAL} units.`,
    },
    {
      id: "fleet",
      label: "Fleet",
      status: "On order",
      detail: `${FLEET_TOTAL} × ${"NVIDIA B300"}, as ${NODE_COUNT} × ${GPUS_PER_NODE}-GPU nodes.`,
    },
    {
      id: "live",
      label: "Online",
      status: SITE.availability,
      detail: "Target availability. Reservations confirm allocation order.",
    },
  ],
  sourceId: "facility",
} as const;

/**
 * THE HONEST SECTION.
 *
 * This is the one place the site is openly, deliberately candid. It replaces
 * the social proof a competitor would put here. Do not soften it — the
 * candour is the conversion mechanism.
 */
export const CANDOUR = {
  eyebrow: "Before you reserve",
  heading: "We are new, and that is priced in.",
  paragraphs: [
    `${SITE.name} has no customers yet. No uptime history, no track record, no third party who will vouch for us. The fleet comes online in ${SITE.availability}, and until it does there is nothing we can show you that is not a specification or a photograph of a building.`,
    `So the first cohort is priced for the risk they are taking. ${FLEET.totalWord.charAt(0).toUpperCase() + FLEET.totalWord.slice(1)} GPUs is a small fleet, and the people who take a slot in it are betting on an unproven operator. The rate reflects that, and it is not a promotional rate that expires — it is what our cost structure supports because we own the building.`,
    "What is real: the hardware, the facility, the power, and the timeline. Those are the four things on this page, and each of them carries the date we last checked it. Everything a competitor would put here instead — the logos, the uptime figure, the compliance badge — we do not have, so it is not here.",
  ],
  /** The four things we can stand behind, as a checklist. */
  real: [
    { label: "The hardware", detail: `${FLEET_TOTAL} × NVIDIA B300, on order.` },
    { label: "The facility", detail: `${FACILITY.kind}, ${FACILITY.region}, owned outright.` },
    { label: "The power", detail: POWER.summary },
    { label: "The timeline", detail: `Target ${SITE.availability}.` },
  ],
  /** What we deliberately do not claim. Naming the absence defuses it. */
  notReal: [
    "Customer references",
    "Uptime history",
    "An SLA",
    "Compliance certifications",
    "Published benchmarks",
  ],
  sourceId: "facility",
} as const;
