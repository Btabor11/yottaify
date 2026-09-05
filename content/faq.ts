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
import { FLEET_TOTAL, GPUS_PER_NODE, NODE_COUNT, CONTRACT, ACCESS, FACILITY } from "./operator";
import { NODE } from "./hardware";
import { RATE, PRICE_POSITION } from "./pricing";

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
    a: `Yes. The form offers 1–2, 4, ${GPUS_PER_NODE} and ${FLEET_TOTAL}. A partial node shares the box with another tenant's partial allocation; a full node is ${NODE.hbmGbFormatted} GB in one NVLink domain, entirely yours.`,
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
    id: "rate-fixed",
    group: "commercial",
    q: `Is ${RATE.display} fixed?`,
    a: `${RATE.full} is the on-demand rate for the initial cohort and is not a promotional rate that expires — it is what the cost structure supports because the building is owned. Committed terms price below it. Any rate you are offered is fixed for your term once it is in the contract.`,
  },
  {
    id: "take-or-pay",
    group: "commercial",
    q: `What does "${CONTRACT.model.toLowerCase()}" mean?`,
    a: CONTRACT.body,
  },
  {
    id: "cheaper-elsewhere",
    group: "commercial",
    q: "I have seen cheaper B300 listings. Why would I pay this?",
    a: `${PRICE_POSITION.body} The argument is availability with a date on it, and every rate on the pricing page carries its source and the date we checked it so you can verify that yourself.`,
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
    a: `${SITE.name} is an owner-operator: the people who bought the building, specified the power and ordered the hardware are the people you will speak to. ${FACILITY.kind.toLowerCase()} in the ${SITE.location.region}, ${FACILITY.ownership.toLowerCase()}. There is no sales team between you and the operator.`,
  },
  {
    id: "where-is-it",
    group: "operator",
    q: "Where is the hardware, and can I see it?",
    a: `${SITE.location.detail}. The street address is not published. If you need to see the facility before signing, ask on the call.`,
  },
  {
    id: "security",
    group: "operator",
    q: "What about security and compliance?",
    a: "Honestly: we hold no third-party certifications and no SOC 2 report today, and we say so on the page rather than implying otherwise. What you get is a privately owned facility with no other tenants in the building, root on your own node, and a written contract that can carry the data-handling terms your organisation requires.",
  },
  {
    id: "why-trust",
    group: "operator",
    q: "You have no customers. Why should I be the first?",
    a: `Because the first cohort is priced for exactly that risk, and because everything we can show you — hardware, facility, power, timeline — carries a source and a date. We do not have the logos or the uptime history. We have ${NODE_COUNT} nodes, a building, and a rate that does not depend on someone else's capital. Whether that is enough is your call, and we would rather you make it with the full picture.`,
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
