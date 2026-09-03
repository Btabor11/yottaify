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
 */

import { validateReservation, type FieldErrors, type ReservationInput } from "./validation";

export type SubmitResult =
  | { ok: true; mode: "posted" | "stubbed" }
  | { ok: false; reason: "validation"; errors: FieldErrors }
  | { ok: false; reason: "network" | "server"; message: string };

const ENDPOINT = process.env.NEXT_PUBLIC_RESERVATION_ENDPOINT;
const TIMEOUT_MS = 15_000;

export async function submitReservation(data: ReservationInput): Promise<SubmitResult> {
  const validated = validateReservation(data);
  if (!validated.ok) {
    return { ok: false, reason: "validation", errors: validated.errors };
  }

  const payload = {
    ...validated.data,
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
