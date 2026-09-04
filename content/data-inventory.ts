/**
 * DATA INVENTORY — every column we keep about a lead, and why.
 *
 * This file exists so the privacy policy cannot drift from the schema again.
 * `INVENTORY` is typed `satisfies Record<keyof NewReservation, FieldEntry>`:
 * add a column to lib/server/schema.ts without describing it here and
 * `npm run typecheck` fails. That is the same discipline the price table uses
 * for sources — a number with no citation does not ship, and now a column
 * with no stated purpose does not either.
 *
 * `PRIVACY_DRAFT` at the bottom is generated from the inventory. To adopt it:
 *
 *   in content/legal.ts:   export const PRIVACY = PRIVACY_DRAFT;
 *   in content/index.ts:   export * from "./data-inventory";
 *
 * Counsel should review the generated prose. But the *facts* in it come from
 * the code, so counsel is reviewing wording, not chasing engineering.
 *
 * TWO DECISIONS ARE STILL OPEN and are rendered honestly as open until made —
 * see `RETENTION` and `DELETION` below.
 */

import type { NewReservation } from "@/lib/server/schema";
import { SITE } from "@/config/site";

// --- decisions --------------------------------------------------------------

/**
 * Retention per category, in days. `null` renders as "not yet set" — which is
 * true, and better than a number nobody has agreed to. Set these, then the
 * policy updates itself.
 */
export const RETENTION: Record<Exclude<DataSource, "pipeline">, number | null> = {
  form: null,
  followup: null,
  context: null,
  behaviour: null,
  analytics: null,
};

/**
 * Whether we honour deletion requests. `reservation_events` cascades on delete
 * so it is implementable in one admin action — but there is no code path for
 * it yet. Flip to true only once that action exists. Until then the policy
 * says we will *tell you what we hold* and does not promise deletion.
 */
export const DELETION = {
  implemented: false as boolean,
} as const;

// --- inventory ------------------------------------------------------------------

export type DataSource =
  | "form"       // typed into the reservation form
  | "followup"   // typed into the optional follow-up form
  | "context"    // captured about the visit without asking
  | "behaviour"  // observed on the page during the visit
  | "analytics"  // first-party event stream, session-scoped (separate table)
  | "pipeline";  // our own bookkeeping about the lead

export interface FieldEntry {
  source: DataSource;
  /** One clause, for the policy. */
  what: string;
  /** Why we keep it. Written for the visitor, not for us. */
  why: string;
  /** Does this identify or fingerprint a person, alone or combined? */
  personal: boolean;
}

export const SOURCE_LABEL: Record<DataSource, string> = {
  form: "What you type into the reservation form",
  followup: "What you type into the optional follow-up",
  context: "What we record about your visit without asking",
  behaviour: "What we observe you do on the page",
  analytics: "First-party analytics",
  pipeline: "Our own notes about the request",
};

const f = (what: string, why: string, personal = true): FieldEntry => ({ source: "form", what, why, personal });
const u = (what: string, why: string, personal = true): FieldEntry => ({ source: "followup", what, why, personal });
const c = (what: string, why: string, personal: boolean): FieldEntry => ({ source: "context", what, why, personal });
const b = (what: string, why: string, personal: boolean): FieldEntry => ({ source: "behaviour", what, why, personal });
const p = (what: string, why: string): FieldEntry => ({ source: "pipeline", what, why, personal: false });

export const INVENTORY = {
  // --- identity of the row -------------------------------------------------
  id: p("a random record identifier", "to reference the row internally"),
  reference: p("a short human-readable reference", "so you and we can refer to the request without using your email"),
  createdAt: p("when the request arrived", "ordering and allocation"),
  updatedAt: p("when we last touched the record", "bookkeeping"),
  idempotencyKey: p("a key your browser generates on submit", "so a retried submission cannot create two requests"),

  // --- form ----------------------------------------------------------------
  company: f("company", "to know who is asking and route the conversation"),
  name: f("your name", "to address you"),
  email: f("work email", "to reply to you — it is the only way we contact you"),
  emailDomain: f("the domain part of your email", "to group requests from the same organisation", false),
  gpuCount: f("GPUs needed", "to tell whether we can serve you at all — the fleet is sixteen"),
  startDate: f("target start date", "to schedule against other reservations"),
  workload: f("workload type", "to check the hardware fits what you intend to run"),
  notes: f("anything you chose to add", "to understand the request"),

  // --- follow-up -----------------------------------------------------------
  role: u("your role", "to understand who in the organisation is asking"),
  phone: u("phone number, if you gave one", "to call you if you asked us to"),
  teamSize: u("team size", "to size the engagement"),
  currentProvider: u("who you use now", "to understand what you are comparing us against", false),
  currentSpend: u("what you spend now", "to tell whether our capacity is in range for you", false),
  termInterest: u("on-demand or committed interest", "to quote the right thing", false),
  durationMonths: u("how long you expect to need capacity", "scheduling", false),
  storageNeeds: u("storage requirements", "to check we can meet them", false),
  dataMovement: u("how much data you need to move in and out", "to check the network can carry it", false),
  compliance: u("compliance requirements you named", "to tell you plainly if we cannot meet them", false),
  decisionTimeframe: u("when you expect to decide", "to follow up at the right time", false),
  heardFrom: u("how you heard of us", "to know which channels reach real buyers", false),
  dealbreakers: u("anything that would rule us out", "so we do not waste your time", false),
  followupAt: p("when the follow-up arrived", "bookkeeping"),

  // --- visit context -------------------------------------------------------
  path: c("the page you submitted from", "to know which page converts", false),
  referrer: c("the site that sent you here, if any", "to know which channels reach real buyers", true),
  landingPath: c("the first page you arrived on", "same", false),
  utmSource: c("campaign tags in the link you clicked", "to attribute the visit to a campaign", false),
  utmMedium: c("campaign tags in the link you clicked", "to attribute the visit to a campaign", false),
  utmCampaign: c("campaign tags in the link you clicked", "to attribute the visit to a campaign", false),
  utmTerm: c("campaign tags in the link you clicked", "to attribute the visit to a campaign", false),
  utmContent: c("campaign tags in the link you clicked", "to attribute the visit to a campaign", false),
  userAgent: c("your browser's identification string", "to debug a form that misbehaves on one browser, and to tell bots from people", true),
  ipHash: c("a salted hash of your IP address — never the address itself", "to rate-limit submissions and detect duplicates; we cannot recover the address from it", true),
  country: c("country, from your connection", "to know where demand is", true),
  region: c("region, from your connection", "same", true),
  city: c("city, from your connection", "same", true),
  locale: c("your browser language", "to know whether to write in another language", true),
  timezone: c("your timezone", "to reply during your working hours", true),
  viewportW: c("browser window width", "to debug layout problems on the size you actually used", false),
  viewportH: c("browser window height", "same", false),
  screenW: c("screen width", "same", true),
  screenH: c("screen height", "same", true),
  dpr: c("display pixel density", "same", false),
  deviceClass: c("phone, tablet or desktop, inferred from the browser string", "layout debugging and bot detection", false),
  reducedMotion: c("whether you asked your OS for reduced motion", "to check the reduced-motion version of the site actually gets used", false),
  colorScheme: c("light or dark preference", "same", false),
  jsEnabled: c("whether JavaScript ran", "to check the no-JavaScript form path works", false),
  sessionId: c("a random identifier for this browser session", "to join your form to the pages you read in the same visit — see analytics", true),

  // --- behaviour -----------------------------------------------------------
  timeOnPageMs: b("how long you were on the page", "to see whether people read before they reserve", false),
  formFillMs: b("how long the form took you", "to find fields that are slow or confusing", false),
  validationFailures: b("how many times validation rejected a field", "to find fields that are badly explained", false),
  estimatorGpus: b("the GPU count you tried in the cost estimator", "to see what people actually price", false),
  estimatorHours: b("the hours you tried in the cost estimator", "same", false),
  sectionsViewed: b("which sections of the page you scrolled to", "to see what people read before reserving", false),
  pagesViewed: b("which pages you visited this session", "same", false),
  sourceClicks: b("how many source citations you clicked", "to know whether the sourcing is read or decorative", false),

  // --- pipeline ------------------------------------------------------------
  status: p("where the request is in our process", "to work the queue"),
  tier: p("a priority tier we assign", "triage — an aid for the person reading the inbox, not a promise"),
  score: p("a priority score we compute", "same"),
  spam: p("whether we flagged it as spam", "to keep the queue readable"),
  spamReason: p("why, if so", "same"),
  owner: p("which of us is handling it", "so two people do not reply"),
  internalNotes: p("our notes to each other", "to remember the conversation"),
  receiptSentAt: p("when we emailed you a receipt", "to not send it twice"),
  notifySentAt: p("when we notified ourselves", "same"),
  webhookSentAt: p("when we pushed it to our own tooling", "same"),
} satisfies Record<keyof NewReservation, FieldEntry>;

/**
 * The analytics table is separate: one row per event, keyed by session, with
 * no name or email on it. It only becomes about *you* if you submit the form
 * in the same session, because the form row carries the same session id.
 */
export const ANALYTICS_TABLE = {
  what: [
    "the event — a page view, a section scrolled into view, an estimator change, a citation clicked, a FAQ opened, an outbound link, and how long you spent before leaving",
    "the page and referrer",
    "your browser identification string, the salted IP hash, and country",
    "a random session identifier that lives in your browser tab and is gone when you close it",
  ],
  offByDefault: true,
  noCookie: true,
  noThirdParty: true,
} as const;

/** Who else touches the data, and for what. Named so nobody has to guess. */
export const PROCESSORS = [
  { role: "hosting", detail: "the servers that run this site and the database that stores the request" },
  { role: "email delivery", detail: "the service that sends your receipt and our internal notification — it sees your email address and the request" },
  { role: "internal notifications", detail: "our own inbox and tooling receive a summary of each request, including the priority tier, where you connected from, and how long you spent on the page" },
] as const;

// --- generated policy -------------------------------------------------------------

function fieldsOf(source: DataSource): FieldEntry[] {
  return Object.values(INVENTORY).filter((e) => e.source === source);
}

function joinClauses(entries: FieldEntry[]): string {
  // Several columns can share one clause (the five UTM tags); say it once.
  const items = [...new Set(entries.map((e) => e.what))];
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join("; ")}; and ${items[items.length - 1]}`;
}

function retentionSentence(source: Exclude<DataSource, "pipeline">): string {
  const days = RETENTION[source];
  if (days == null) return "Retention for this category has not been set. It will be stated here, as a number of days, before launch.";
  if (days % 365 === 0) return `Kept for ${days / 365} year${days === 365 ? "" : "s"}, then deleted.`;
  return `Kept for ${days} days, then deleted.`;
}

export const PRIVACY_DRAFT: { updated: string; sections: { heading: string; paragraphs: string[] }[] } = {
  updated: "2026-09-04",
  sections: [
    {
      heading: "The short version",
      paragraphs: [
        "When you submit the reservation form we keep what you typed, a set of technical facts about the visit, and a record of what you did on the page. We use it to decide whether we can serve you, to reply to you, and to understand which pages and channels reach real buyers. We do not sell it, share it with advertising networks, or buy anything about you from a data broker.",
        "Below is every field, grouped by where it comes from. The list is generated from the database schema, so it cannot be shorter than what we actually keep.",
      ],
    },
    {
      heading: SOURCE_LABEL.form,
      paragraphs: [
        `${joinClauses(fieldsOf("form"))}.`,
        "This is the minimum we need to tell whether we can serve you. GPU count and start date decide that; email is how we answer.",
        retentionSentence("form"),
      ],
    },
    {
      heading: SOURCE_LABEL.followup,
      paragraphs: [
        "After you reserve we may ask a second set of questions. Every one is optional. If you answer, we keep: " + joinClauses(fieldsOf("followup")) + ".",
        "A phone number is used only if you asked us to call. Compliance requirements are asked so we can tell you plainly, and early, if we cannot meet them.",
        retentionSentence("followup"),
      ],
    },
    {
      heading: SOURCE_LABEL.context,
      paragraphs: [
        `Without asking, we record: ${joinClauses(fieldsOf("context"))}.`,
        "We do not store your IP address. We store a salted one-way hash of it, which lets us rate-limit and spot duplicate submissions and does not let us recover the address. Location is the country, region and city your connection resolves to, not a precise position.",
        "Screen size, timezone, language and browser string are each ordinary on their own. Together they can distinguish one browser from another, so we treat this whole category as personal data and hold it to the same retention as the form.",
        retentionSentence("context"),
      ],
    },
    {
      heading: SOURCE_LABEL.behaviour,
      paragraphs: [
        `We also observe, during the visit: ${joinClauses(fieldsOf("behaviour"))}.`,
        "This is attached to your reservation so the person reading it knows which page you landed on, what you read, and whether you ran the numbers. It exists to make the reply better and the page clearer, and it is the part of this policy most sites leave out.",
        retentionSentence("behaviour"),
      ],
    },
    {
      heading: SOURCE_LABEL.analytics,
      paragraphs: [
        "Analytics is off unless an environment variable turns it on. When on, it is first-party: no third-party script, no cookie, no advertising identifier.",
        `Each event records ${ANALYTICS_TABLE.what.join("; ")}.`,
        "Events are keyed to a session identifier that lives in your browser tab and disappears when you close it. They carry no name or email. They only become about you if you submit the reservation form in the same session, because your reservation then carries the same identifier.",
        retentionSentence("analytics"),
      ],
    },
    {
      heading: SOURCE_LABEL.pipeline,
      paragraphs: [
        `Once a request is in, we add our own bookkeeping: ${joinClauses(fieldsOf("pipeline"))}.`,
        "The priority tier and score are a triage aid for whoever reads the inbox. They are opinions about which requests to answer first, not a judgement about you, and they are not shared outside the company.",
      ],
    },
    {
      heading: "Who else sees it",
      paragraphs: [
        ...PROCESSORS.map((x) => `${x.role[0].toUpperCase()}${x.role.slice(1)}: ${x.detail}.`),
        "None of these is an advertising network, and none receives your data for any purpose except operating this site and answering your request.",
      ],
    },
    {
      heading: "Your choices",
      paragraphs: [
        `Email ${SITE.email.general} and we will tell you exactly what we hold on you — every field above, with its value.`,
        DELETION.implemented
          ? "Ask, and we will delete the reservation record and its audit trail."
          : "We have not yet built the ability to delete a record on request. Until we have, we will not promise it here. When it exists, this sentence will change.",
        "There is nothing to opt out of on the site itself: no cookie banner, because there is no cookie; no marketing list, because we do not add you to one.",
      ],
    },
  ],
};
