/**
 * THE ONLY PLACE RESERVATION SUBMISSION HAPPENS.
 *
 * No component contains submit logic. Wiring a real backend means editing
 * this file and setting one environment variable — nothing else.
 *
 *   NEXT_PUBLIC_RESERVATION_ENDPOINT set   → validate, then POST JSON there
 *   unset                                  → validate, log, resolve success
 *                                            (so the flow is demoable now)
 *
 * A local endpoint also ships at /api/reservation, which re-validates with the
 * same zod schema. Point the env var at it to exercise the round trip.
 *
 * Input arrives already validated — `ReservationInput` is only constructible
 * by passing the schema — so there is no second client-side check here. The
 * server is the boundary that has to be suspicious, and keeping the schema out
 * of this module keeps zod off the page-load path entirely.
 */

import type { FieldErrors, ReservationInput } from "./validation";

export type SubmitResult =
  | { ok: true; mode: "posted" | "stubbed" }
  | { ok: false; reason: "validation"; errors: FieldErrors }
  | { ok: false; reason: "network" | "server"; message: string };

const ENDPOINT = process.env.NEXT_PUBLIC_RESERVATION_ENDPOINT;
const TIMEOUT_MS = 15_000;

/** The known field names, so a hostile response cannot inject error keys. */
const FIELD_NAMES = ["company", "name", "email", "gpuCount", "startDate", "workload", "notes"] as const;

/**
 * Field errors out of a 422 body, or null if the response is not shaped the
 * way we expect. A remote endpoint is not obliged to answer in our format, so
 * anything unrecognised falls through to the generic server message.
 */
async function readFieldErrors(res: Response): Promise<FieldErrors | null> {
  try {
    const body: unknown = await res.json();
    const raw = (body as { errors?: unknown } | null)?.errors;
    if (!raw || typeof raw !== "object") return null;
    const errors: FieldErrors = {};
    for (const key of FIELD_NAMES) {
      const message = (raw as Record<string, unknown>)[key];
      if (typeof message === "string" && message) errors[key] = message;
    }
    return Object.keys(errors).length ? errors : null;
  } catch {
    return null;
  }
}

export async function submitReservation(data: ReservationInput): Promise<SubmitResult> {
  const payload = {
    ...data,
    submittedAt: new Date().toISOString(),
    // Where the lead came from. Which design direction converted is worth knowing.
    path: typeof window === "undefined" ? null : window.location.pathname,
    referrer: typeof document === "undefined" ? null : document.referrer || null,
  };

  if (!ENDPOINT) {
    // Stub path: no backend yet. Resolve success so the confirmation state is
    // reachable and demoable. Replace by setting the env var — not by editing
    // a component.
    if (process.env.NODE_ENV !== "production") {
      console.info("[submitReservation] no NEXT_PUBLIC_RESERVATION_ENDPOINT set — stubbing success", payload);
    }
    await new Promise((r) => setTimeout(r, 600));
    return { ok: true, mode: "stubbed" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // The server validates independently and may know something the client
    // does not — a blocked domain, a date it will not take. Unpack its field
    // errors so they land on the fields concerned instead of becoming a
    // shrug at the bottom of the form.
    if (res.status === 422) {
      const errors = await readFieldErrors(res);
      if (errors) return { ok: false, reason: "validation", errors };
    }

    if (!res.ok) {
      return {
        ok: false,
        reason: "server",
        message: `The reservation service returned ${res.status}.`,
      };
    }

    return { ok: true, mode: "posted" };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      reason: "network",
      message: aborted
        ? "The request timed out before it completed."
        : "We could not reach the reservation service.",
    };
  } finally {
    clearTimeout(timer);
  }
}
