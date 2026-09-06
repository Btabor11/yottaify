/**
 * Fill the local file store with a plausible desk.
 *
 * The desk is a lot of instruments, and instruments read wrong on three rows:
 * a pipeline drawn from two statuses looks broken rather than empty, and a
 * fourteen-day intake chart with one bar tells you nothing about whether the
 * chart works. This writes a spread — every status, every tier, owners,
 * follow-ups, stalled rows, spam — so the board can actually be looked at.
 *
 *   node scripts/seed-desk.mjs         add the spread, keeping what is there
 *   node scripts/seed-desk.mjs --reset remove only the rows this wrote
 *
 * Every row it creates is marked with `sessionId: "seed-desk"`, so --reset can
 * find them again and real local submissions are never touched.
 *
 * Dev-only tooling. Not part of the shipped site. It writes to .data/, which
 * is gitignored, and it refuses to run if DATABASE_URL is set.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

if (process.env.DATABASE_URL) {
  console.error("DATABASE_URL is set — this script only ever writes to the local file store.");
  process.exit(1);
}

const MARK = "seed-desk";
const DIR = ".data";
const ROWS = `${DIR}/reservations.json`;
const EVENTS = `${DIR}/reservation_events.jsonl`;
const DAY = 86_400_000;

mkdirSync(DIR, { recursive: true });
const existing = existsSync(ROWS) ? JSON.parse(readFileSync(ROWS, "utf8")) : [];
const kept = existing.filter((r) => r.sessionId !== MARK);

if (process.argv.includes("--reset")) {
  writeFileSync(ROWS, JSON.stringify(kept, null, 2));
  const evs = existsSync(EVENTS) ? readFileSync(EVENTS, "utf8").split("\n").filter(Boolean) : [];
  const ids = new Set(existing.filter((r) => r.sessionId === MARK).map((r) => r.id));
  writeFileSync(EVENTS, evs.filter((l) => !ids.has(JSON.parse(l).reservationId)).join("\n") + "\n");
  console.log(`removed ${existing.length - kept.length} seeded row(s)`);
  process.exit(0);
}

/* A seeded RNG, so two runs produce the same desk and a screenshot diff means
   a design change rather than new random data. */
let seed = 0x5f3a91;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const COMPANIES = [
  ["Meridian Bio", "Priya Raman", "priya", "meridian.bio"],
  ["Kestrel Robotics", "Tom Whitlock", "tom", "kestrel.rocks"],
  ["Halden Systems", "Ana Vidal", "ana", "halden.systems"],
  ["Northwind Research", "Dana Okafor", "dana", "northwind.dev"],
  ["Ottoline AI", "Sam Beaumont", "sam", "ottoline.ai"],
  ["Petrichor Labs", "Yuki Tanabe", "yuki", "petrichor.co"],
  ["Basalt Compute", "Marek Nowak", "marek", "basalt.build"],
  ["Verdigris Health", "Ruth Adeyemi", "ruth", "verdigris.health"],
  ["Lantern Freight", "Jonas Vik", "jonas", "lanternfreight.no"],
  ["Ash & Ember Studio", "Cleo Marsh", "cleo", "ashember.studio"],
  ["Tidewater Genomics", "Ivan Petrov", "ivan", "tidewater.bio"],
  ["Foxglove Media", "Nina Costa", "nina", "foxglove.media"],
  ["Cobalt Row", "Errol Hayes", "errol", "cobaltrow.com"],
  ["Sable Analytics", "Mia Lindqvist", "mia", "sable.se"],
  ["Quarry Point", "Owen Blackwood", "owen", "quarrypoint.io"],
  ["Helio Freight", "Zara Nasser", "zara", "heliofreight.ae"],
  ["Bramble Interactive", "Finn Dolan", "finn", "bramble.games"],
  ["Ledger & Lune", "Aiko Mori", "aiko", "ledgerlune.jp"],
  ["Thistle Down Farms", "Gwen Pritchard", "gwen", "thistledown.farm"],
  ["Umber Optics", "Rafael Souza", "rafael", "umberoptics.br"],
  ["Cinder Networks", "Lena Brandt", "lena", "cinder.net"],
  ["Pelagic Data", "Kofi Mensah", "kofi", "pelagic.data"],
];

const GPUS = ["1-2", "4", "8", "16", "24", "32", "48"];
const WORKLOADS = ["nvfp4-training", "fine-tuning", "inference", "research", "other"];
const STATUSES = [
  ["new", 7],
  ["contacted", 5],
  ["call_scheduled", 3],
  ["term_sheet", 2],
  ["contracted", 2],
  ["onboarding", 1],
  ["live", 1],
  ["declined", 2],
  ["withdrawn", 1],
];
const OWNERS = ["R. Tanner", "J. Osei", "M. Kaur", null, null];
const SOURCES = [
  ["hn", null],
  ["reddit", null],
  [null, "https://news.ycombinator.com/"],
  [null, "https://www.google.com/"],
  [null, null],
  ["newsletter", null],
  [null, "https://x.com/"],
];

/* Same alphabet as lib/server/reference.ts — no 0/O and no 1/I/L, so a code
   survives being read aloud. A seeded row whose reference does not satisfy
   isReference() is a row whose dossier answers 404, which is exactly the bug
   this comment exists to stop happening again. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const reference = () => `R-${Array.from({ length: 6 }, () => ALPHABET[int(0, ALPHABET.length - 1)]).join("")}`;

const plan = [];
for (const [status, n] of STATUSES) for (let i = 0; i < n; i++) plan.push(status);

const rows = [];
const events = [];
const now = Date.now();

plan.forEach((status, i) => {
  const [company, name, handle, domain] = COMPANIES[i % COMPANIES.length];
  const suffix = i >= COMPANIES.length ? ` ${Math.floor(i / COMPANIES.length) + 1}` : "";
  // Older rows are further down the pipeline, which is how a real desk looks.
  const depth = ["new", "contacted"].includes(status) ? int(0, 9) : int(6, 27);
  const createdAt = new Date(now - depth * DAY - int(0, 20) * 3600_000);
  // A few open rows have not been touched in a fortnight. That is the point.
  // Clamped to createdAt: a row that was last moved before it arrived reads as
  // a bug in the desk rather than as test data.
  const stall = status !== "new" && rnd() < 0.3 ? int(8, 16) : int(0, 4);
  const updatedAt = new Date(Math.max(createdAt.getTime(), now - stall * DAY));
  const gpuCount = pick(GPUS);
  const [utmSource, referrer] = pick(SOURCES);
  const answered = rnd() < 0.45;
  const score = { new: 28, contacted: 38, call_scheduled: 52, term_sheet: 64, contracted: 71, onboarding: 74, live: 78 }[status] ?? 22;
  const jitter = int(-9, 9);
  const total = Math.max(4, Math.min(96, score + jitter));
  const id = randomUUID();

  rows.push({
    id,
    reference: reference(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    company: company + suffix,
    name,
    email: `${handle}@${domain}`,
    emailDomain: domain,
    gpuCount,
    startDate: `2026-${String(int(10, 12)).padStart(2, "0")}-${String(int(1, 28)).padStart(2, "0")}`,
    workload: pick(WORKLOADS),
    notes: pick([
      "Fine-tuning a 70B model, six-week burst.",
      "Serving a 400B model, currently tensor-parallel across four nodes.",
      "Batch inference overnight, idle during the day.",
      "Migrating off a hyperscaler, need to compare like for like.",
      null,
    ]),
    role: answered ? pick(["eng-lead", "founder", "researcher", "platform"]) : null,
    phone: answered && rnd() < 0.4 ? "+1 555 0100" : null,
    teamSize: answered ? pick(["2-5", "6-15", "16-50"]) : null,
    currentProvider: answered ? pick(["aws", "lambda", "runpod", "none"]) : null,
    currentSpend: answered ? pick(["under-5k", "5k-25k", "25k-100k"]) : null,
    termInterest: answered ? pick(["on-demand", "reserved", "unsure"]) : null,
    durationMonths: answered ? pick(["1-3", "3-6", "6-12"]) : null,
    storageNeeds: answered ? pick(["under-1tb", "1-10tb", "over-10tb"]) : null,
    dataMovement: answered ? pick(["light", "moderate", "heavy"]) : null,
    compliance: answered && rnd() < 0.5 ? [pick(["soc2", "hipaa", "iso27001"])] : null,
    decisionTimeframe: answered ? pick(["this-month", "this-quarter", "exploring"]) : null,
    heardFrom: answered ? pick(["search", "word-of-mouth", "forum"]) : null,
    dealbreakers: answered && rnd() < 0.4 ? "No InfiniBand would be a problem." : null,
    followupAt: answered ? new Date(createdAt.getTime() + int(1, 40) * 3600_000).toISOString() : null,
    path: "/",
    referrer,
    landingPath: pick(["/", "/", "/pricing"]),
    utmSource,
    utmMedium: utmSource ? "referral" : null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    userAgent: pick([
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Version/18.2 Mobile Safari/604.1",
    ]),
    ipHash: randomUUID().replace(/-/g, ""),
    country: pick(["US", "GB", "DE", "JP", "BR", null]),
    region: null,
    city: null,
    locale: pick(["en-US", "en-GB", "de-DE"]),
    timezone: pick(["America/Chicago", "Europe/London", "Asia/Tokyo"]),
    viewportW: pick([1440, 1728, 390, 1280]),
    viewportH: pick([900, 1080, 844]),
    screenW: 1920,
    screenH: 1080,
    dpr: "2",
    deviceClass: pick(["desktop", "desktop", "desktop", "mobile"]),
    reducedMotion: rnd() < 0.1,
    colorScheme: pick(["dark", "light"]),
    jsEnabled: rnd() > 0.08,
    sessionId: MARK,
    timeOnPageMs: int(12, 480) * 1000,
    formFillMs: int(20, 240) * 1000,
    validationFailures: rnd() < 0.25 ? int(1, 3) : 0,
    estimatorGpus: rnd() < 0.55 ? Number(gpuCount.split("-")[0]) : null,
    estimatorHours: rnd() < 0.55 ? pick([168, 720, 2160]) : null,
    sectionsViewed: ["pricing", "specs", "reserve"].slice(0, int(1, 3)),
    pagesViewed: rnd() < 0.4 ? ["/pricing", "/"] : ["/"],
    sourceClicks: rnd() < 0.4 ? int(1, 4) : 0,
    status,
    tier: total >= 60 ? "A" : total >= 30 ? "B" : "C",
    score: total,
    spam: false,
    spamReason: null,
    owner: status === "new" ? null : pick(OWNERS),
    internalNotes: rnd() < 0.3 ? `[2026-08-29 10:04] Left a voicemail. Trying again Thursday.` : null,
    receiptSentAt: createdAt.toISOString(),
    notifySentAt: createdAt.toISOString(),
    webhookSentAt: null,
    idempotencyKey: null,
  });

  events.push({
    id: randomUUID(),
    reservationId: id,
    type: "created",
    actor: "system",
    payload: { source: utmSource ?? "direct" },
    createdAt: createdAt.toISOString(),
  });
  if (status !== "new") {
    events.push({
      id: randomUUID(),
      reservationId: id,
      type: "status_changed",
      actor: "admin",
      payload: { from: "new", to: status },
      createdAt: updatedAt.toISOString(),
    });
  }
});

// Two obvious holds, so the spam view is not an empty screen.
for (let i = 0; i < 2; i++) {
  const id = randomUUID();
  const at = new Date(now - int(1, 12) * DAY).toISOString();
  rows.push({
    ...rows[i],
    id,
    reference: reference(),
    company: pick(["SEO Growth Partners", "Crypto Yield Desk"]),
    name: "Marketing Team",
    email: `offers@example-${i}.invalid`,
    emailDomain: `example-${i}.invalid`,
    createdAt: at,
    updatedAt: at,
    status: "spam",
    spam: true,
    spamReason: "link-count",
    owner: null,
    tier: "C",
    score: 2,
    followupAt: null,
    internalNotes: null,
  });
  events.push({ id: randomUUID(), reservationId: id, type: "created", actor: "system", payload: null, createdAt: at });
}

rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
writeFileSync(ROWS, JSON.stringify([...kept, ...rows], null, 2));

const prior = existsSync(EVENTS) ? readFileSync(EVENTS, "utf8").split("\n").filter(Boolean) : [];
writeFileSync(EVENTS, [...prior, ...events.map((e) => JSON.stringify(e))].join("\n") + "\n");

console.log(`seeded ${rows.length} row(s) and ${events.length} event(s) · ${kept.length} pre-existing row(s) kept`);
