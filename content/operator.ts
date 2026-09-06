/**
 * VERIFIED OPERATOR FACTS.
 *
 * Fleet size is exactly forty-eight. Not "up to", not "over", not "100+".
 *
 * Every count on the site derives from the three constants below, so the fleet
 * can grow again by editing this block alone. Nothing downstream may hardcode
 * a device count, a node count or the word for either.
 */

import { SITE } from "@/config/site";

export const FLEET_TOTAL = 48;
export const GPUS_PER_NODE = 8;
export const NODE_COUNT = FLEET_TOTAL / GPUS_PER_NODE; // 6

/**
 * Spelled out, because "forty-eight GPUs" reads as a deliberate number and
 * "48 GPUs" mid-sentence reads as a placeholder someone forgot to fill in.
 * Covers the range a single building can plausibly hold; anything past it
 * falls back to digits rather than inventing a word.
 */
const WORDS: Record<number, string> = {
  1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six",
  7: "seven", 8: "eight", 9: "nine", 10: "ten", 12: "twelve", 16: "sixteen",
  24: "twenty-four", 32: "thirty-two", 40: "forty", 48: "forty-eight",
  64: "sixty-four", 80: "eighty", 96: "ninety-six",
};
export const numberWord = (n: number): string => WORDS[n] ?? String(n);

export const FLEET = {
  total: FLEET_TOTAL,
  totalWord: numberWord(FLEET_TOTAL),
  nodes: NODE_COUNT,
  nodesWord: numberWord(NODE_COUNT),
  gpusPerNode: GPUS_PER_NODE,
  cooling: "Air-cooled",
  /**
   * Node count is spelled out here on purpose: "as 6 8-GPU nodes" puts two
   * digits against each other and reads as a typo.
   */
  shape: `${FLEET_TOTAL} B300s, configured as ${numberWord(NODE_COUNT)} ${GPUS_PER_NODE}-GPU nodes.`,
  sourceId: "facility",
} as const;

/**
 * ELECTRICAL — /facility ONLY, and currently without figures.
 *
 * Two things are true at once here.
 *
 * First, the electrical detail does not belong on the landing page. A buyer
 * deciding whether to put a model on our hardware does not open with a
 * question about service voltage, and leading with one makes the company read
 * as an electrical contractor. Whatever we publish lives on the facility sheet
 * for the reader who wants it — one click away, not in the first screen.
 *
 * Second, THERE ARE NO NUMBERS IN HERE ON PURPOSE. The load, current and
 * service figures the site used to carry were calculated for a two-node build.
 * The fleet is six nodes now, which invalidates all of them: a service sized
 * for two nodes cannot carry six, so scaling the old numbers by three would be
 * arithmetic dressed up as a fact. They come back when the six-node service is
 * specified and metered, with a date on them like everything else.
 *
 * `npm run audit` fails if a figure reappears here without the sheet being
 * rewritten to source it. `content/facility.ts` is the copy around this.
 */
export const POWER = {
  /** What the landing page and the schedule may say. No figures. */
  plain: "Service and air cooling sized for the whole fleet, with headroom.",
  /** The longer form, for the facility sheet's own body copy. */
  summary:
    "The service and the air handling are specified for every node running at once, with headroom over that — sized for the building rather than for today's fleet.",
  /**
   * Said out loud rather than left as a gap. An operator who quietly drops a
   * number they used to publish looks worse than one who says why.
   */
  pending:
    `Load, current and service figures are not published here yet. The ones this page used to carry were calculated for a smaller build, and re-stating them for ${numberWord(NODE_COUNT)} nodes would be an estimate wearing a measurement's clothes. They go back up when the service is final and metered, dated like every other figure on this site. If you need them before then, ask and we will tell you where the specification stands.`,
  sourceId: "facility",
} as const;

export const FACILITY = {
  kind: "Privately owned warehouse",
  region: SITE.location.region,
  ownership: "Owned outright",
  /** The structural cost advantage. Stated plainly because it is the real reason. */
  advantage: "No colocation fees",
  advantageDetail:
    "The building is ours. There is no landlord taking a margin on every kilowatt and no rack rent priced off someone else's capital stack. That is the whole reason the quote is what it is — not a promotional price, not venture subsidy, just a cost structure most new entrants do not have.",
  /**
   * The distinction that matters to a buyer, said before they assume otherwise.
   * Most "GPU clouds" are a contract for space inside somebody else's hall.
   */
  notColo: "Not a cage in someone else's hall",
  notColoDetail:
    "This is not a suite inside a colocation campus and it is not rented capacity in a hyperscale hall. It is a single building, in the country, with our hardware in it and nobody else's. There is no shared floor, no other tenant's technicians walking past your node, and no third-party facilities company between us and the machines. When something needs doing, the people who own the building do it.",
  sourceId: "facility",
} as const;

/**
 * WHO OWNS IT AND WHERE.
 *
 * Stated because it is increasingly the second question after price: whose
 * jurisdiction is the hardware in, and who can touch it. Everything here is a
 * fact about us, not a certification — the certifications are in
 * `content/assurance.ts` and every one of them is marked as not yet held.
 */
export const OWNERSHIP = {
  eyebrow: "Ownership and control",
  headline: "American owned, American operated.",
  short: "American owned and operated",
  body: `A privately held American company, hardware on American soil, and staff who are the owners of both. The building, the machines and the people are all in the ${SITE.location.region}. Nothing about your workload is administered from outside the country, and no part of the operation is subcontracted to a facilities company or an overseas support desk.`,
  facts: [
    { label: "Company", detail: "Privately held, American-owned. No outside operator and no foreign parent." },
    { label: "Hardware", detail: `Owned, not leased. Physically in the ${SITE.location.region}.` },
    { label: "Staff", detail: "The owner-operators. There is no outsourced night shift and no offshore support tier." },
    { label: "Jurisdiction", detail: `${SITE.location.country}, single tenant, single building.` },
  ],
  sourceId: "facility",
} as const;

/**
 * SUPPORT.
 *
 * Deliberately worded as an operating model rather than a service level. We
 * are not publishing response-time commitments we have no history to back —
 * those go in the contract. What is true today is that the people who own the
 * building answer the phone and can physically reach the hardware.
 */
export const SUPPORT = {
  eyebrow: "Support",
  headline: "Someone on site, whenever it matters.",
  short: "24/7 on-site technical support",
  body:
    "The hardware is in a building we own and we are the people who run it. Call and you get an owner, not a ticket queue and not a first-line script. If the fix needs hands on the machine — reseat a card, swap a drive, power-cycle a node, put eyes on a rack at three in the morning — someone goes and does it. That is the whole advantage of a small fleet in a building you control.",
  channels: [
    { label: "Phone", detail: "A number that reaches an operator, around the clock, for anything running." },
    { label: "On site", detail: "Physical access to the hardware at any hour. We hold the keys, so nobody has to be scheduled in." },
    { label: "Hands on", detail: "Reseats, swaps, reboots, cabling, console access. Whatever the machine needs, done by the people who built it." },
    { label: "Named contact", detail: "The person who scoped your job is the person you call. Not a rota, not a shared inbox." },
  ],
  /** The line that keeps this honest. Response commitments belong in writing. */
  caveat:
    "What we will not do is publish a response-time guarantee before we have a single month of operating history behind it. Remedies and response expectations are written into your contract, where they are enforceable, and we will talk them through on the call rather than printing a number here that sounds good.",
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
    `No autoscaling. The fleet is ${numberWord(FLEET_TOTAL)} GPUs and the number is knowable.`,
  ],
  sourceId: "facility",
} as const;

export const CONTRACT = {
  model: "Take-or-pay",
  headline: "Take-or-pay. Fixed capacity at a fixed price.",
  /** The window we will write. Shown in fact cells, the reserve sidebar, /pricing. */
  termYears: "1–5 years",
  body:
    "Fixed capacity at a fixed price for one to five years. You commit to the slot, we commit to the rate, and neither side re-prices when the market moves. Committed terms price below the on-demand quote — how far below depends on term length and volume, which is what the call is for.",
  /**
   * The dedicated lease-inquiry section. An inquiry, not a published ladder:
   * there is still no per-year figure on this site.
   */
  inquiry: {
    eyebrow: "Leases",
    heading: "We are taking inquiries on 1–5 year leases.",
    body:
      "On-demand is quoted on the call. A lease is the other conversation: a named term, a named rate, and capacity that does not get re-priced when the market moves. One year is a lease. Five years is a lease. Anything in between is a lease. We quote it against the job rather than against a published ladder, because a two-GPU evaluation and four nodes for five years are not the same purchase.",
    bands: [
      {
        label: "1 year",
        detail: "A committed year. For a workload that is real and a horizon that is not yet.",
      },
      {
        label: "2–3 years",
        detail: "The term most buyers arrive with. Capacity and rate locked for the window you can actually plan in.",
      },
      {
        label: "4–5 years",
        detail: "The longest we will write today. For a team that wants the hardware in the building to stay theirs.",
      },
    ],
    open: "Inquiries are open. A reservation is how one reaches us — put the term in the notes, or we will ask on the call.",
    caveat:
      "An inquiry is not a signed term. Rate, start date and remedies are agreed on the call and written into the contract. Nothing on this page is a published lease rate.",
    cta: "Inquire about a lease",
    /** Compact card on the pricing sheet, above the full section. */
    cardEyebrow: "Committed terms",
    cardHeadline: "1–5 year leases",
    cardBody:
      "We are taking inquiries across that window. Longer terms price further below the on-demand quote. The figure is set against the job, on the call.",
  },
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
      label: "Service",
      status: "Specified",
      detail: `${POWER.plain} Detail on the facility sheet.`,
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
    `${SITE.name} has no customers yet. No operating history, no track record, no third party who will vouch for us. The fleet comes online in ${SITE.availability}, and until it does there is nothing we can show you that is not a specification or a photograph of a building.`,
    `So the first cohort is priced for the risk they are taking. ${FLEET.totalWord.charAt(0).toUpperCase() + FLEET.totalWord.slice(1)} GPUs is a small fleet, and the people who take a slot in it are betting on an unproven operator. The quote reflects that, and it is not a promotional rate that expires — it is what our cost structure supports because we own the building.`,
    "What is real: the hardware, the building, the people who answer the phone, and the timeline. Those are the four things on this page, and each of them carries the date we last checked it. Everything a competitor would put here instead — the logos, the availability figure, the compliance badge — we do not have, so it is not here.",
  ],
  /** The four things we can stand behind, as a checklist. */
  real: [
    { label: "The hardware", detail: `${FLEET_TOTAL} × NVIDIA B300, on order.` },
    { label: "The building", detail: `${FACILITY.kind}, ${FACILITY.region}, owned outright. ${FACILITY.notColo}.` },
    { label: "The people", detail: `${OWNERSHIP.short}. ${SUPPORT.short}, by the owners.` },
    { label: "The timeline", detail: `Target ${SITE.availability}.` },
  ],
  /** What we deliberately do not claim. Naming the absence defuses it. */
  notReal: [
    "Customer references",
    "Operating history",
    "An SLA",
    "Certifications in hand",
    "Published benchmarks",
  ],
  sourceId: "facility",
} as const;
