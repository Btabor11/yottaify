/**
 * LEGAL STUB CONTENT.
 *
 * These routes must exist and be live: LinkedIn lead-gen ads reject
 * destinations without a reachable privacy policy. The text has NOT been
 * through legal review, and every page says so prominently.
 *
 * Replace `sections` wholesale with counsel's copy. Do not edit piecemeal.
 */

import { SITE } from "@/config/site";
import { FIELDS } from "./form";

const collectedFields = FIELDS.map((f) => f.label.toLowerCase()).join(", ");

export const LEGAL_NOTICE = {
  marker: "Draft — pending legal review",
  explainer:
    "This page is a placeholder. It describes what we currently intend to do, has not been reviewed by counsel, and will be replaced before launch. It is published now because it needs to be reachable, not because it is finished.",
} as const;

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export const PRIVACY: { updated: string; sections: LegalSection[] } = {
  updated: "2026-09-02",
  sections: [
    {
      heading: "What we collect",
      paragraphs: [
        `Only what you type into the reservation form: ${collectedFields}. Nothing else is requested and nothing is inferred from a third-party data broker.`,
        "If analytics is enabled, we record page views and a single event when a reservation is submitted successfully. It is off unless an environment variable turns it on.",
      ],
    },
    {
      heading: "Why we collect it",
      paragraphs: [
        "To size the fleet against real demand, to decide allocation order, and to reply to you. GPU count and target start date are what let us tell whether we can serve you at all.",
      ],
    },
    {
      heading: "What we do not do",
      paragraphs: [
        "We do not sell your information. We do not share it with advertising networks. We do not add you to a marketing sequence you did not ask for.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "Retention has not been set. It will be stated here before launch.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        `Email ${SITE.email.general} to see what we hold on you, to correct it, or to have it deleted.`,
      ],
    },
  ],
};

export const TERMS: { updated: string; sections: LegalSection[] } = {
  updated: "2026-09-02",
  sections: [
    {
      heading: "This site is informational",
      paragraphs: [
        `Everything on ${SITE.url.replace(/^https?:\/\//, "")} describes hardware and pricing as of the dates shown. It is not an offer, and submitting the reservation form does not create a contract or reserve capacity as a legal matter.`,
      ],
    },
    {
      heading: "Pricing",
      paragraphs: [
        "Rates shown are current as of the date printed beside them and may change. Third-party rates are the providers' published figures, read on the dates cited, and we do not control or warrant them.",
      ],
    },
    {
      heading: "Availability",
      paragraphs: [
        `${SITE.availability} is a target, not a commitment. There is no service level agreement in place and none is offered on this site.`,
      ],
    },
    {
      heading: "Specifications",
      paragraphs: [
        "Hardware specifications are NVIDIA's published figures for the part. We have not benchmarked our own fleet and publish no performance claims.",
      ],
    },
    {
      heading: "Contract terms",
      paragraphs: [
        "Any actual agreement for capacity will be a separate written contract. Its terms govern, not this page.",
      ],
    },
  ],
};
