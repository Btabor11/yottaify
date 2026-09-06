/**
 * WHO WE ARE.
 *
 * The operator, in the first person. Principles are rendered always. People
 * are rendered ONLY if `TEAM` has entries — an empty array hides the block,
 * the same rule `SITE.social` follows. Do not invent names, titles or
 * photographs to fill it; add real ones here when they are ready to publish.
 */

import { SITE } from "@/config/site";
import { FACILITY, FLEET, OWNERSHIP, SUPPORT } from "./operator";

export interface TeamMember {
  name: string;
  role: string;
  /** One or two sentences. What they did before, and what they own here. */
  bio: string;
  /** Optional public profile. Empty = not rendered. */
  linkedin?: string;
}

/** Empty until real people are ready to be named. See LAUNCH.md. */
export const TEAM: TeamMember[] = [];

export const ABOUT = {
  eyebrow: "Who we are",
  heading: "Owner-operators, not a platform.",
  body: `${SITE.name} is the people who bought the building and ordered the hardware. ${FACILITY.kind} in the ${SITE.location.region}, ${FACILITY.ownership.toLowerCase()}, ${OWNERSHIP.short.toLowerCase()}. When you reserve, the person who reads the request is the person who will scope your job and the person who will pick up when something breaks.`,
  principles: [
    {
      label: "Small, and knowable",
      body: `${FLEET.total} GPUs. Not "up to", not "100+". Every figure on this site is exact or carries a tilde, and every one carries its source.`,
    },
    {
      label: "No landlord in the price",
      body: "What we can quote is what an owned building supports. It is not a promotional rate, and it does not depend on anyone's fundraising.",
    },
    {
      label: "Candour as a policy",
      body: "We say what we do not have — customers, operating history, certifications in hand — on the page, so it is never a surprise in a procurement review.",
    },
    {
      label: "A person, every step",
      body: `Receipt is automatic. Everything after it — position, call, term sheet, onboarding, ${SUPPORT.short.toLowerCase()} — is a named person, not a queue.`,
    },
  ],
  teamHeading: "The people",
} as const;

/**
 * Brand aside: why the company is named what it is. Rendered as a subsection
 * of the operator sheet. The exponent is stored as parts so the page can
 * render 10<sup>24</sup> rather than a unicode superscript.
 */
export type NameOriginParagraph =
  | string
  | {
      before: string;
      base: string;
      exp: string;
      after: string;
    };

export const NAME_ORIGIN = {
  eyebrow: "The name",
  heading: `Why ${SITE.name}`,
  paragraphs: [
    {
      before: "A yotta is ",
      base: "10",
      exp: "24",
      after: " — a septillion. It is a unit of enormous scale: the point where a number stops being something you can picture and starts being something you trust the notation for.",
    },
    "That is roughly the feeling of standing in front of a rack of B300s.",
    "We named the company after a unit of scale because that is the product. Compute should not be a ceiling you plan around. It should be a number you turn up when the work demands it, and turn back down when it does not.",
  ] satisfies NameOriginParagraph[],
};
