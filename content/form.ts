/**
 * RESERVATION FORM DEFINITION.
 *
 * The form is the point of the site. Every direction renders these exact
 * fields, labels, and options — only the visual treatment differs.
 *
 * `weight: "primary"` marks the two fields that silently tier every lead:
 * GPU count and target start date. They get prominence, not burial.
 */

import { FLEET_TOTAL, GPUS_PER_NODE } from "./operator";
import { SITE } from "@/config/site";

export type FieldWeight = "primary" | "standard";

export interface FieldOption {
  value: string;
  label: string;
  /** Extra line shown under the option where the choice has a consequence. */
  hint?: string;
}

export interface FieldDef {
  name: string;
  label: string;
  /** Placeholder / example. Never used as a substitute for a label. */
  placeholder?: string;
  /** Persistent helper text. Rendered, not a tooltip. */
  help?: string;
  type: "text" | "email" | "date" | "select" | "textarea";
  required: boolean;
  weight: FieldWeight;
  autoComplete?: string;
  options?: FieldOption[];
  /** Native input constraints, mirrored in the zod schema. */
  min?: string;
  maxLength?: number;
}

/** Earliest date we will accept without a conversation — the fleet's target month. */
export const TARGET_START_FLOOR = "2026-11-01";

/**
 * Quick-pick start dates, derived from the target availability month so they
 * follow SITE.availability rather than being retyped. Chips are an accelerator
 * only — the date input underneath remains the source of truth and works
 * without them.
 */
export const START_DATE_PRESETS: { value: string; label: string }[] = (() => {
  const [y, m] = TARGET_START_FLOOR.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Target month, +1, +2, then +4 for the "sometime next year" case.
  return [0, 1, 2, 4].map((offset) => {
    const d = new Date(Date.UTC(y, m - 1 + offset, 1));
    const yy = d.getUTCFullYear();
    const mm = d.getUTCMonth();
    return {
      value: `${yy}-${String(mm + 1).padStart(2, "0")}-01`,
      label: `${months[mm]} ${yy}`,
    };
  });
})();

export const GPU_COUNT_OPTIONS: FieldOption[] = [
  { value: "1-2", label: "1–2 GPUs", hint: "Evaluation or single-device work" },
  { value: "4", label: "4 GPUs", hint: "Half a node" },
  {
    value: "8",
    label: "8 GPUs",
    hint: `A full node — ${(288 * GPUS_PER_NODE).toLocaleString("en-US")} GB HBM3e, one NVLink domain`,
  },
  {
    value: "16",
    label: `${FLEET_TOTAL} GPUs`,
    hint: "Both nodes. The entire fleet.",
  },
  {
    value: "16+",
    label: `More than ${FLEET_TOTAL}`,
    hint: "Exceeds this fleet. Worth a conversation about timing.",
  },
];

export const WORKLOAD_OPTIONS: FieldOption[] = [
  { value: "serving", label: "Large-model serving" },
  { value: "long-context", label: "Long-context inference" },
  { value: "nvfp4-training", label: "NVFP4 training" },
  { value: "consolidation", label: "Tensor-parallel consolidation" },
  { value: "other", label: "Something else" },
];

export const FIELDS: FieldDef[] = [
  {
    name: "company",
    label: "Company",
    placeholder: "Acme Research",
    type: "text",
    required: true,
    weight: "standard",
    autoComplete: "organization",
    maxLength: 120,
  },
  {
    name: "name",
    label: "Your name",
    placeholder: "Alex Chen",
    type: "text",
    required: true,
    weight: "standard",
    autoComplete: "name",
    maxLength: 120,
  },
  {
    name: "email",
    label: "Work email",
    placeholder: "alex@acme.com",
    help: "We reply from a person, not a sequence.",
    type: "email",
    required: true,
    weight: "standard",
    autoComplete: "email",
    maxLength: 200,
  },
  {
    name: "gpuCount",
    label: "GPUs needed",
    help: `The fleet is ${FLEET_TOTAL}. Reservations are allocated in the order they arrive.`,
    type: "select",
    required: true,
    weight: "primary",
    options: GPU_COUNT_OPTIONS,
  },
  {
    name: "startDate",
    label: "Target start date",
    help: `Fleet target is ${SITE.availability}. Ask for earlier and we will tell you honestly whether we can.`,
    type: "date",
    required: true,
    weight: "primary",
  },
  {
    name: "workload",
    label: "Workload",
    type: "select",
    required: true,
    weight: "standard",
    options: WORKLOAD_OPTIONS,
  },
  {
    name: "notes",
    label: "Anything we should know",
    placeholder:
      "Model size, context length, framework, whether you need the whole node, what would make you say no.",
    help: "Optional. The last one is the most useful thing you can tell us.",
    type: "textarea",
    required: false,
    weight: "standard",
    maxLength: 2000,
  },
];

export const PRIMARY_FIELDS = FIELDS.filter((f) => f.weight === "primary");
export const STANDARD_FIELDS = FIELDS.filter((f) => f.weight === "standard");

export function field(name: string): FieldDef {
  const f = FIELDS.find((x) => x.name === name);
  if (!f) throw new Error(`Unknown field: ${name}`);
  return f;
}

/** Copy around the form. No fabricated queue position — there is no backend to know one. */
export const FORM_COPY = {
  eyebrow: "Reserve capacity",
  heading: "Hold a slot",
  standfirst: `${FLEET_TOTAL} GPUs across ${FLEET_TOTAL / GPUS_PER_NODE} nodes, online ${SITE.availability}. Reservations are how allocation order gets decided, and take-or-pay terms get set on a call — not in this form.`,
  submit: "Submit reservation",
  submitting: "Submitting…",
  /** What actually happens next, stated accurately. */
  whatHappensNext: [
    "You get an email confirming we received this.",
    "We confirm your position in the allocation order by email.",
    "If the shape fits, we set up a call to scope term and price.",
  ],
  success: {
    heading: "Reservation received",
    body: `We have your request. We will confirm your position in the allocation order by email — ${SITE.name} does not assign one automatically, a person reads these.`,
    detail: "If you do not hear from us within two business days, reply to the confirmation email and it will reach a human.",
    again: "Submit another reservation",
  },
  error: {
    heading: "That did not go through",
    body: "Nothing was lost — your answers are still here. Try again, or email us directly and we will take it from there.",
    retry: "Try again",
  },
  /** Reassurance placed next to the submit button, where the hesitation happens. */
  microcopy: {
    commitment: "No payment and no commitment at this step. This reserves your place in the queue, nothing more.",
    privacy: "We use this to size the fleet and to reply. We do not sell it and we do not run it through an ad network.",
  },
  requiredNote: "Required",
  optionalNote: "Optional",
} as const;
