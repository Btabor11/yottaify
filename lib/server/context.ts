/**
 * Server-side validation for everything that arrives ALONGSIDE the seven form
 * fields: the visit context the client captured, the honeypot, timing, and
 * the follow-up questionnaire.
 *
 * The seven form fields are validated by lib/validation.ts — one schema,
 * shared with the client. Everything here is optional, lenient and clamped:
 * bad context must never cost us a lead, so nothing in this file can fail a
 * submission. Unparseable values become null.
 */

import * as z from "zod/mini";
import { FOLLOWUP_FIELDS } from "@/content/followup";
import type { NewReservation } from "./schema";

const str = (max: number) =>
  z.optional(
    z.nullable(
      z.pipe(
        z.unknown(),
        z.transform((v) => (typeof v === "string" ? v.trim().slice(0, max) || null : null)),
      ),
    ),
  );
const int = () =>
  z.optional(
    z.nullable(
      z.pipe(
        z.unknown(),
        z.transform((v) => {
          const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
          return Number.isFinite(n) ? Math.max(0, Math.min(2_147_483_647, Math.round(n))) : null;
        }),
      ),
    ),
  );
const bool = () =>
  z.optional(
    z.nullable(
      z.pipe(
        z.unknown(),
        z.transform((v) => (typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : null)),
      ),
    ),
  );
const strList = (max: number) =>
  z.optional(
    z.nullable(
      z.pipe(
        z.unknown(),
        z.transform((v) =>
          Array.isArray(v)
            ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 80)).slice(0, max)
            : typeof v === "string" && v
              ? v.split(",").map((x) => x.trim().slice(0, 80)).filter(Boolean).slice(0, max)
              : null,
        ),
      ),
    ),
  );

export const contextSchema = z.object({
  sessionId: str(64),
  path: str(200),
  referrer: str(500),
  landingPath: str(200),
  utmSource: str(120),
  utmMedium: str(120),
  utmCampaign: str(120),
  utmTerm: str(120),
  utmContent: str(120),
  locale: str(20),
  timezone: str(64),
  viewportW: int(),
  viewportH: int(),
  screenW: int(),
  screenH: int(),
  dpr: str(8),
  reducedMotion: bool(),
  colorScheme: str(10),
  timeOnPageMs: int(),
  formFillMs: int(),
  validationFailures: int(),
  estimatorGpus: int(),
  estimatorHours: int(),
  sectionsViewed: strList(40),
  pagesViewed: strList(40),
  sourceClicks: int(),
  /** Client-generated idempotency key. */
  submissionId: str(64),
  /** Honeypot. Humans never see it; anything in it is a bot. */
  website: str(200),
});

export type ClientContext = z.infer<typeof contextSchema>;

/** Parse whatever arrived. Never throws; unknown shapes become an empty context. */
export function parseContext(data: unknown): ClientContext {
  const r = contextSchema.safeParse(data ?? {});
  return r.success ? r.data : {};
}

/** Map the client context onto reservation columns. */
export function contextToColumns(c: ClientContext): Partial<NewReservation> {
  return {
    sessionId: c.sessionId ?? null,
    path: c.path ?? null,
    referrer: c.referrer ?? null,
    landingPath: c.landingPath ?? null,
    utmSource: c.utmSource ?? null,
    utmMedium: c.utmMedium ?? null,
    utmCampaign: c.utmCampaign ?? null,
    utmTerm: c.utmTerm ?? null,
    utmContent: c.utmContent ?? null,
    locale: c.locale ?? null,
    timezone: c.timezone ?? null,
    viewportW: c.viewportW ?? null,
    viewportH: c.viewportH ?? null,
    screenW: c.screenW ?? null,
    screenH: c.screenH ?? null,
    dpr: c.dpr ?? null,
    reducedMotion: c.reducedMotion ?? null,
    colorScheme: c.colorScheme ?? null,
    timeOnPageMs: c.timeOnPageMs ?? null,
    formFillMs: c.formFillMs ?? null,
    validationFailures: c.validationFailures ?? null,
    estimatorGpus: c.estimatorGpus ?? null,
    estimatorHours: c.estimatorHours ?? null,
    sectionsViewed: c.sectionsViewed ?? null,
    pagesViewed: c.pagesViewed ?? null,
    sourceClicks: c.sourceClicks ?? null,
    idempotencyKey: c.submissionId ?? null,
  };
}

// --- follow-up ---------------------------------------------------------------

const selectValues = (name: string) =>
  new Set((FOLLOWUP_FIELDS.find((f) => f.name === name)?.options ?? []).map((o) => o.value));

const pick = (name: string) => {
  const allowed = selectValues(name);
  return z.optional(
    z.nullable(
      z.pipe(
        z.unknown(),
        z.transform((v) => (typeof v === "string" && allowed.has(v) ? v : null)),
      ),
    ),
  );
};

export const followupSchema = z.object({
  reference: z.string(),
  email: z.string(),
  role: str(120),
  phone: str(40),
  teamSize: pick("teamSize"),
  currentProvider: pick("currentProvider"),
  currentSpend: pick("currentSpend"),
  termInterest: pick("termInterest"),
  durationMonths: pick("durationMonths"),
  storageNeeds: pick("storageNeeds"),
  dataMovement: pick("dataMovement"),
  compliance: z.optional(
    z.nullable(
      z.pipe(
        strList(12),
        z.transform((v) => {
          const allowed = selectValues("compliance");
          return v ? v.filter((x) => allowed.has(x)) : null;
        }),
      ),
    ),
  ),
  decisionTimeframe: pick("decisionTimeframe"),
  heardFrom: pick("heardFrom"),
  dealbreakers: str(1000),
});

export type FollowupInput = z.infer<typeof followupSchema>;

export function parseFollowup(data: unknown): { ok: true; data: FollowupInput } | { ok: false } {
  const r = followupSchema.safeParse(data);
  return r.success ? { ok: true, data: r.data } : { ok: false };
}

/** Only the columns the client actually answered. Blank answers do not overwrite earlier ones. */
export function followupToColumns(f: FollowupInput): Partial<NewReservation> {
  const out: Partial<NewReservation> = {};
  const set = <K extends keyof NewReservation>(k: K, v: NewReservation[K] | null | undefined) => {
    if (v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)) out[k] = v;
  };
  set("role", f.role);
  set("phone", f.phone);
  set("teamSize", f.teamSize);
  set("currentProvider", f.currentProvider);
  set("currentSpend", f.currentSpend);
  set("termInterest", f.termInterest);
  set("durationMonths", f.durationMonths);
  set("storageNeeds", f.storageNeeds);
  set("dataMovement", f.dataMovement);
  set("compliance", f.compliance ?? null);
  set("decisionTimeframe", f.decisionTimeframe);
  set("heardFrom", f.heardFrom);
  set("dealbreakers", f.dealbreakers);
  return out;
}
