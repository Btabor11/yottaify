/**
 * ADMIN COPY — the internal desk that reads the reservation store.
 *
 * Internal tooling, but the same rule holds: strings live here, not in
 * components, so the desk can be relabelled without touching markup.
 *
 * The desk is a hydrographic survey station. A reservation is a *sounding*:
 * a reading taken from the dark, with a position in time, a magnitude, a
 * confidence, and a depth. Depth is the pipeline — a new lead floats at the
 * surface, a contracted one rests on the floor. The vocabulary below is that
 * metaphor held consistently, because a metaphor a reader has to re-learn per
 * screen is worse than none at all.
 */

export const ADMIN = {
  title: "Reservation desk",
  eyebrow: "Internal",
  station: "Night board",
  nav: {
    board: "Board",
    export: "Export CSV",
    site: "Site",
    logout: "Sign out",
  },
  login: {
    heading: "Sign in to the desk",
    body: "Same credentials as the ADMIN_USER and ADMIN_PASSWORD environment variables. The session lasts twelve hours.",
    user: "Username",
    pass: "Password",
    submit: "Sign in",
    failed: "That username and password did not match.",
    limited: "Too many attempts. Wait a minute and try again.",
    basicHint: "Scripts can skip this page and use HTTP Basic auth: curl -u USER:PASS <site>/admin/export",
    plate: "Station",
    plateValue: "Unattended until signed in",
    caption: "The chart room, dark. Nothing is plotted until someone is at the desk.",
  },
  store: {
    postgres: "Postgres",
    file: "Local files (.data/) — not durable in production",
    down: "Store unreachable",
    label: "Store",
  },
  stats: {
    total: "Reservations",
    open: "Open",
    gpus: "GPUs requested (open, low end)",
    last7d: "Last 7 days",
    followup: "Answered follow-up",
    spam: "Held as spam",
    noJs: "Arrived without JavaScript",
    events: "Analytics events",
  },
  breakdown: {
    byStatus: "By status",
    byGpuCount: "By capacity",
    byWorkload: "By workload",
    byStartMonth: "By target month",
    byTier: "By tier",
    bySource: "By source",
  },

  /* --- the chart ------------------------------------------------------- */
  chart: {
    title: "Sounding field",
    caption: "Every reservation on the board, plotted. Horizontal is the day it arrived, vertical is how deep it has gone, and the size of a mark is the capacity asked for.",
    axisTime: "Arrived",
    axisDepth: "Depth",
    axisNow: "Now",
    legendShoal: "Surface — new",
    legendDeep: "Floor — live",
    legendSize: "Mark size is capacity",
    legendSpent: "Faded — closed or held",
    empty: "Nothing plotted. The field draws itself from the rows the filter returns.",
    still: "Static chart. The animated field loads only if this machine can spare it.",
    reading: "Reading",
    surveyed: "Surveyed",
  },

  /* --- instrument panel ------------------------------------------------ */
  panel: {
    intake: "Intake",
    intakeNote: "Arrivals per day, last fourteen days",
    descent: "Descent",
    descentNote: "Where the rows on this view are sitting",
    weight: "Weight",
    weightNote: "Capacity by band, low end of each",
    weightLead: "Low end of every open band",
    answeredLead: "of the rows on this view",
    signal: "Signal",
    signalNote: "How these rows reached the site",
    quality: "Quality",
    qualityNote: "Tier is scored on capacity, timing and follow-up",
    workload: "Workload",
    workloadNote: "What they said they would run",
    schedule: "Schedule",
    scheduleNote: "Month they asked to start",
    today: "Today",
    perDay: "/day",
    median: "Median",
    oldest: "Oldest open",
    unowned: "Unowned",
    stalled: "Stalled",
    stalledNote: "Open, no movement in seven days",
    coverage: "Coverage",
    coverageNote: "Open rows with someone on them",
    answered: "Answered",
    ofOpen: "of open",
    noneStalled: "Nothing stalled. Every open row has moved this week.",
    noneUnowned: "Every open row has an owner.",
    /* An empty view has no share to report. Saying "100%" of nothing is the
       kind of number that quietly teaches people to stop reading the panel. */
    noneOpen: "Nothing open on this view.",
    noneToCount: "No rows on this view to follow up.",
    allClear: "All clear",
  },

  /* --- attention ------------------------------------------------------- */
  attention: {
    title: "Needs a hand",
    note: "Ranked by how long it has been waiting, weighted by tier.",
    empty: "Nothing is waiting. Every open row has an owner and recent movement.",
    reasonUnowned: "No owner",
    reasonStalled: "No movement",
    reasonNew: "Untouched",
    reasonFollowup: "Follow-up answered, not actioned",
    waiting: "waiting",
  },

  /* --- filters --------------------------------------------------------- */
  filters: {
    legend: "Filter",
    status: "Status",
    tier: "Tier",
    search: "Search",
    searchPlaceholder: "Company, name, email, reference…",
    open: "Open",
    all: "All (not spam)",
    spam: "Spam",
    anyTier: "Any tier",
    apply: "Apply",
    clear: "Clear",
    showing: "Showing",
    of: "of",
    rows: "rows",
    active: "Filtered",
    quick: "Quick view",
  },
  table: {
    caption: "Every reservation on this view. Column headings reorder the log.",
    /* Read out after the column name, so a heading announces both what it is
       and what clicking it will do. */
    sortBy: "— sort by this column",
    sortedAsc: "— sorted, ascending. Activate to reverse.",
    sortedDesc: "— sorted, descending. Activate to reverse.",
    reference: "Ref",
    received: "Received",
    company: "Company",
    contact: "Contact",
    capacity: "GPUs",
    start: "Start",
    workload: "Workload",
    tier: "Tier",
    status: "Status",
    owner: "Owner",
    depth: "Depth",
    empty: "No reservations match.",
    emptyHint: "When the form is submitted, rows appear here. Try a wider filter, or submit a test reservation from the site.",
    unowned: "—",
  },
  detail: {
    back: "← Board",
    form: "What they told us",
    followup: "Follow-up answers",
    followupNone: "Not answered yet. The follow-up link is in their receipt.",
    context: "How they arrived",
    behaviour: "What they did on the page",
    pipeline: "Pipeline",
    timeline: "Timeline",
    notFound: "No reservation with that reference.",
    notFoundHint: "It may have been erased on request, or the code may have picked up a typo — they are six characters and never contain O, I, L or a zero.",
    mailto: "Email them",
    score: "Score",
    scoreHelp: "Tier A ≥ 60, B ≥ 30. Recomputed when the follow-up lands.",
    reading: "Reading",
    readingNote: "This sounding against the rest of the board",
    depthNote: "Depth is the pipeline stage. The bead sits where this row is now.",
    age: "Age",
    lastMove: "Last movement",
    intent: "Read",
    intentNote: "Assembled from what they did before submitting. Observation, not a claim.",
    actions: "Actions",
    actionsNote: "Every one of these is a plain form post and works with JavaScript off.",
    notes: "Desk notes",
    notesNone: "No notes yet.",
    journey: "Path through the site",
    journeyNone: "No page views recorded for this session.",
    engagement: "Engagement",
    danger: "Deletion",
  },
  read: {
    strong: "Strong signal",
    fair: "Fair signal",
    weak: "Weak signal",
    deliberate: "Read the page before submitting",
    quick: "Submitted quickly",
    priced: "Opened the pricing sources",
    estimated: "Used the estimator",
    struggled: "Hit validation more than once",
    noJs: "Submitted without JavaScript",
    returning: "Viewed more than one page",
    followed: "Came back to answer the follow-up",
    none: "Nothing observed beyond the form itself.",
  },
  actions: {
    status: "Set status",
    owner: "Owner",
    ownerPlaceholder: "Who is on it",
    note: "Internal note",
    notePlaceholder: "Call notes, next step, anything the team should know.",
    save: "Save",
    flagSpam: "Flag as spam",
    unflagSpam: "Not spam",
    erase: "Erase this record",
    eraseHelp: "For a deletion request. Removes the reservation and its timeline permanently. Type the reference to confirm.",
    eraseConfirmPlaceholder: "Reference",
    erased: "Record erased.",
    saved: "Saved.",
    failed: "Could not save. The store may be unreachable.",
    advance: "Advance",
    advanceHelp: "Move to the next stage",
  },
  fields: {
    company: "Company",
    name: "Name",
    email: "Email",
    gpuCount: "GPUs",
    startDate: "Target start",
    workload: "Workload",
    notes: "Notes",
    role: "Role",
    phone: "Phone",
    teamSize: "Team size",
    currentProvider: "Current provider",
    currentSpend: "Monthly compute spend",
    termInterest: "Term interest",
    durationMonths: "Duration",
    storageNeeds: "Storage",
    dataMovement: "Data movement",
    compliance: "Provider requirements",
    decisionTimeframe: "Decision timeframe",
    heardFrom: "Heard from",
    dealbreakers: "Dealbreakers",
    followupAt: "Answered",
    path: "Submitted from",
    landingPath: "Landed on",
    referrer: "Referrer",
    utm: "Campaign",
    country: "Location",
    locale: "Locale",
    timezone: "Timezone",
    device: "Device",
    viewport: "Viewport",
    colorScheme: "Colour scheme",
    reducedMotion: "Reduced motion",
    jsEnabled: "JavaScript",
    userAgent: "User agent",
    ipHash: "IP (hashed)",
    sessionId: "Session",
    timeOnPage: "Time on page before submit",
    formFill: "Time in form",
    validationFailures: "Validation failures",
    estimator: "Estimator",
    sectionsViewed: "Sections viewed",
    pagesViewed: "Pages viewed",
    sourceClicks: "Source links opened",
    receipt: "Receipt email",
    notify: "Sales notification",
    webhook: "Webhook",
    idempotencyKey: "Idempotency key",
    id: "Row id",
  },
  values: {
    none: "—",
    yes: "Yes",
    no: "No",
    sent: "Sent",
    notSent: "Not sent",
    direct: "Direct",
    never: "Never",
  },
  disabled: {
    heading: "Admin is not configured",
    body: "Set ADMIN_USER and ADMIN_PASSWORD in the environment to enable this route. Until then it answers 404.",
  },
} as const;

/**
 * What each kind of timeline entry is called.
 *
 * The store logs machine names — `status_changed`, `followup_received` — and
 * the timeline used to print them raw next to a blob of JSON. A log is only
 * useful if it can be skimmed, so the names are written out and the payload
 * is unpacked into pairs beside them.
 */
export const EVENT_LABEL: Record<string, string> = {
  created: "Reservation received",
  status_changed: "Status changed",
  owner_changed: "Owner changed",
  note_added: "Note added",
  flagged_spam: "Held as spam",
  followup_received: "Follow-up answered",
};

export const EVENT_FIELD: Record<string, string> = {
  from: "From",
  to: "To",
  note: "Note",
  owner: "Owner",
  reason: "Reason",
  source: "Source",
  score: "Score",
  tier: "Tier",
};

/**
 * Depth of each pipeline stage, 0 at the surface, 1 on the floor.
 *
 * This is the single source of the ordering. The chart, the descent
 * instrument, the row gutter and the "advance" action all read it, so the
 * picture and the buttons can never disagree about what comes next.
 *
 * Terminal states are off the scale: declined and withdrawn are surfaced
 * (the sounding was pulled back up), spam never entered the water.
 */
export const STAGE_DEPTH: Record<string, number> = {
  new: 0,
  contacted: 0.18,
  call_scheduled: 0.36,
  term_sheet: 0.55,
  contracted: 0.74,
  onboarding: 0.88,
  live: 1,
  declined: 0,
  withdrawn: 0,
  spam: 0,
};

/** The order a lead is worked through, for the "advance" action. */
export const STAGE_ORDER = [
  "new",
  "contacted",
  "call_scheduled",
  "term_sheet",
  "contracted",
  "onboarding",
  "live",
] as const;
