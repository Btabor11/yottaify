/**
 * THE FOLLOW-UP — optional questions asked AFTER the reservation is received.
 *
 * The reservation form stays short so it converts. This is where the rich
 * data comes from: a second, entirely optional step on the success screen,
 * when the visitor has already committed and has a reference code in hand.
 * Every answer is optional. Every answer shortens the call.
 *
 * Field names here are column names in the reservations table. Add a field
 * here, add the column in lib/server/schema.ts, and the API accepts it.
 */

import type { FieldOption } from "./form";

export interface FollowupField {
  name: FollowupFieldName;
  label: string;
  help?: string;
  type: "text" | "tel" | "select" | "multiselect" | "textarea";
  options?: FieldOption[];
  maxLength?: number;
  autoComplete?: string;
  placeholder?: string;
}

export type FollowupFieldName =
  | "role"
  | "phone"
  | "teamSize"
  | "currentProvider"
  | "currentSpend"
  | "termInterest"
  | "durationMonths"
  | "storageNeeds"
  | "dataMovement"
  | "compliance"
  | "decisionTimeframe"
  | "heardFrom"
  | "dealbreakers";

export const FOLLOWUP_FIELDS: FollowupField[] = [
  {
    name: "role",
    label: "Your role",
    type: "text",
    placeholder: "Head of ML infrastructure",
    maxLength: 120,
    autoComplete: "organization-title",
  },
  {
    name: "phone",
    label: "Phone, if you would rather we call",
    type: "tel",
    placeholder: "+1 555 010 0000",
    maxLength: 40,
    autoComplete: "tel",
  },
  {
    name: "teamSize",
    label: "People who will use the capacity",
    type: "select",
    options: [
      { value: "1", label: "Just me" },
      { value: "2-5", label: "2–5" },
      { value: "6-20", label: "6–20" },
      { value: "20+", label: "More than 20" },
    ],
  },
  {
    name: "currentProvider",
    label: "Where you run GPU workloads today",
    type: "select",
    options: [
      { value: "hyperscaler", label: "A hyperscaler (AWS, GCP, Azure, Oracle)" },
      { value: "neocloud", label: "A neocloud (CoreWeave, Lambda, Nebius, Runpod…)" },
      { value: "on-prem", label: "Our own hardware" },
      { value: "mixed", label: "A mix" },
      { value: "none", label: "Nowhere yet" },
    ],
  },
  {
    name: "currentSpend",
    label: "Current monthly GPU spend",
    help: "A band is enough. It tells us whether this fleet is a fraction of your footprint or most of it.",
    type: "select",
    options: [
      { value: "<10k", label: "Under $10k" },
      { value: "10k-50k", label: "$10k–50k" },
      { value: "50k-250k", label: "$50k–250k" },
      { value: "250k+", label: "Over $250k" },
      { value: "undisclosed", label: "Would rather not say" },
    ],
  },
  {
    name: "termInterest",
    label: "Term you are considering",
    type: "select",
    options: [
      { value: "on-demand", label: "On-demand, month to month" },
      { value: "1y", label: "Committed, around a year" },
      { value: "2-3y", label: "Committed, two to three years" },
      { value: "4-5y", label: "Committed, four to five years" },
      { value: "unsure", label: "Not sure yet — want to talk it through" },
    ],
  },
  {
    name: "durationMonths",
    label: "How long you expect to run",
    type: "select",
    options: [
      { value: "<1", label: "Under a month" },
      { value: "1-3", label: "1–3 months" },
      { value: "3-12", label: "3–12 months" },
      { value: "12+", label: "A year or more" },
    ],
  },
  {
    name: "storageNeeds",
    label: "Working data set size",
    type: "select",
    options: [
      { value: "<1tb", label: "Under 1 TB" },
      { value: "1-10tb", label: "1–10 TB" },
      { value: "10-100tb", label: "10–100 TB" },
      { value: "100tb+", label: "Over 100 TB" },
    ],
  },
  {
    name: "dataMovement",
    label: "How often data moves in or out",
    type: "select",
    options: [
      { value: "once", label: "Once, at the start" },
      { value: "daily", label: "Daily" },
      { value: "continuous", label: "Continuously" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
  {
    name: "compliance",
    label: "Requirements your organisation will ask us about",
    help: "Pick all that apply. We will not have every certification — knowing now means we can say so on the call.",
    type: "multiselect",
    options: [
      { value: "soc2", label: "SOC 2 report" },
      { value: "iso27001", label: "ISO 27001" },
      { value: "hipaa", label: "HIPAA" },
      { value: "gdpr", label: "GDPR / data residency" },
      { value: "vendor-forms", label: "Vendor security questionnaire" },
      { value: "insurance", label: "Insurance certificates" },
      { value: "none", label: "None of these" },
    ],
  },
  {
    name: "decisionTimeframe",
    label: "When you expect to decide",
    type: "select",
    options: [
      { value: "2w", label: "Within two weeks" },
      { value: "1m", label: "Within a month" },
      { value: "1q", label: "This quarter" },
      { value: "exploring", label: "Just exploring" },
    ],
  },
  {
    name: "heardFrom",
    label: "How you found us",
    type: "select",
    options: [
      { value: "search", label: "Search" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "x", label: "X / Twitter" },
      { value: "referral", label: "Someone told me" },
      { value: "aggregator", label: "A GPU price aggregator" },
      { value: "other", label: "Somewhere else" },
    ],
  },
  {
    name: "dealbreakers",
    label: "What would make you say no",
    help: "Still the most useful thing you can tell us.",
    type: "textarea",
    maxLength: 1000,
    placeholder: "No SOC 2 by Q2, no 100 Gb ingress, no spare node…",
  },
];

export function followupField(name: FollowupFieldName): FollowupField {
  const f = FOLLOWUP_FIELDS.find((x) => x.name === name);
  if (!f) throw new Error(`Unknown follow-up field: ${name}`);
  return f;
}

export const FOLLOWUP_COPY = {
  eyebrow: "While you are here",
  heading: "A few optional questions",
  body: "Every one of these is optional and every one you answer makes the scoping call shorter. Skip any you like — your reservation is already in.",
  submit: "Send answers",
  submitting: "Sending…",
  skip: "Skip for now",
  saved: {
    heading: "Added to your reservation",
    body: "Thank you. These answers are attached to your reference and the person who reads it will see them.",
  },
  error: {
    heading: "That did not save",
    body: "Your reservation is safe — only these extra answers did not go through. Try again, or mention them on the call.",
    retry: "Try again",
  },
  referenceLabel: "Reference",
  referenceHelp: "Keep this. It is how you refer to this request in every later conversation.",
} as const;
