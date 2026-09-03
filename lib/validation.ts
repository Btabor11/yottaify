/**
 * RESERVATION VALIDATION.
 *
 * One schema, shared by the client form, `submitReservation`, and the server
 * route at /api/reservation. There is no second definition of "valid" anywhere
 * in the codebase, and there must not be — a client rule that drifts from the
 * server rule is a lead silently lost.
 *
 * `zod/mini` rather than `zod`: identical validation, functional rather than
 * method-chained, and it tree-shakes. The full builder ships ~370 KB
 * uncompressed to every page on the site, including the two that have no form
 * on them, which is more than the rest of the page's JavaScript put together.
 */

import * as z from "zod/mini";
import { GPU_COUNT_OPTIONS, WORKLOAD_OPTIONS } from "@/content/form";

const gpuCountValues = GPU_COUNT_OPTIONS.map((o) => o.value) as [string, ...string[]];
const workloadValues = WORKLOAD_OPTIONS.map((o) => o.value) as [string, ...string[]];

/** Today at local midnight, so "today" is always an acceptable start date. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * `YYYY-MM-DD` to a local Date, or null if that day does not exist.
 *
 * Parsed by hand rather than through `new Date(string)`, which both applies
 * UTC to bare dates and rolls impossible ones forward without complaint.
 */
function toLocalDate(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const [y, mo, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(y, mo - 1, day);
  const survived = d.getFullYear() === y && d.getMonth() === mo - 1 && d.getDate() === day;
  return survived ? d : null;
}

/**
 * A trimmed, required, length-capped string — every text field on the form.
 *
 * A missing key is treated as an empty one on purpose. The form always sends
 * a string, but the API route accepts arbitrary JSON, and "Company is
 * required." is a better answer to a missing field than "Invalid input".
 */
const text = (label: string, max: number) =>
  z.pipe(
    z.pipe(
      z.unknown(),
      z.transform((v) => (typeof v === "string" ? v.trim() : v == null ? "" : v)),
    ),
    z.string({ error: label }).check(z.minLength(1, label), z.maxLength(max, `Keep this under ${max} characters.`)),
  );

export const reservationSchema = z.object({
  company: text("Company is required.", 120),

  name: text("Your name is required.", 120),

  email: z.pipe(
    text("Work email is required.", 200),
    z.string().check(
      z.email("That does not look like an email address."),
      z.refine((v) => !FREE_EMAIL_DOMAINS.has(v.split("@")[1]?.toLowerCase() ?? ""), {
        error: "Please use your work email — it helps us route this to the right person.",
      }),
    ),
  ),

  gpuCount: z.enum(gpuCountValues, { error: "Tell us how many GPUs you need." }),

  startDate: z.pipe(
    z.pipe(
      z.unknown(),
      z.transform((v) => (typeof v === "string" ? v : v == null ? "" : v)),
    ),
    z.string({ error: "A target start date is required." }).check(
    z.minLength(1, "A target start date is required."),
    // Shape, then reality. `new Date("2027-02-31")` is not an error in
    // JavaScript — it quietly becomes 3 March — so the only way to reject an
    // impossible date is to check that it survives the round trip.
    z.refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), { error: "Use a valid date." }),
    z.refine((v) => toLocalDate(v) !== null, { error: "That date does not exist." }),
    z.refine(
      (v) => {
        const d = toLocalDate(v);
        return d !== null && d >= startOfToday();
      },
      { error: "Pick a date that has not already passed." },
    ),
    ),
  ),

  workload: z.enum(workloadValues, { error: "Pick the closest workload." }),

  notes: z.optional(
    z.pipe(
      z.pipe(z.string(), z.transform((v) => v.trim())),
      z.string().check(z.maxLength(2000, "Keep notes under 2000 characters.")),
    ),
  ),
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
// The blank form and its type live in ./form-state, which carries no schema
// dependency, and are re-exported here so callers still have one import to
// reach for. A type-only re-export costs nothing at runtime.
export type { ReservationFormState } from "./form-state";
