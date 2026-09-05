/**
 * Generic outbound webhook. RESERVATION_WEBHOOK_URL receives a JSON POST per
 * new reservation. The body carries a Slack-compatible `text` so a Slack or
 * Discord incoming webhook renders it as-is, and the full row under
 * `reservation` so Zapier / Make / n8n / a CRM can map any column.
 */

import { GPU_COUNT_OPTIONS, WORKLOAD_OPTIONS } from "@/content/form";
import type { Reservation } from "./schema";

export type WebhookResult = { ok: true; skipped?: boolean } | { ok: false; error: string };

export async function sendWebhook(r: Reservation, adminUrl: string): Promise<WebhookResult> {
  const url = process.env.RESERVATION_WEBHOOK_URL;
  if (!url) return { ok: true, skipped: true };
  const gpu = GPU_COUNT_OPTIONS.find((o) => o.value === r.gpuCount)?.label ?? r.gpuCount;
  const wl = WORKLOAD_OPTIONS.find((o) => o.value === r.workload)?.label ?? r.workload;
  const text = [
    `New reservation ${r.reference} — tier ${r.tier} (${r.score})`,
    `${r.company} · ${r.name} <${r.email}>`,
    `${gpu} · from ${r.startDate} · ${wl}`,
    r.notes ? `“${r.notes.slice(0, 280)}${r.notes.length > 280 ? "…" : ""}”` : null,
    adminUrl,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, event: "reservation.created", reservation: r, adminUrl }),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, error: `Webhook returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
