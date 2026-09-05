/**
 * THE ONLY PLACE RESERVATION SUBMISSION HAPPENS.
 *
 * No component contains submit logic. The default endpoint is the built-in
 * /api/reservation, which stores the lead, scores it, emails a receipt and
 * notifies the sales inbox (see lib/server/pipeline.ts and DATA.md).
 *
 *   NEXT_PUBLIC_RESERVATION_ENDPOINT unset → POST JSON to /api/reservation
 *   set                                    → POST JSON there instead (a CRM
 *                                            webhook, a form service). The
 *                                            payload shape is identical.
 *
 * Alongside the seven validated fields we send `context`: the session
 * journey captured in lib/journey.ts. It is what makes a lead rich rather
 * than a name and an email. The server treats every context field as
 * optional, so nothing in it can cost us a submission.
 *
 * Input arrives already validated — `ReservationInput` is only constructible
 * by passing the schema — so there is no second client-side check here.
 */

import type { FieldErrors, ReservationInput } from "./validation";
import { newSubmissionId, submissionContext } from "./journey";

export type SubmitResult =
  | { ok: true; mode: "posted" | "stubbed"; reference: string | null }
  | { ok: false; reason: "validation"; errors: FieldErrors }
  | { ok: false; reason: "network" | "server"; message: string };

const ENDPOINT = process.env.NEXT_PUBLIC_RESERVATION_ENDPOINT || "/api/reservation";
const TIMEOUT_MS = 15_000;

/** The known field names, so a hostile response cannot inject error keys. */
const FIELD_NAMES = ["company", "name", "email", "gpuCount", "startDate", "workload", "notes"] as const;

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

/**
 * One idempotency key per submit attempt *sequence*: a retry after a network
 * error reuses it, so the server cannot store the lead twice. A fresh form
 * (after reset) gets a fresh key.
 */
let currentSubmissionId: string | null = null;
export function resetSubmissionId(): void {
  currentSubmissionId = null;
}

export async function submitReservation(data: ReservationInput): Promise<SubmitResult> {
  currentSubmissionId ??= newSubmissionId();
  const payload = {
    ...data,
    submittedAt: new Date().toISOString(),
    context: submissionContext(currentSubmissionId),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (res.status === 422) {
      const errors = await readFieldErrors(res);
      if (errors) return { ok: false, reason: "validation", errors };
    }

    if (res.status === 429) {
      return { ok: false, reason: "server", message: "Too many submissions from this connection. Wait a minute and try again." };
    }

    if (!res.ok) {
      let message = `The reservation service returned ${res.status}.`;
      try {
        const body = (await res.json()) as { message?: unknown };
        if (typeof body.message === "string") message = body.message;
      } catch {
        /* keep the status message */
      }
      return { ok: false, reason: "server", message };
    }

    let reference: string | null = null;
    try {
      const body = (await res.json()) as { reference?: unknown };
      if (typeof body.reference === "string") reference = body.reference;
    } catch {
      // An external endpoint need not answer in our shape.
    }
    // Success: the key has done its job. The next submission is a new lead.
    currentSubmissionId = null;
    return { ok: true, mode: "posted", reference };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    return {
      ok: false,
      reason: "network",
      message: aborted ? "The request timed out before it completed." : "We could not reach the reservation service.",
    };
  } finally {
    clearTimeout(timer);
  }
}
