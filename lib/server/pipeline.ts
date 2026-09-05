/**
 * THE PIPELINE. A validated form submission goes in; a stored, scored,
 * referenced reservation comes out, and the notifications leave.
 *
 *   receiveReservation()
 *     1. idempotency — a retried submit returns the existing row
 *     2. spam heuristics — honeypot, fill time, bot UA. Flagged, never rejected:
 *        a false positive still lands in the inbox, just marked
 *     3. score + tier
 *     4. persist + "created" event
 *     5. notify(): receipt to client, notification to sales, webhook — each
 *        recorded as an event whether it succeeded or failed
 *
 *   receiveFollowup()
 *     reference + email must match the row; only answered columns change;
 *     re-scored; "followup_received" event.
 *
 * Route handlers call these and nothing else. The admin reads the store.
 */

import { SITE } from "@/config/site";
import type { ReservationInput } from "@/lib/validation";
import { contextToColumns, followupToColumns, type ClientContext, type FollowupInput } from "./context";
import { newReference } from "./reference";
import type { RequestFacts } from "./request";
import { scoreReservation } from "./score";
import type { NewReservation, Reservation } from "./schema";
import { getStore } from "./store";
import { sendNotification, sendReceipt } from "./mail";
import { sendWebhook } from "./webhook";

export interface ReceiveOptions {
  form: ReservationInput;
  context: ClientContext;
  facts: RequestFacts;
  /** False when the form arrived as a native POST. */
  jsEnabled: boolean;
}

export interface ReceiveResult {
  reservation: Reservation;
  /** True if the idempotency key matched an existing row. */
  duplicate: boolean;
}

function spamCheck(o: ReceiveOptions): { spam: boolean; reason: string | null } {
  if (o.context.website) return { spam: true, reason: "honeypot filled" };
  if (o.facts.deviceClass === "bot") return { spam: true, reason: "bot user agent" };
  // A human cannot fill seven fields in under two seconds. A native POST has
  // no timing, so it is exempt.
  if (o.jsEnabled && typeof o.context.formFillMs === "number" && o.context.formFillMs > 0 && o.context.formFillMs < 2000)
    return { spam: true, reason: `filled in ${o.context.formFillMs}ms` };
  if (/https?:\/\/\S+/i.test(o.form.company) || /https?:\/\/\S+/i.test(o.form.name)) return { spam: true, reason: "url in name field" };
  return { spam: false, reason: null };
}

export function adminUrlFor(r: Reservation): string {
  return `${SITE.url}/admin/reservations/${r.id}`;
}

export async function receiveReservation(o: ReceiveOptions): Promise<ReceiveResult> {
  const store = await getStore();

  if (o.context.submissionId) {
    const existing = await store.getByIdempotencyKey(o.context.submissionId);
    if (existing) return { reservation: existing, duplicate: true };
  }

  const { spam, reason } = spamCheck(o);
  const base: NewReservation = {
    reference: newReference(),
    company: o.form.company,
    name: o.form.name,
    email: o.form.email,
    emailDomain: o.form.email.split("@")[1]?.toLowerCase() ?? "",
    gpuCount: o.form.gpuCount,
    startDate: o.form.startDate,
    workload: o.form.workload,
    notes: o.form.notes || null,
    ...contextToColumns(o.context),
    userAgent: o.facts.userAgent,
    ipHash: o.facts.ipHash,
    country: o.facts.country,
    region: o.facts.region,
    city: o.facts.city,
    deviceClass: o.facts.deviceClass,
    jsEnabled: o.jsEnabled,
    spam,
    spamReason: reason,
    status: spam ? "spam" : "new",
  };
  const scored = scoreReservation(base);
  base.score = scored.score;
  base.tier = scored.tier;

  // Reference collision is ~1e-9 per insert; retry once rather than trust it.
  let reservation: Reservation;
  try {
    reservation = await store.createReservation(base);
  } catch (e) {
    if (String(e).includes("reference")) reservation = await store.createReservation({ ...base, reference: newReference() });
    else throw e;
  }

  await store.addEvent({
    reservationId: reservation.id,
    type: "created",
    actor: "client",
    payload: { score: scored.score, tier: scored.tier, reasons: scored.reasons, spam, spamReason: reason },
  });
  if (spam) await store.addEvent({ reservationId: reservation.id, type: "flagged_spam", actor: "system", payload: { reason } });

  return { reservation, duplicate: false };
}

/**
 * Deliveries. Called after the response is sent (`after()` in the route) so
 * a slow mail provider never slows the form. Spam gets no receipt — sending
 * mail to a bot's address is how a form becomes a spam relay.
 */
export async function notify(r: Reservation): Promise<void> {
  const store = await getStore();
  const adminUrl = adminUrlFor(r);
  const patch: Partial<NewReservation> = {};

  if (!r.spam) {
    const receipt = await sendReceipt(r);
    await store.addEvent({
      reservationId: r.id,
      type: receipt.ok ? "receipt_sent" : "receipt_failed",
      actor: "system",
      payload: receipt.ok ? { mode: receipt.mode, id: receipt.id ?? null } : { error: receipt.error },
    });
    if (receipt.ok && receipt.mode === "sent") patch.receiptSentAt = new Date();
  }

  const note = await sendNotification(r, adminUrl);
  await store.addEvent({
    reservationId: r.id,
    type: note.ok ? "notify_sent" : "notify_failed",
    actor: "system",
    payload: note.ok ? { mode: note.mode, id: note.id ?? null } : { error: note.error },
  });
  if (note.ok && note.mode === "sent") patch.notifySentAt = new Date();

  const hook = await sendWebhook(r, adminUrl);
  if (!(hook.ok && hook.skipped)) {
    await store.addEvent({
      reservationId: r.id,
      type: hook.ok ? "webhook_sent" : "webhook_failed",
      actor: "system",
      payload: hook.ok ? null : { error: hook.error },
    });
    if (hook.ok) patch.webhookSentAt = new Date();
  }

  if (Object.keys(patch).length) await store.updateReservation(r.id, patch);
}

export type FollowupResult = { ok: true; reservation: Reservation } | { ok: false; reason: "not_found" | "mismatch" };

export async function receiveFollowup(f: FollowupInput): Promise<FollowupResult> {
  const store = await getStore();
  const r = await store.getByReference(f.reference.toUpperCase().trim());
  if (!r) return { ok: false, reason: "not_found" };
  // The reference is printed in an email; the email address is the second
  // factor. Neither is secret, but together they stop a stranger who saw a
  // reference over someone's shoulder from editing the record.
  if (r.email.toLowerCase() !== f.email.toLowerCase().trim()) return { ok: false, reason: "mismatch" };

  const cols = followupToColumns(f);
  const merged = { ...r, ...cols, followupAt: new Date() };
  const scored = scoreReservation(merged);
  const updated = await store.updateReservation(r.id, { ...cols, followupAt: merged.followupAt, score: scored.score, tier: scored.tier });
  await store.addEvent({
    reservationId: r.id,
    type: "followup_received",
    actor: "client",
    payload: { fields: Object.keys(cols), score: scored.score, tier: scored.tier },
  });
  return { ok: true, reservation: updated };
}
