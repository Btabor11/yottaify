/**
 * GET /admin/export → CSV of every non-spam reservation, newest first.
 *
 * Behind the same Basic auth as the rest of /admin (see proxy.ts), so
 * `curl -u user:pass https://…/admin/export > leads.csv` works from a
 * spreadsheet import or a cron job. Follow-up answers and visit context
 * ride along as columns; JSON arrays are joined with " | ".
 *
 *   ?status=open|all|<status>   default all
 *   ?spam=1                     include rows held as spam
 */

import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";
import { RESERVATION_STATUSES, type Reservation, type ReservationStatus } from "@/lib/server/schema";
import type { ListFilter } from "@/lib/server/store-shared";

export const dynamic = "force-dynamic";

const COLUMNS: Array<[string, (r: Reservation) => unknown]> = [
  ["reference", (r) => r.reference],
  ["created_at", (r) => new Date(r.createdAt).toISOString()],
  ["status", (r) => r.status],
  ["tier", (r) => r.tier],
  ["score", (r) => r.score],
  ["owner", (r) => r.owner],
  ["company", (r) => r.company],
  ["name", (r) => r.name],
  ["email", (r) => r.email],
  ["email_domain", (r) => r.emailDomain],
  ["phone", (r) => r.phone],
  ["gpu_count", (r) => r.gpuCount],
  ["start_date", (r) => r.startDate],
  ["workload", (r) => r.workload],
  ["notes", (r) => r.notes],
  ["role", (r) => r.role],
  ["team_size", (r) => r.teamSize],
  ["current_provider", (r) => r.currentProvider],
  ["current_spend", (r) => r.currentSpend],
  ["term_interest", (r) => r.termInterest],
  ["duration_months", (r) => r.durationMonths],
  ["storage_needs", (r) => r.storageNeeds],
  ["data_movement", (r) => r.dataMovement],
  ["compliance", (r) => r.compliance?.join(" | ")],
  ["decision_timeframe", (r) => r.decisionTimeframe],
  ["heard_from", (r) => r.heardFrom],
  ["dealbreakers", (r) => r.dealbreakers],
  ["followup_at", (r) => (r.followupAt ? new Date(r.followupAt).toISOString() : null)],
  ["landing_path", (r) => r.landingPath],
  ["path", (r) => r.path],
  ["referrer", (r) => r.referrer],
  ["utm_source", (r) => r.utmSource],
  ["utm_medium", (r) => r.utmMedium],
  ["utm_campaign", (r) => r.utmCampaign],
  ["utm_term", (r) => r.utmTerm],
  ["utm_content", (r) => r.utmContent],
  ["country", (r) => r.country],
  ["region", (r) => r.region],
  ["city", (r) => r.city],
  ["locale", (r) => r.locale],
  ["timezone", (r) => r.timezone],
  ["device_class", (r) => r.deviceClass],
  ["viewport", (r) => (r.viewportW ? `${r.viewportW}x${r.viewportH}` : null)],
  ["js_enabled", (r) => r.jsEnabled],
  ["time_on_page_ms", (r) => r.timeOnPageMs],
  ["form_fill_ms", (r) => r.formFillMs],
  ["validation_failures", (r) => r.validationFailures],
  ["estimator_gpus", (r) => r.estimatorGpus],
  ["estimator_hours", (r) => r.estimatorHours],
  ["sections_viewed", (r) => r.sectionsViewed?.join(" | ")],
  ["source_clicks", (r) => r.sourceClicks],
  ["receipt_sent_at", (r) => (r.receiptSentAt ? new Date(r.receiptSentAt).toISOString() : null)],
  ["notify_sent_at", (r) => (r.notifySentAt ? new Date(r.notifySentAt).toISOString() : null)],
  ["spam", (r) => r.spam],
  ["spam_reason", (r) => r.spamReason],
  ["internal_notes", (r) => r.internalNotes],
  ["id", (r) => r.id],
];

function cell(v: unknown): string {
  if (v == null) return "";
  let s = String(v);
  // Neutralise spreadsheet formula injection on free-text fields.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  const filter: ListFilter = { limit: 100_000, includeSpam: url.searchParams.get("spam") === "1" };
  filter.status =
    status === "open" || status === "all"
      ? status
      : (RESERVATION_STATUSES as readonly string[]).includes(status)
        ? (status as ReservationStatus)
        : "all";

  let rows: Reservation[];
  try {
    rows = await (await getStore()).listReservations(filter);
  } catch (e) {
    console.error("[admin/export] store read failed", e);
    return new NextResponse("Store unreachable.", { status: 503 });
  }

  const lines = [COLUMNS.map(([k]) => k).join(",")];
  for (const r of rows) lines.push(COLUMNS.map(([, f]) => cell(f(r))).join(","));

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
