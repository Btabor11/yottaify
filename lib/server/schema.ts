/**
 * THE DATA MODEL. One place.
 *
 * Three tables:
 *
 *   reservations        one row per request. Everything we know about a lead,
 *                       in columns, so it can be filtered, exported and joined
 *                       without parsing JSON. Grouped below by where the data
 *                       came from: the form, the optional follow-up, the
 *                       visit context we captured silently, the behaviour we
 *                       observed, and the pipeline state we maintain.
 *
 *   reservation_events  append-only audit trail per reservation: created,
 *                       status changes, emails sent, follow-up received,
 *                       notes added. Never updated, never deleted.
 *
 *   events              first-party analytics. Page views, section views,
 *                       estimator use, CTA clicks. Session-scoped, no cookie,
 *                       no third party. This is what lets us answer "what did
 *                       the people who reserved actually read first?"
 *
 * Drizzle is the source of truth for the shape; `drizzle/` holds the generated
 * SQL. The file-backed store in store-file.ts produces the same row shapes so
 * the pipeline is identical with or without a database.
 *
 * Adding a column: add it here, run `npm run db:generate`, then `db:migrate`.
 */

import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const RESERVATION_STATUSES = [
  "new",
  "contacted",
  "call_scheduled",
  "term_sheet",
  "contracted",
  "onboarding",
  "live",
  "declined",
  "withdrawn",
  "spam",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  new: "New",
  contacted: "Contacted",
  call_scheduled: "Call scheduled",
  term_sheet: "Term sheet",
  contracted: "Contracted",
  onboarding: "Onboarding",
  live: "Live",
  declined: "Declined",
  withdrawn: "Withdrawn",
  spam: "Spam",
};

/** Statuses that mean the lead is still open. Everything else is terminal. */
export const OPEN_STATUSES: ReservationStatus[] = [
  "new",
  "contacted",
  "call_scheduled",
  "term_sheet",
  "contracted",
  "onboarding",
];

export type Tier = "A" | "B" | "C";

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Short human code, e.g. R-7K3M2X. What the client quotes back to us. */
    reference: text("reference").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    // --- the form ---------------------------------------------------------
    company: text("company").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    /** Lower-cased domain of `email`. Indexed: "how many from acme.com?" */
    emailDomain: text("email_domain").notNull(),
    gpuCount: text("gpu_count").notNull(),
    /** YYYY-MM-DD as submitted. Kept as text so it never shifts by timezone. */
    startDate: text("start_date").notNull(),
    workload: text("workload").notNull(),
    notes: text("notes"),

    // --- the optional follow-up ------------------------------------------
    role: text("role"),
    phone: text("phone"),
    teamSize: text("team_size"),
    currentProvider: text("current_provider"),
    currentSpend: text("current_spend"),
    termInterest: text("term_interest"),
    durationMonths: text("duration_months"),
    storageNeeds: text("storage_needs"),
    dataMovement: text("data_movement"),
    compliance: jsonb("compliance").$type<string[]>(),
    decisionTimeframe: text("decision_timeframe"),
    heardFrom: text("heard_from"),
    dealbreakers: text("dealbreakers"),
    followupAt: timestamp("followup_at", { withTimezone: true }),

    // --- visit context, captured silently -------------------------------
    /** Path the form was on when submitted. */
    path: text("path"),
    /** Full referrer of the first page in the session, if any. */
    referrer: text("referrer"),
    /** First path of the session — what they arrived on. */
    landingPath: text("landing_path"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    utmContent: text("utm_content"),
    userAgent: text("user_agent"),
    /** Salted SHA-256 of the client IP. Never the IP itself. */
    ipHash: text("ip_hash"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    locale: text("locale"),
    timezone: text("timezone"),
    viewportW: integer("viewport_w"),
    viewportH: integer("viewport_h"),
    screenW: integer("screen_w"),
    screenH: integer("screen_h"),
    dpr: text("dpr"),
    deviceClass: text("device_class"),
    reducedMotion: boolean("reduced_motion"),
    colorScheme: text("color_scheme"),
    /** False when the form arrived as a native POST — JavaScript never ran. */
    jsEnabled: boolean("js_enabled").notNull().default(true),
    sessionId: text("session_id"),

    // --- behaviour ---------------------------------------------------------
    timeOnPageMs: integer("time_on_page_ms"),
    formFillMs: integer("form_fill_ms"),
    validationFailures: integer("validation_failures"),
    estimatorGpus: integer("estimator_gpus"),
    estimatorHours: integer("estimator_hours"),
    sectionsViewed: jsonb("sections_viewed").$type<string[]>(),
    pagesViewed: jsonb("pages_viewed").$type<string[]>(),
    sourceClicks: integer("source_clicks"),

    // --- pipeline ----------------------------------------------------------
    status: text("status").$type<ReservationStatus>().notNull().default("new"),
    tier: text("tier").$type<Tier>().notNull().default("C"),
    score: integer("score").notNull().default(0),
    spam: boolean("spam").notNull().default(false),
    spamReason: text("spam_reason"),
    owner: text("owner"),
    internalNotes: text("internal_notes"),
    receiptSentAt: timestamp("receipt_sent_at", { withTimezone: true }),
    notifySentAt: timestamp("notify_sent_at", { withTimezone: true }),
    webhookSentAt: timestamp("webhook_sent_at", { withTimezone: true }),
    /** Client-generated key so a retried submit cannot create two rows. */
    idempotencyKey: text("idempotency_key").unique(),
  },
  (t) => [
    index("reservations_created_at_idx").on(t.createdAt),
    index("reservations_status_idx").on(t.status),
    index("reservations_email_domain_idx").on(t.emailDomain),
    index("reservations_start_date_idx").on(t.startDate),
  ],
);

export const RESERVATION_EVENT_TYPES = [
  "created",
  "status_changed",
  "followup_received",
  "receipt_sent",
  "receipt_failed",
  "notify_sent",
  "notify_failed",
  "webhook_sent",
  "webhook_failed",
  "note_added",
  "owner_changed",
  "flagged_spam",
] as const;
export type ReservationEventType = (typeof RESERVATION_EVENT_TYPES)[number];

export const reservationEvents = pgTable(
  "reservation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    type: text("type").$type<ReservationEventType>().notNull(),
    /** Who caused it. */
    actor: text("actor").$type<"system" | "client" | "admin">().notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reservation_events_reservation_idx").on(t.reservationId, t.createdAt)],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    name: text("name").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>(),
    path: text("path"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    country: text("country"),
    /** Client clock, so ordering within a session survives a slow beacon. */
    clientTs: timestamp("client_ts", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_session_idx").on(t.sessionId, t.createdAt), index("events_name_idx").on(t.name, t.createdAt)],
);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type ReservationEvent = typeof reservationEvents.$inferSelect;
export type NewReservationEvent = typeof reservationEvents.$inferInsert;
export type AnalyticsEventRow = typeof events.$inferSelect;
export type NewAnalyticsEventRow = typeof events.$inferInsert;
