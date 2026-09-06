/**
 * THE PROCESS — what happens before, during and after a reservation.
 *
 * This is the "every step of the way" content. It is written so a buyer can
 * read it once and know exactly what they are getting into, what to have
 * ready, and what we will do with what they send. Nothing here promises a
 * date, a spare, a bandwidth figure or a support hour that has not been
 * settled — where a detail is agreed on the call, the copy says so.
 */

import { SITE } from "@/config/site";
import { FLEET_TOTAL, GPUS_PER_NODE, CONTRACT, ACCESS } from "./operator";
import { NODE } from "./hardware";
import { QUOTE } from "./pricing";

export interface ProcessStep {
  id: string;
  title: string;
  body: string;
  /** Who acts. "you" | "us" | "both". Drives the marker in the timeline. */
  actor: "you" | "us" | "both";
  /** Optional timing note, only where one can honestly be stated. */
  when?: string;
}

export interface ProcessPhase {
  id: "before" | "reserve" | "after";
  index: string;
  eyebrow: string;
  heading: string;
  standfirst: string;
  steps: ProcessStep[];
}

/** What to have to hand before you fill the form in. Each is a question we will ask. */
export const BEFORE_CHECKLIST: { label: string; detail: string }[] = [
  {
    label: "Workload shape",
    detail:
      "Model size, precision, context length, batch. Whether it is serving, training, or both. This is what decides if one node's memory domain fits it.",
  },
  {
    label: "GPU count, and whether it must be one NVLink domain",
    detail: `A full node is ${GPUS_PER_NODE} GPUs and ${NODE.hbmGbFormatted} GB in one domain. Fewer is fine; more than ${FLEET_TOTAL} is a conversation about timing.`,
  },
  {
    label: "Start date and duration",
    detail: `The fleet targets ${SITE.availability}. Tell us when you want to start and how long you expect to run — it is what sets your place in the order.`,
  },
  {
    label: "Your stack",
    detail:
      "Framework, container or bare-metal preference, driver and CUDA expectations, and whether you already run NVFP4. We match the box to it at onboarding.",
  },
  {
    label: "Data and storage",
    detail:
      "How much data moves in and out, how often, and where it lives today. There is no object storage product here — bring your own or use local NVMe.",
  },
  {
    label: "Security and procurement requirements",
    detail:
      "Anything your organisation will ask us for before signing: vendor forms, insurance, data handling terms, and which certifications are hard requirements rather than preferences. Better to know on the first call than in week six — and it changes the order we work through the roadmap in.",
  },
  {
    label: "Term appetite and who signs",
    detail: `On-demand, or ${CONTRACT.model.toLowerCase()} for ${CONTRACT.termYears} at a lower rate. The quote is set against these two answers, so having them ready is what turns the first call into a number. Knowing who has budget authority shortens everything.`,
  },
  {
    label: "What would make you say no",
    detail: "The most useful thing you can tell us. If there is a dealbreaker, we would rather hear it before we hold a slot for you.",
  },
];

export const PROCESS: ProcessPhase[] = [
  {
    id: "before",
    index: "A",
    eyebrow: "Before you reserve",
    heading: "Know what you are asking for.",
    standfirst:
      "The form takes two minutes. The call goes better when you already know the answers to the eight things we will ask.",
    steps: [
      {
        id: "read",
        title: "Read the paperwork above",
        body: "Pricing, hardware, operator. Every figure carries its source. If a number does not hold up, tell us — that is what the dates are for.",
        actor: "you",
      },
      {
        id: "size",
        title: "Size the job against one node",
        body: `${NODE.hbmGbFormatted} GB in one coherent domain is the argument. Decide whether your model, KV cache and activations fit in it, or whether the job needs more than one node.`,
        actor: "you",
      },
      {
        id: "estimate",
        title: "Run the arithmetic",
        body: "The estimator on the pricing page is rate × GPUs × hours against every published rate we could find. It prices the alternatives, not us — ours is the one line that is set on the call.",
        actor: "you",
      },
    ],
  },
  {
    id: "reserve",
    index: "B",
    eyebrow: "The reservation",
    heading: "Hold a slot. Nothing else happens yet.",
    standfirst: `No payment, no commitment, no card. A reservation is a place in the allocation order for ${FLEET_TOTAL} GPUs, held by a person who read what you wrote.`,
    steps: [
      {
        id: "submit",
        title: "Submit the form",
        body: "GPU count and start date are what tier the request. The rest is who to reply to and what you are running.",
        actor: "you",
        when: "Two minutes",
      },
      {
        id: "receipt",
        title: "Receipt, with a reference",
        body: "You get an email confirming we have it, with a reference code. Keep it — it is how you refer to this request in every later conversation.",
        actor: "us",
        when: "Immediately",
      },
      {
        id: "followup",
        title: "Optional: tell us more",
        body: "After submitting you can answer a few optional questions — team size, current provider, term interest, storage needs. Every one you answer makes the call shorter.",
        actor: "you",
        when: "Optional",
      },
      {
        id: "position",
        title: "Position confirmed by a person",
        body: "We read the request and confirm your place in the allocation order by email. Not an auto-reply — a person, with a name.",
        actor: "us",
        when: "Within two business days",
      },
    ],
  },
  {
    id: "after",
    index: "C",
    eyebrow: "After you reserve",
    heading: "From a slot to a running job.",
    standfirst: `The steps between a reservation and root on the box, in order. Term and price are set on the call. Access details are set at onboarding. Nothing is set by this page.`,
    steps: [
      {
        id: "call",
        title: "Scoping call",
        body: "We walk your workload against the hardware, agree GPU count, start, duration and term, and name anything that will not work. If it does not fit, we say so on this call.",
        actor: "both",
      },
      {
        id: "terms",
        title: "Term sheet",
        body: `A one-page summary of what was agreed: capacity, rate, term, start. This is where the number appears — quoted against your job, not read off a page. ${QUOTE.position}, and ${CONTRACT.model.toLowerCase()} terms price below that again.`,
        actor: "us",
      },
      {
        id: "contract",
        title: "Contract",
        body: "The written agreement governs, not this site. Your procurement questions from the checklist above get answered here, in writing.",
        actor: "both",
      },
      {
        id: "onboarding",
        title: "Onboarding",
        body: `${ACCESS.headline} We collect SSH keys and user accounts, agree the driver and CUDA versions, set up scheduler queues, and confirm how your data gets in and out.`,
        actor: "both",
      },
      {
        id: "live",
        title: "Go live",
        body: `Your slot is energised in the order reservations arrived, from ${SITE.availability}. You get root, the driver stack, and a queue. Then it is your job, on your hardware.`,
        actor: "us",
        when: SITE.availability,
      },
      {
        id: "running",
        title: "Running",
        body: "A named contact rather than a ticket queue. Invoices monthly against the agreed term. Capacity changes go through the same person who scoped you.",
        actor: "both",
      },
    ],
  },
];

/** What is set on the call rather than here. Naming it prevents it becoming a surprise. */
export const SET_ON_THE_CALL: string[] = [
  "Committed rate for your term and volume",
  "Exact start date within the target month",
  "Driver, CUDA and scheduler versions",
  "Data ingress and egress arrangements",
  "Spare and remedy terms if hardware fails",
  "Support channel and response expectations",
];

export const PROCESS_COPY = {
  eyebrow: "Process",
  heading: "Every step, in order",
  standfirst:
    "What to have ready, what the reservation does, and what happens between a slot and a running job. Where a detail is set on the call rather than here, it says so.",
  checklistHeading: "Have these to hand",
  checklistNote: "These are the questions we will ask. You do not need every answer to reserve — but the call is shorter when you have them.",
  setOnCallHeading: "Set on the call, not on this page",
  actorLabel: { you: "You", us: "Us", both: "Together" },
} as const;
