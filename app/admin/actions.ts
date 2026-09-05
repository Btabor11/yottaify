"use server";

/**
 * Desk actions. Each one is a plain form post (works with JavaScript off),
 * writes through the store, appends a timeline event, and returns to the
 * detail page with a flag so the outcome is shown.
 *
 * The proxy has already authenticated the request — these run only behind
 * Basic auth. They still re-validate every input.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/server/store";
import { RESERVATION_STATUSES, type ReservationStatus } from "@/lib/server/schema";
import { isReference } from "@/lib/server/reference";
import { nextStage } from "./derive";

function str(fd: FormData, k: string, max = 4000): string {
  return String(fd.get(k) ?? "")
    .trim()
    .slice(0, max);
}

/** redirect() throws, so it must never run inside a try that reports failure. */
async function load(reference: string) {
  const store = await getStore();
  const r = await store.getByReference(reference).catch(() => null);
  if (!r) redirect("/admin");
  return r;
}

function done(reference: string, ok: boolean): never {
  revalidatePath(`/admin/r/${reference}`);
  revalidatePath("/admin");
  redirect(`/admin/r/${reference}?${ok ? "saved" : "failed"}=1`);
}

export async function setStatus(fd: FormData) {
  const reference = str(fd, "reference", 16).toUpperCase();
  const status = str(fd, "status", 32);
  if (!isReference(reference) || !(RESERVATION_STATUSES as readonly string[]).includes(status)) {
    redirect("/admin");
  }
  const r = await load(reference);
  const store = await getStore();
  let ok = true;
  try {
    if (r.status !== status) {
      await store.updateReservation(r.id, {
        status: status as ReservationStatus,
        spam: status === "spam" ? true : r.spam && status !== "spam" ? false : r.spam,
        spamReason: status === "spam" ? "admin" : r.spamReason,
      });
      await store.addEvent({
        reservationId: r.id,
        type: status === "spam" ? "flagged_spam" : "status_changed",
        actor: "admin",
        payload: { from: r.status, to: status },
      });
    }
  } catch (e) {
    console.error("[admin] setStatus failed", e);
    ok = false;
  }
  done(reference, ok);
}

/**
 * Move a lead one stage down the pipeline.
 *
 * The desk's most-used action, so it is one button rather than a select and
 * a save. It re-reads the current status on the server and derives the next
 * one from STAGE_ORDER instead of trusting a stage posted by the client, so a
 * stale page cannot skip a stage or move a row backwards.
 */
export async function advanceStatus(fd: FormData) {
  const reference = str(fd, "reference", 16).toUpperCase();
  if (!isReference(reference)) redirect("/admin");
  const r = await load(reference);
  const to = nextStage(r.status);
  if (!to || r.spam) redirect(`/admin/r/${reference}`);
  const store = await getStore();
  let ok = true;
  try {
    await store.updateReservation(r.id, { status: to });
    await store.addEvent({
      reservationId: r.id,
      type: "status_changed",
      actor: "admin",
      payload: { from: r.status, to },
    });
  } catch (e) {
    console.error("[admin] advanceStatus failed", e);
    ok = false;
  }
  done(reference, ok);
}

export async function setOwner(fd: FormData) {
  const reference = str(fd, "reference", 16).toUpperCase();
  const owner = str(fd, "owner", 120);
  if (!isReference(reference)) redirect("/admin");
  const r = await load(reference);
  const store = await getStore();
  let ok = true;
  try {
    if ((r.owner ?? "") !== owner) {
      await store.updateReservation(r.id, { owner: owner || null });
      await store.addEvent({
        reservationId: r.id,
        type: "owner_changed",
        actor: "admin",
        payload: { from: r.owner, to: owner || null },
      });
    }
  } catch (e) {
    console.error("[admin] setOwner failed", e);
    ok = false;
  }
  done(reference, ok);
}

export async function addNote(fd: FormData) {
  const reference = str(fd, "reference", 16).toUpperCase();
  const note = str(fd, "note");
  if (!isReference(reference) || !note) redirect(`/admin/r/${reference}`);
  const r = await load(reference);
  const store = await getStore();
  let ok = true;
  try {
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    const merged = [r.internalNotes, `[${stamp}] ${note}`].filter(Boolean).join("\n");
    await store.updateReservation(r.id, { internalNotes: merged });
    await store.addEvent({ reservationId: r.id, type: "note_added", actor: "admin", payload: { note } });
  } catch (e) {
    console.error("[admin] addNote failed", e);
    ok = false;
  }
  done(reference, ok);
}

/**
 * Erase a record on a client's request. Requires the reference typed again as
 * confirmation, so it cannot be hit by a stray click. Nothing is kept: no
 * tombstone, no hash — the policy says "delete", so this deletes.
 */
export async function eraseReservation(fd: FormData) {
  const reference = str(fd, "reference", 16).toUpperCase();
  const confirm = str(fd, "confirm", 16).toUpperCase();
  if (!isReference(reference)) redirect("/admin");
  if (confirm !== reference) redirect(`/admin/r/${reference}?failed=1`);
  const r = await load(reference);
  const store = await getStore();
  let ok = true;
  try {
    await store.deleteReservation(r.id);
  } catch (e) {
    console.error("[admin] eraseReservation failed", e);
    ok = false;
  }
  if (!ok) done(reference, false);
  revalidatePath("/admin");
  redirect("/admin?erased=1");
}

export async function toggleSpam(fd: FormData) {
  const reference = str(fd, "reference", 16).toUpperCase();
  if (!isReference(reference)) redirect("/admin");
  const r = await load(reference);
  const store = await getStore();
  let ok = true;
  try {
    const spam = !r.spam;
    await store.updateReservation(r.id, {
      spam,
      spamReason: spam ? "admin" : null,
      status: spam ? "spam" : r.status === "spam" ? "new" : r.status,
    });
    await store.addEvent({
      reservationId: r.id,
      type: spam ? "flagged_spam" : "status_changed",
      actor: "admin",
      payload: spam ? { reason: "admin" } : { from: "spam", to: "new" },
    });
  } catch (e) {
    console.error("[admin] toggleSpam failed", e);
    ok = false;
  }
  done(reference, ok);
}
