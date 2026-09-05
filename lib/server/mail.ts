/**
 * Outbound email. Two messages per reservation: a receipt to the client, a
 * notification to the sales inbox.
 *
 *   RESEND_API_KEY set   → sent through Resend
 *   unset                → printed to the server log, marked as "logged"
 *
 * Copy lives in content/email.ts. This file only lays it out. Plain text is
 * the primary body; the HTML twin is built from the same strings so they can
 * never say different things.
 *
 * The HTML carries literal colours because a mail client cannot read CSS
 * variables. They mirror the `.d3-paper` tokens in app/(site)/d3.css and are
 * the only place outside palette.ts a hex value is allowed to live.
 */

import { SITE } from "@/config/site";
import { GPU_COUNT_OPTIONS, WORKLOAD_OPTIONS } from "@/content/form";
import { NOTIFY_EMAIL, RECEIPT_EMAIL } from "@/content/email";
import type { Reservation } from "./schema";

export type MailResult = { ok: true; mode: "sent" | "logged"; id?: string } | { ok: false; error: string };

const FROM = process.env.MAIL_FROM ?? `${SITE.name} <${SITE.email.sales}>`;

function label(options: { value: string; label: string }[], v: string) {
  return options.find((o) => o.value === v)?.label ?? v;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function summaryRows(r: Reservation): [string, string][] {
  return [
    ["Company", r.company],
    ["Name", r.name],
    ["Email", r.email],
    ["GPUs", label(GPU_COUNT_OPTIONS, r.gpuCount)],
    ["Start", r.startDate],
    ["Workload", label(WORKLOAD_OPTIONS, r.workload)],
    ...(r.notes ? ([["Notes", r.notes]] as [string, string][]) : []),
  ];
}

export function receiptMessage(r: Reservation) {
  const rows = summaryRows(r);
  const text = [
    RECEIPT_EMAIL.greeting(r.name),
    "",
    RECEIPT_EMAIL.intro,
    "",
    `${RECEIPT_EMAIL.referenceLabel}: ${r.reference}`,
    "",
    RECEIPT_EMAIL.summaryHeading,
    ...rows.map(([k, v]) => `  ${k}: ${v}`),
    "",
    RECEIPT_EMAIL.nextHeading,
    ...RECEIPT_EMAIL.next.map((s, i) => `  ${i + 1}. ${s}`),
    "",
    RECEIPT_EMAIL.prepareHeading,
    ...RECEIPT_EMAIL.prepare.map((s) => `  - ${s}`),
    "",
    RECEIPT_EMAIL.waitLine,
    "",
    RECEIPT_EMAIL.signoff,
    "",
    RECEIPT_EMAIL.footer,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f1ea;color:#171310;font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fbf9f4;border:1px solid #d9d1c2;padding:28px">
<p style="margin:0 0 16px">${esc(RECEIPT_EMAIL.greeting(r.name))}</p>
<p style="margin:0 0 16px">${esc(RECEIPT_EMAIL.intro)}</p>
<p style="margin:0 0 20px;font-family:ui-monospace,Menlo,monospace;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#655c52">${esc(RECEIPT_EMAIL.referenceLabel)}<br><span style="font-size:22px;letter-spacing:.02em;color:#9c3a0c">${esc(r.reference)}</span></p>
<h3 style="margin:24px 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#655c52">${esc(RECEIPT_EMAIL.summaryHeading)}</h3>
<table style="border-collapse:collapse;width:100%">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #e6dfd0;color:#655c52;width:30%;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;border-bottom:1px solid #e6dfd0;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>
<h3 style="margin:24px 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#655c52">${esc(RECEIPT_EMAIL.nextHeading)}</h3>
<ol style="margin:0;padding-left:20px">${RECEIPT_EMAIL.next.map((s) => `<li style="margin:4px 0">${esc(s)}</li>`).join("")}</ol>
<h3 style="margin:24px 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#655c52">${esc(RECEIPT_EMAIL.prepareHeading)}</h3>
<ul style="margin:0;padding-left:20px">${RECEIPT_EMAIL.prepare.map((s) => `<li style="margin:4px 0">${esc(s)}</li>`).join("")}</ul>
<p style="margin:24px 0 0">${esc(RECEIPT_EMAIL.waitLine)}</p>
<p style="margin:16px 0 0">${esc(RECEIPT_EMAIL.signoff)}</p>
<p style="margin:28px 0 0;font-size:12px;color:#655c52">${esc(RECEIPT_EMAIL.footer)}</p>
</div></body></html>`;

  return { subject: RECEIPT_EMAIL.subject(r.reference), text, html };
}

export function notifyMessage(r: Reservation, adminUrl: string) {
  const all: [string, string][] = [
    ["Reference", r.reference],
    ["Tier / score", `${r.tier} / ${r.score}`],
    ...summaryRows(r),
    ["Start month", r.startDate.slice(0, 7)],
    ["Source", r.utmSource ?? r.referrer ?? "direct"],
    ["Landing", r.landingPath ?? "—"],
    ["Device", [r.deviceClass, r.viewportW && r.viewportH ? `${r.viewportW}×${r.viewportH}` : null].filter(Boolean).join(" · ") || "—"],
    ["Location", [r.city, r.region, r.country].filter(Boolean).join(", ") || "—"],
    ["Time on page", r.timeOnPageMs ? `${Math.round(r.timeOnPageMs / 1000)}s` : "—"],
    ["Fill time", r.formFillMs ? `${Math.round(r.formFillMs / 1000)}s` : "—"],
    ["Estimator", r.estimatorGpus ? `${r.estimatorGpus} GPUs × ${r.estimatorHours} h` : "not used"],
    ["JS", r.jsEnabled ? "yes" : "no — native POST"],
    ["Spam flag", r.spam ? `YES — ${r.spamReason}` : "no"],
  ];
  const text = [NOTIFY_EMAIL.heading, "", ...all.map(([k, v]) => `${k}: ${v}`), "", `${NOTIFY_EMAIL.adminLink}: ${adminUrl}`].join("\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;font:14px/1.5 ui-monospace,Menlo,monospace;color:#171310;background:#f4f1ea">
<h2 style="margin:0 0 16px;font-size:14px;letter-spacing:.12em;text-transform:uppercase">${esc(NOTIFY_EMAIL.heading)}</h2>
<table style="border-collapse:collapse">${all
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#655c52;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>
<p style="margin:20px 0 0"><a href="${esc(adminUrl)}" style="color:#9c3a0c">${esc(NOTIFY_EMAIL.adminLink)}</a></p>
</body></html>`;
  return { subject: NOTIFY_EMAIL.subject(r.reference, r.gpuCount, r.company), text, html };
}

async function deliver(msg: { to: string; subject: string; text: string; html: string; replyTo?: string }): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[mail] (not configured — logging only)\n  to: ${msg.to}\n  subject: ${msg.subject}\n\n${msg.text}\n`);
    return { ok: true, mode: "logged" };
  }
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      replyTo: msg.replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, mode: "sent", id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function sendReceipt(r: Reservation): Promise<MailResult> {
  const m = receiptMessage(r);
  return deliver({ to: r.email, ...m, replyTo: SITE.email.sales });
}

export function sendNotification(r: Reservation, adminUrl: string): Promise<MailResult> {
  const m = notifyMessage(r, adminUrl);
  const to = process.env.NOTIFY_TO ?? SITE.email.sales;
  return deliver({ to, ...m, replyTo: r.email });
}
