/**
 * The blank reservation form.
 *
 * Separate from lib/validation.ts for one reason: this is the only value the
 * form needs in order to render, while the schema next door is the form's
 * largest dependency and is not needed until someone has typed something.
 * Keeping them apart lets the schema load on demand.
 *
 * Every field starts as an empty string rather than undefined, so each input
 * is controlled from the first render and React never warns about a field
 * switching between controlled and uncontrolled.
 */

import type { ReservationInput } from "./validation";

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
