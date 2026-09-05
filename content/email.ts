/**
 * EMAIL COPY.
 *
 * Two messages leave the system when a reservation lands: a receipt to the
 * person who reserved, and a notification to the sales inbox. Both are plain
 * text first — a buyer's mail client and a phone both render it — with a
 * minimal HTML twin built from the same strings in lib/server/mail.ts.
 */

import { SITE } from "@/config/site";
import { FORM_COPY } from "./form";
import { BEFORE_CHECKLIST } from "./process";

export const RECEIPT_EMAIL = {
  subject: (reference: string) => `Reservation received — ${reference}`,
  greeting: (name: string) => `Hello ${name},`,
  intro: `We have your reservation request. A person will read it and confirm your position in the allocation order by email — ${SITE.name} does not assign one automatically.`,
  referenceLabel: "Your reference",
  summaryHeading: "What you asked for",
  nextHeading: "What happens next",
  next: FORM_COPY.whatHappensNext,
  prepareHeading: "Before the call, it helps to have these to hand",
  prepare: BEFORE_CHECKLIST.map((c) => c.label),
  waitLine: "If you have not heard from us within two business days, reply to this email and it will reach a human.",
  signoff: `— ${SITE.name}`,
  footer: `${SITE.location.detail}. You are receiving this because a reservation form was submitted with this address. Reply to this email to correct or withdraw it.`,
} as const;

export const NOTIFY_EMAIL = {
  subject: (reference: string, gpuCount: string, company: string) =>
    `New reservation ${reference} — ${gpuCount} GPUs — ${company}`,
  heading: "New reservation",
  adminLink: "Open in admin",
} as const;
