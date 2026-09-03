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
import {
  EMPTY_FORM_STATE,
  validateReservation,
  type FieldErrors,
  type ReservationFormState,
  type ReservationInput,
} from "./validation";
import { toMonth, trackReservationError, trackReservationStart, trackReservationSubmit } from "./analytics";

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
      const result = validateReservation(values);
      if (result.ok) {
        setErrors({});
        return;
      }
      setErrors((prev) => ({ ...prev, [name]: result.errors[name as keyof FieldErrors] }));
    },
    [attempted, values],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setAttempted(true);
      setFormError(null);

      const validated = validateReservation(values);
      if (!validated.ok) {
        setErrors(validated.errors);
        setStatus("idle");
        trackReservationError(direction, "validation");
        return;
      }

      setErrors({});
      setStatus("submitting");

      void (async () => {
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
