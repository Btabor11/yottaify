/**
 * FREQUENTLY ASKED QUESTIONS.
 *
 * Every answer is either a fact already stated elsewhere in `content/`, or an
 * honest "set in the contract / on the call". No answer invents a spare
 * policy, a support hour, a bandwidth figure or a certification.
 *
 * Also rendered as FAQPage JSON-LD, so the answers are the ones search engines
 * and assistants quote. Keep them short and literal.
 */

import { SITE } from "@/config/site";
import { FLEET_TOTAL, GPUS_PER_NODE, NODE_COUNT, CONTRACT, ACCESS, FACILITY, SUPPORT, OWNERSHIP } from "./operator";
import { NODE } from "./hardware";
import { QUOTE, PRICE_POSITION, BENCHMARK } from "./pricing";
import { ASSURANCE } from "./assurance";

export interface Faq {
  id: string;
  /** Grouping for the rendered list. */
  group: "reserving" | "hardware" | "commercial" | "operator";
  q: string;
  a: string;
}

export const FAQ_GROUPS: Record<Faq["group"], string> = {
  reserving: "Reserving",
  hardware: "Hardware and access",
  commercial: "Price and terms",
  operator: "The operator",
};

export const FAQS: Faq[] = [
  // --- reserving ---------------------------------------------------------
  {
    id: "what-is-a-reservation",
    group: "reserving",
    q: "What exactly am I reserving?",
    a: `A place in the allocation order for ${FLEET_TOTAL} NVIDIA B300 GPUs coming online ${SITE.availability}. It is not a contract and it does not hold capacity as a legal matter — it is how we decide who we call first, and in what order slots are filled.`,
  },
  {
    id: "cost-to-reserve",
    group: "reserving",
    q: "Does reserving cost anything or commit me to anything?",
    a: "No. No payment, no card, no commitment. Term and price are agreed on a call and set in a written contract. You can walk away at any point before that contract is signed.",
  },
  {
    id: "allocation-order",
    group: "reserving",
    q: "How is allocation order decided?",
    a: "By arrival. Reservations are read in the order they come in. GPU count and start date decide which slots a request can fit, but not its place in the queue. We do not publish queue positions on this site because there is no automatic system assigning them — a person confirms yours by email.",
  },
  {
    id: "when-hear-back",
    group: "reserving",
    q: "When will I hear back?",
    a: "You get an automatic receipt with a reference code immediately. A person confirms your position in the allocation order within two business days. If you have not heard by then, reply to the receipt and it reaches a human.",
  },
  {
    id: "start-earlier",
    group: "reserving",
    q: `Can I start before ${SITE.availability}?`,
    a: `${SITE.availability} is the target for the fleet to be online. Ask for an earlier date on the form and we will tell you honestly whether it is possible. We will not confirm a date we cannot evidence.`,
  },
  {
    id: "fewer-than-node",
    group: "reserving",
    q: `Can I rent fewer than ${GPUS_PER_NODE} GPUs?`,
    a: `Yes. The form runs from 1–2 GPUs up to all ${FLEET_TOTAL}. A partial node shares the box with another tenant's partial allocation; a full node is ${GPUS_PER_NODE} devices and ${NODE.hbmGbFormatted} GB in one NVLink domain, entirely yours.`,
  },

  // --- hardware ------------------------------------------------------------
  {
    id: "what-access",
    group: "hardware",
    q: "What do I actually get access to?",
    a: `${ACCESS.headline} Root on the box, the NVIDIA driver stack, and a scheduler to queue against. No control plane between you and the device. Driver, CUDA and scheduler versions are agreed at onboarding, not imposed.`,
  },
  {
    id: "not-included",
    group: "hardware",
    q: "What is not included?",
    a: ACCESS.notIncluded.join(" "),
  },
  {
    id: "data-in-out",
    group: "hardware",
    q: "How do I get my data in and out?",
    a: "Bring your own storage or use the node's local NVMe. Ingress and egress arrangements — bandwidth, method, any transfer help — are agreed on the scoping call, because they depend on what you are moving.",
  },
  {
    id: "hardware-failure",
    group: "hardware",
    q: "What happens if hardware fails?",
    a: `Remedies are set in the contract, not on this page. ${FLEET_TOTAL} GPUs is a small fleet and we will tell you plainly on the call what spares we hold and what the recovery path is, so you can decide whether it is enough for your job.`,
  },
  {
    id: "benchmarks",
    group: "hardware",
    q: "Do you have benchmarks?",
    a: "Not yet. The fleet is not online, so every figure on this site is NVIDIA's published specification for the part, not a measurement of ours. When we have numbers from our own hardware we will publish the methodology alongside them.",
  },

  // --- commercial ----------------------------------------------------------
  {
    id: "no-published-rate",
    group: "commercial",
    q: "Why is there no price on this site?",
    a: QUOTE.why,
  },
  {
    id: "rate-fixed",
    group: "commercial",
    q: "Once I have a rate, can it move?",
    a: "No. Whatever you are quoted is fixed for your term once it is in the contract, and it is not a promotional rate that expires afterwards — it is what an owned building and a small fleet actually support. Committed terms price below the on-demand quote, and how far below depends on term and volume.",
  },
  {
    id: "take-or-pay",
    group: "commercial",
    q: `What does "${CONTRACT.model.toLowerCase()}" mean?`,
    a: CONTRACT.body,
  },
  {
    id: "leases",
    group: "commercial",
    q: "Do you offer multi-year leases?",
    a: `${CONTRACT.inquiry.heading} ${CONTRACT.inquiry.body} ${CONTRACT.inquiry.caveat}`,
  },
  {
    id: "cheaper-elsewhere",
    group: "commercial",
    q: "I have seen cheaper B300 listings. Why would I talk to you?",
    a: `${PRICE_POSITION.body} ${QUOTE.position} — ${BENCHMARK.display} on the day we checked — and the argument on top of that is availability with a date on it. Every rate on the pricing page carries its source and the date we read it, so none of this has to be taken on trust.`,
  },
  {
    id: "billing",
    group: "commercial",
    q: "How is billing handled?",
    a: "Set in the contract. On-demand is billed per GPU-hour at the agreed rate; committed terms are invoiced monthly against the term. There are no colocation, power or rack fees passed through, because there is no landlord.",
  },

  // --- operator -----------------------------------------------------------
  {
    id: "who-are-you",
    group: "operator",
    q: "Who is behind this?",
    a: `${SITE.name} is an owner-operator: the people who bought the building and ordered the hardware are the people you will speak to. ${FACILITY.kind.toLowerCase()} in the ${SITE.location.region}, ${FACILITY.ownership.toLowerCase()}, ${OWNERSHIP.short.toLowerCase()}. There is no sales team between you and the operator.`,
  },
  {
    id: "colo",
    group: "operator",
    q: "Is this space inside a bigger data centre?",
    a: `No. ${FACILITY.notColoDetail}`,
  },
  {
    id: "support",
    group: "operator",
    q: "What happens at 3am when something breaks?",
    a: `${SUPPORT.body} ${SUPPORT.caveat}`,
  },
  {
    id: "where-is-it",
    group: "operator",
    q: "Where is the hardware, and can I see it?",
    a: `${SITE.location.detail}. The street address is not published. If you need to see the facility before signing, ask on the call. The building, the power and the physical posture are written up in full on the facility page.`,
  },
  {
    id: "security",
    group: "operator",
    q: "What about security and compliance?",
    a: `${ASSURANCE.roadmap.disclaimer} What you do get today is a single-tenant building with no other organisation's hardware or staff in it, root on your own node, and a written contract that can carry the data-handling terms your organisation requires. The frameworks we are pursuing, and where each one stands, are published on the assurance section rather than summarised into a badge.`,
  },
  {
    id: "partner",
    group: "operator",
    q: "Do you work with partners rather than customers?",
    a: "Yes, and we would rather. We are looking for a small number of technical partners — model and application teams, platform and tooling companies, integrators selling to American organisations, and other independent site owners. What that means in practice is negotiable at this stage: early access, capacity on terms that suit the work, joint engineering time, and a direct line to the people running the machines. Say so on the reservation form or email us.",
  },
  {
    id: "why-trust",
    group: "operator",
    q: "You have no customers. Why should I be the first?",
    a: `Because the first cohort is priced for exactly that risk, and because everything we can show you — hardware, building, people, timeline — carries a source and a date. We do not have the logos or the operating history. We have ${NODE_COUNT} nodes, a building nobody else is in, an owner who answers the phone, and a cost structure that does not depend on someone else's capital. Whether that is enough is your call, and we would rather you make it with the full picture.`,
  },
];

export const FAQ_COPY = {
  eyebrow: "Questions",
  heading: "Asked before reserving",
  standfirst:
    "The questions a technical buyer asks, answered with what we know and marked where the answer is set on the call instead. If yours is not here, email us and it will be added.",
  askHeading: "Not answered?",
  askBody: `Email ${SITE.email.general}. A person reads it.`,
} as const;
