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
import { PRIVACY_DRAFT } from "./data-inventory";

export const LEGAL_NOTICE = {
  marker: "Draft — pending legal review",
  explainer:
    "This page is a placeholder. It describes what we currently intend to do, has not been reviewed by counsel, and will be replaced before launch. It is published now because it needs to be reachable, not because it is finished.",
} as const;

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

/**
 * The privacy text is generated from content/data-inventory.ts, which is typed
 * against the reservation schema: a column cannot be added without being
 * described there, so this policy cannot silently fall behind what is stored.
 */
export const PRIVACY: { updated: string; sections: LegalSection[] } = PRIVACY_DRAFT;

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
