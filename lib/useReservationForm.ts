"use client";

/**
 * HEADLESS RESERVATION FORM.
 *
 * All three directions share this hook. It owns state, validation, submission,
 * and analytics; each direction owns only markup and style.
 *
 * It deliberately has no dependency on GSAP, Lenis, Motion, or WebGL. The form
 * is the point of the site, so it must never be gated on a scroll trigger or a
 * 3D context succeeding.
 */

import { useCallback, useRef, useState } from "react";
import { submitReservation } from "./submitReservation";
import { EMPTY_FORM_STATE } from "./form-state";
import type { FieldErrors, ReservationFormState, ReservationInput } from "./validation";
import { toMonth, trackReservationError, trackReservationStart, trackReservationSubmit } from "./analytics";

/**
 * The schema, fetched on demand.
 *
 * Validation cannot run before someone has typed something, so the schema does
 * not belong in the page-load payload — it is the largest dependency the form
 * has, and on a marketing page most visitors never submit. `warmValidator` is
 * called the moment the form is touched, which is many seconds of human typing
 * before the first check needs to exist, so the await below never actually
 * waits in practice.
 */
type Validator = typeof import("./validation").validateReservation;
let validatorPromise: Promise<Validator> | null = null;

function warmValidator(): Promise<Validator> {
  validatorPromise ??= import("./validation").then((m) => m.validateReservation);
  return validatorPromise;
}

export type FormStatus = "idle" | "submitting" | "success" | "error";

export interface UseReservationForm {
  values: ReservationFormState;
  errors: FieldErrors;
  status: FormStatus;
  /** Non-field-specific failure message (network / server). */
  formError: string | null;
  /** True once a submit has been attempted — gates error display so the form is calm on first sight. */
  attempted: boolean;
  setValue: (name: keyof ReservationFormState, value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (name: keyof ReservationFormState) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  reset: () => void;
  /** How many of the required fields are filled — drives progress affordances. */
  completion: { filled: number; total: number };
  /** For focus management: the first field that failed. */
  firstErrorField: keyof ReservationInput | null;
}

const REQUIRED_FIELDS: (keyof ReservationFormState)[] = [
  "company",
  "name",
  "email",
  "gpuCount",
  "startDate",
  "workload",
];

export function useReservationForm(direction: string): UseReservationForm {
  const [values, setValues] = useState<ReservationFormState>({ ...EMPTY_FORM_STATE });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const startedRef = useRef(false);

  const setValue = useCallback(
    (name: keyof ReservationFormState, value: string) => {
      if (!startedRef.current) {
        startedRef.current = true;
        trackReservationStart(direction);
        // Someone is filling the form in. Fetch the schema now, while they
        // are still typing, so it is present long before the first check.
        void warmValidator();
      }
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear the error the moment the user starts fixing it. Nagging while
      // someone types is the single most common form-UX failure.
      setErrors((prev) => (prev[name as keyof FieldErrors] ? { ...prev, [name]: undefined } : prev));
    },
    [direction],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValue(e.target.name as keyof ReservationFormState, e.target.value);
    },
    [setValue],
  );

  /** Re-validate a single field on blur, but only after a submit was attempted. */
  const handleBlur = useCallback(
    (name: keyof ReservationFormState) => {
      if (!attempted) return;
      void (async () => {
        const validate = await warmValidator();
        const result = validate(values);
        if (result.ok) {
          setErrors({});
          return;
        }
        setErrors((prev) => ({ ...prev, [name]: result.errors[name as keyof FieldErrors] }));
      })();
    },
    [attempted, values],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setAttempted(true);
      setFormError(null);
      // Held from the first keystroke, so this resolves immediately in
      // practice. Showing "submitting" while it settles keeps the button from
      // looking inert if it somehow has not landed yet.
      setStatus("submitting");

      void (async () => {
        const validate = await warmValidator();
        const validated = validate(values);
        if (!validated.ok) {
          setErrors(validated.errors);
          setStatus("idle");
          trackReservationError(direction, "validation");
          return;
        }

        setErrors({});
        const result = await submitReservation(validated.data);

        if (result.ok) {
          trackReservationSubmit({
            direction,
            gpuCount: validated.data.gpuCount,
            workload: validated.data.workload,
            startMonth: toMonth(validated.data.startDate),
            mode: result.mode,
          });
          setStatus("success");
          return;
        }

        if (result.reason === "validation") {
          setErrors(result.errors);
          setStatus("idle");
          trackReservationError(direction, "validation");
          return;
        }

        setFormError(result.message);
        setStatus("error");
        trackReservationError(direction, result.reason);
      })();
    },
    [direction, values],
  );

  const reset = useCallback(() => {
    setValues({ ...EMPTY_FORM_STATE });
    setErrors({});
    setStatus("idle");
    setFormError(null);
    setAttempted(false);
    startedRef.current = false;
  }, []);

  const filled = REQUIRED_FIELDS.filter((f) => values[f].trim().length > 0).length;

  const errorOrder: (keyof ReservationInput)[] = [
    "gpuCount",
    "startDate",
    "company",
    "name",
    "email",
    "workload",
    "notes",
  ];
  const firstErrorField = errorOrder.find((f) => errors[f]) ?? null;

  return {
    values,
    errors,
    status,
    formError,
    attempted,
    setValue,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    completion: { filled, total: REQUIRED_FIELDS.length },
    firstErrorField,
  };
}
