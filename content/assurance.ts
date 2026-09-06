/**
 * ASSURANCE — what we are working towards, and what is true today.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE:
 * Nothing in here is a certification we hold. Every framework named below is
 * named as an intention, with a status that says plainly where it stands and a
 * `held: false` that the audit checks. A compliance badge on a site with no
 * customers is the single fastest way to lose a procurement review, and this
 * page is read by exactly the people who would catch it.
 *
 * `npm run audit` will fail if any entry sets `held: true` or carries a status
 * outside `CERT_STATUS`. When a certification is genuinely awarded, it stops
 * being a roadmap entry — it gets a report, an auditor and a date, and this
 * file's shape changes to carry them.
 *
 * The second half of the file is the part that IS true today: what a
 * single-tenant building in the country gives you that a shared hall does not.
 */

import { SITE } from "@/config/site";
import { FACILITY, OWNERSHIP, SUPPORT, FLEET, FLEET_TOTAL } from "./operator";

/** The only statuses a roadmap entry may carry. None of them mean "held". */
export const CERT_STATUS = {
  scoping: "Scoping",
  "in-progress": "In progress",
  planned: "Planned",
  evaluating: "Evaluating",
} as const;

export type CertStatus = keyof typeof CERT_STATUS;

export interface Certification {
  id: string;
  /** The framework, exactly as a procurement team would write it. */
  label: string;
  /** What it actually covers, for a reader who has only heard the acronym. */
  scope: string;
  status: CertStatus;
  /** Honest horizon. Never a promise — the copy says "target", and means it. */
  target: string;
  /** Why we are pursuing it, in terms of what it changes for the customer. */
  why: string;
  /** What is genuinely in place today towards it. Empty is allowed; lying is not. */
  today: string;
  /** Structural guard. Flipping this to true fails the audit — see the header. */
  held: false;
}

export const CERTIFICATIONS: Certification[] = [
  {
    id: "soc2",
    label: "SOC 2 Type II",
    scope:
      "An independent auditor's opinion on how we actually operate security, availability and confidentiality controls over a monitored window — not a snapshot, a period of observed behaviour.",
    status: "planned",
    target: `Readiness work from ${SITE.availability}; an observation window cannot begin before the fleet is carrying real workloads.`,
    why: "It is the artefact almost every enterprise procurement team asks for first, and the one that stops a security review before it starts if you do not have it.",
    today:
      "Control design has started — access management, change control, logging and incident response are being written down as we build rather than reconstructed afterwards. There is no report and no auditor engaged yet.",
    held: false,
  },
  {
    id: "iso27001",
    label: "ISO/IEC 27001",
    scope:
      "Certification of an information security management system: the documented, audited process by which security decisions get made, reviewed and corrected.",
    status: "evaluating",
    target: "Decision after the first audit cycle, driven by what customers actually ask for.",
    why: "It travels better than SOC 2 outside North America, and some buyers will only accept it. If our first cohort needs it, it moves up.",
    today:
      "Nothing formal. We are keeping the documentation in a shape that would not have to be rewritten if we pursue it.",
    held: false,
  },
  {
    id: "nist-800-171",
    label: "NIST SP 800-171",
    scope:
      "The federal control set for protecting controlled unclassified information on non-federal systems. The baseline underneath most defence and research contracting.",
    status: "scoping",
    target: "Gap assessment during build-out; implementation driven by demand from customers who need it.",
    why: `Single-tenant American-owned hardware with no shared floor is an unusually good starting position for this control set, and ${OWNERSHIP.short.toLowerCase()} is a precondition for a lot of the work it unlocks.`,
    today:
      "We are mapping which of the 110 controls the physical and operational model already satisfies by construction. No assessment has been performed and nothing has been attested.",
    held: false,
  },
  {
    id: "cmmc",
    label: "CMMC Level 2",
    scope:
      "The Department of Defense's assessment of the NIST SP 800-171 controls, required of contractors handling controlled unclassified information.",
    status: "evaluating",
    target: "Follows the 800-171 work. Not started, and not worth starting until there is a customer who needs it.",
    why: "It is the door to defence-adjacent research workloads, which is the segment an American-owned single-tenant site is naturally suited to.",
    today: "Nothing yet. Named here so it is on the record as a direction, not discovered later as a gap.",
    held: false,
  },
  {
    id: "hipaa",
    label: "HIPAA-aligned handling",
    scope:
      "The administrative, physical and technical safeguards required of a business associate handling protected health information. Not a certification anyone issues — an obligation you meet and evidence.",
    status: "planned",
    target: "Available as a contractual undertaking, per customer, once a business associate agreement is in place.",
    why: "Medical-imaging and clinical-language work is a natural fit for a single large-memory node, and every one of those buyers needs this settled before a call two.",
    today:
      "No business associate agreement has been signed and no safeguards have been independently assessed. The single-tenant physical model removes a category of risk here, but that is a starting point and not a substitute.",
    held: false,
  },
];

export const ASSURANCE = {
  index: "04",
  eyebrow: "Assurance",
  heading: "What we are building towards, and what is true now",
  standfirst:
    "The certifications a buyer will ask for, each with its honest status. None of these are held today and none of them are presented as if they were — the point of publishing the roadmap is that you can hold us to it.",

  roadmap: {
    eyebrow: "Certification roadmap",
    heading: "Named, dated, and not yet held.",
    body:
      "A new operator with a compliance badge on its homepage is either older than it looks or lying. We have neither the operating history nor the audit window to hold any of these yet. What we can do is say which ones we are pursuing, in what order, and what is genuinely in place towards each — so a security reviewer can see the shape of the programme instead of guessing at it.",
    /** Column headers for the roadmap table. */
    columns: {
      framework: "Framework",
      status: "Status",
      target: "Target",
      today: "In place today",
    },
    /** Rendered above the table. The disclaimer that makes the table safe to publish. */
    disclaimer:
      "None of the frameworks we are pursuing have been awarded to us. No audit has been completed, no report exists, and nothing we publish about them should be read as an attestation. If your procurement process needs a certification in hand today, we are not the right provider yet, and we would rather tell you that on this page than in week six.",
    /** Where the honest answer lives if the roadmap is not enough. */
    ask: "If one of these is a hard requirement for you, say so on the reservation form. It changes our ordering.",
  },

  /**
   * The part of the security story that is true today, and is a genuine
   * structural difference rather than a paperwork one.
   */
  physical: {
    eyebrow: "Physical posture",
    heading: "One building. One tenant. Ours.",
    body: `${FACILITY.notColoDetail}`,
    points: [
      {
        label: "Single tenant",
        detail: `No shared cage, no shared floor, no neighbouring tenant's contractors in the same room as your node. The only hardware in the building is the ${FLEET_TOTAL} GPUs and what serves them.`,
      },
      {
        label: "Rural site",
        detail: `A building in the ${SITE.location.region} rather than a metro campus. Low-traffic surroundings, no published street address, and a site whose access pattern is small enough to actually notice an anomaly in.`,
      },
      {
        label: "Owned, not rented",
        detail:
          "We hold the deed, the keys and the maintenance contracts. There is no facilities company with standing access and no landlord whose staff list we do not control.",
      },
      {
        label: "Staffed by the owners",
        detail: `${SUPPORT.short}, provided by the people whose name is on the building. No third-party remote-hands vendor, no rotating contractor pool.`,
      },
    ],
    /** The counterweight. Physical control is not the same as a certified programme. */
    caveat:
      "Physical control is a real advantage and it is not a compliance programme. It removes a class of risk that a shared hall cannot; it does not substitute for the audits above, and we are not going to pretend that it does.",
  },
} as const;

/**
 * PARTNERSHIPS.
 *
 * A small American operator with spare capability and no sales team is a
 * better partner than it is a vendor. This is a genuine open invitation, not a
 * logo wall — there is nobody to put on one yet, and the copy says so.
 */
export const PARTNERS = {
  eyebrow: "Partnership",
  heading: "We would rather work with you than sell to you.",
  body: `${SITE.name} is small, American, and owns its own infrastructure, which makes it useful to a certain kind of company: one that needs compute close to its own product and does not want a hyperscaler as a dependency. We are actively looking for a handful of technical partners to build alongside rather than a list of accounts to bill.`,
  /** Who we actually want to hear from. Specific, so the wrong people self-select out. */
  looking: [
    {
      label: "Model and application teams",
      detail: "Building something that needs large-memory nodes and would rather have a phone number than a support portal. Early access, real influence over how the fleet is configured.",
    },
    {
      label: "Platform and tooling companies",
      detail: "Schedulers, orchestration, observability, inference stacks. We run bare metal by design, which makes us a clean place to certify a product against.",
    },
    {
      label: "Regional and industry integrators",
      detail: "Teams selling into American organisations that need to know where the hardware physically is and who can touch it. We are happy to be the answer to that question.",
    },
    {
      label: "Other owner-operators",
      detail: "Small independent sites in the same position. Shared spares, overflow capacity, honest notes on what suppliers and hardware actually did.",
    },
  ],
  /** What a partnership is, so nobody has to guess what we mean by the word. */
  terms:
    `What that looks like in practice is negotiable and deliberately unstructured at this stage: capacity on terms that suit the work, early access before the general cohort, joint engineering time, and a direct line to the people running the machines. There is no partner tier, no programme document and no badge — there are ${FLEET.nodesWord} nodes and a conversation.`,
  cta: "Start a partnership conversation",
  ctaNote: "Goes to an owner, not a sales inbox.",
} as const;
