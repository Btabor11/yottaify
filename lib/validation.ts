/**
 * RESERVATION VALIDATION.
 *
 * One zod schema, shared by the client form, `submitReservation`, and the
 * server route at /api/reservation. There is no second definition of "valid"
 * anywhere in the codebase.
 */

import { z } from "zod";
import { GPU_COUNT_OPTIONS, WORKLOAD_OPTIONS } from "@/content/form";

const gpuCountValues = GPU_COUNT_OPTIONS.map((o) => o.value) as [string, ...string[]];
const workloadValues = WORKLOAD_OPTIONS.map((o) => o.value) as [string, ...string[]];

/** Today at local midnight, so "today" is always an acceptable start date. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const reservationSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company is required.")
    .max(120, "Keep this under 120 characters."),

  name: z
    .string()
    .trim()
    .min(1, "Your name is required.")
    .max(120, "Keep this under 120 characters."),

  email: z
    .string()
    .trim()
    .min(1, "Work email is required.")
    .max(200, "Keep this under 200 characters.")
    .pipe(z.email({ message: "That does not look like an email address." }))
    .refine((v) => !FREE_EMAIL_DOMAINS.has(v.split("@")[1]?.toLowerCase() ?? ""), {
      message: "Please use your work email — it helps us route this to the right person.",
    }),

  gpuCount: z.enum(gpuCountValues, { message: "Tell us how many GPUs you need." }),

  startDate: z
    .string()
    .min(1, "A target start date is required.")
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Use a valid date." })
    .refine(
      (v) => {
        const d = new Date(`${v}T00:00:00`);
        return !Number.isNaN(d.getTime()) && d >= startOfToday();
      },
      { message: "Pick a date that has not already passed." },
    ),

  workload: z.enum(workloadValues, { message: "Pick the closest workload." }),

  notes: z.string().trim().max(2000, "Keep notes under 2000 characters.").optional().or(z.literal("")),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

/** Field-keyed errors, which is the shape the form components consume. */
export type FieldErrors = Partial<Record<keyof ReservationInput, string>>;

export function validateReservation(
  data: unknown,
): { ok: true; data: ReservationInput } | { ok: false; errors: FieldErrors } {
  const result = reservationSchema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ReservationInput | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/**
 * Free-mail domains are rejected on the work-email field. Not a spam measure —
 * a lead-quality one. Kept deliberately short so it never blocks a real buyer
 * at a company that happens to use an unusual host.
 */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "gmx.com",
  "yandex.com",
  "zoho.com",
]);

/**
 * The form's own state shape: every value a string, including the selects.
 *
 * Selects deliberately start EMPTY rather than pre-filled with the first
 * option. GPU count and start date tier every lead, and a default would mean
 * every untouched form silently reports "1–2 GPUs".
 */
export type ReservationFormState = Record<keyof ReservationInput, string>;

export const EMPTY_FORM_STATE: ReservationFormState = {
  company: "",
  name: "",
  email: "",
  gpuCount: "",
  startDate: "",
  workload: "",
  notes: "",
};
