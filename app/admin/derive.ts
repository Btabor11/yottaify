/**
 * DERIVATION — everything the desk knows that the store does not store.
 *
 * The store returns rows. A desk needs answers: what arrived today, what is
 * sitting still, who has nothing on it, which request is the biggest, and
 * which one somebody should pick up next. All of that is arithmetic over the
 * same rows, so it lives here as pure functions with no I/O, and every
 * instrument on the board reads from this file rather than counting for
 * itself. Two instruments that count separately will eventually disagree.
 *
 * Nothing here invents a number. Every figure is traceable to a column.
 */

import { STAGE_DEPTH, STAGE_ORDER } from "@/content";
import { OPEN_STATUSES, type Reservation, type ReservationStatus } from "@/lib/server/schema";
import { gpuLow } from "@/lib/server/store-shared";

const DAY = 86_400_000;
const OPEN = new Set<string>(OPEN_STATUSES);

/** Stalled means open and untouched for this long. */
export const STALL_DAYS = 7;

export function isOpen(r: Reservation): boolean {
  return !r.spam && OPEN.has(r.status);
}

export function depthOf(r: Reservation): number {
  return STAGE_DEPTH[r.spam ? "spam" : r.status] ?? 0;
}

export function ageDays(d: Date | string): number {
  return (Date.now() - new Date(d).getTime()) / DAY;
}

/** The next stage a lead can be moved to, or null at the end of the line. */
export function nextStage(status: ReservationStatus): ReservationStatus | null {
  const i = (STAGE_ORDER as readonly string[]).indexOf(status);
  if (i < 0 || i === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[i + 1] as ReservationStatus;
}

/* --- the chart ---------------------------------------------------------- */

export interface Sounding {
  reference: string;
  company: string;
  /** 0 at the left edge of the window, 1 at "now". */
  x: number;
  /** 0..1, the request's capacity against the largest on the board. */
  magnitude: number;
  /** 0 at the surface, 1 on the floor. */
  depth: number;
  gpus: number;
  tier: string;
  status: string;
  terminal: boolean;
  ageDays: number;
}

export interface Field {
  points: Sounding[];
  /** Days spanned by the horizontal axis. */
  windowDays: number;
  /** Largest single request in the window, for the magnitude scale. */
  peakGpus: number;
}

/**
 * Plot every row on one field.
 *
 * Horizontal is *when it arrived*, scaled across the window the board is
 * actually showing rather than a fixed month, so a quiet week does not draw
 * itself as an empty chart. Vertical is depth. Mark size is capacity.
 */
export function field(rows: Reservation[]): Field {
  if (rows.length === 0) return { points: [], windowDays: 14, peakGpus: 0 };

  const now = Date.now();
  const oldest = rows.reduce((m, r) => Math.min(m, new Date(r.createdAt).getTime()), now);
  const windowDays = Math.max(3, Math.ceil((now - oldest) / DAY));
  const span = windowDays * DAY;
  const peakGpus = rows.reduce((m, r) => Math.max(m, gpuLow(r.gpuCount)), 1);

  const points = rows.map((r): Sounding => {
    const t = new Date(r.createdAt).getTime();
    const gpus = gpuLow(r.gpuCount);
    return {
      reference: r.reference,
      company: r.company,
      x: clamp01(1 - (now - t) / span),
      magnitude: peakGpus > 0 ? clamp01(gpus / peakGpus) : 0,
      depth: depthOf(r),
      gpus,
      tier: r.tier,
      status: r.spam ? "spam" : r.status,
      terminal: r.spam || !OPEN.has(r.status),
      ageDays: (now - t) / DAY,
    };
  });

  return { points, windowDays, peakGpus };
}

/* --- intake ------------------------------------------------------------- */

export interface Intake {
  /** Oldest day first. */
  days: Array<{ label: string; iso: string; n: number; ratio: number; today: boolean }>;
  today: number;
  peak: number;
  total: number;
  /** Mean arrivals per day across the window, one decimal. */
  perDay: string;
}

export function intake(rows: Reservation[], days = 14): Intake {
  const buckets = new Array<number>(days).fill(0);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();

  for (const r of rows) {
    const t = new Date(r.createdAt).getTime();
    const back = Math.floor((startMs - t) / DAY);
    const i = days - 1 - back;
    if (i >= 0 && i < days) buckets[i]++;
  }

  const peak = Math.max(1, ...buckets);
  const total = buckets.reduce((a, b) => a + b, 0);

  return {
    days: buckets.map((n, i) => {
      const d = new Date(startMs - (days - 1 - i) * DAY);
      return {
        label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        iso: d.toISOString().slice(0, 10),
        n,
        ratio: n / peak,
        today: i === days - 1,
      };
    }),
    today: buckets[days - 1] ?? 0,
    peak,
    total,
    perDay: (total / days).toFixed(1),
  };
}

/* --- descent ------------------------------------------------------------ */

export interface DescentStep {
  status: ReservationStatus;
  depth: number;
  n: number;
  /** Share of the open pipeline sitting on this shelf. */
  ratio: number;
}

export function descent(rows: Reservation[]): { steps: DescentStep[]; open: number } {
  const counts = new Map<string, number>();
  let open = 0;
  for (const r of rows) {
    if (!isOpen(r)) continue;
    open++;
    counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  }
  const peak = Math.max(1, ...counts.values());
  const steps = STAGE_ORDER.filter((s) => s !== "live").map((status) => {
    const n = counts.get(status) ?? 0;
    return { status: status as ReservationStatus, depth: STAGE_DEPTH[status] ?? 0, n, ratio: n / peak };
  });
  return { steps, open };
}

/* --- weight ------------------------------------------------------------- */

export interface WeightBand {
  band: string;
  n: number;
  gpus: number;
  ratio: number;
}

/** Open capacity by GPU band. Low end of each band, so it never overstates. */
export function weight(rows: Reservation[]): { bands: WeightBand[]; gpus: number } {
  const byBand = new Map<string, { n: number; gpus: number }>();
  let gpus = 0;
  for (const r of rows) {
    if (!isOpen(r)) continue;
    const low = gpuLow(r.gpuCount);
    gpus += low;
    const cur = byBand.get(r.gpuCount) ?? { n: 0, gpus: 0 };
    cur.n++;
    cur.gpus += low;
    byBand.set(r.gpuCount, cur);
  }
  const peak = Math.max(1, ...[...byBand.values()].map((v) => v.gpus));
  const bands = [...byBand.entries()]
    .map(([band, v]) => ({ band, n: v.n, gpus: v.gpus, ratio: v.gpus / peak }))
    .sort((a, b) => b.gpus - a.gpus);
  return { bands, gpus };
}

/* --- grouping ----------------------------------------------------------- */

/** Count rows by whatever key the caller names. Nulls are dropped. */
export function tally<T>(rows: T[], key: (r: T) => string | null | undefined): Record<string, number> {
  const m: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r);
    if (k == null || k === "") continue;
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

/**
 * Where a row came from: the campaign it was tagged with, else the host that
 * referred it, else direct. Same precedence the store's own stats use, so the
 * filtered view and the global figures name a source the same way.
 */
export function sourceOf(r: Reservation): string {
  if (r.utmSource) return r.utmSource;
  if (!r.referrer) return "direct";
  try {
    return new URL(r.referrer).hostname.replace(/^www\./, "");
  } catch {
    return "referral";
  }
}

/* --- a ranked distribution, for any breakdown map ----------------------- */

export interface Slice {
  key: string;
  n: number;
  ratio: number;
}

export function ranked(m: Record<string, number>, limit = 6): Slice[] {
  const entries = Object.entries(m).sort((a, b) => b[1] - a[1]);
  const peak = Math.max(1, ...entries.map(([, n]) => n));
  return entries.slice(0, limit).map(([key, n]) => ({ key, n, ratio: n / peak }));
}

/* --- the state of the desk ---------------------------------------------- */

export interface Posture {
  open: number;
  unowned: number;
  stalled: number;
  /** Share of open rows that have an owner, or null when nothing is open. */
  coverage: number | null;
  /** Age in days of the oldest open row, or null when nothing is open. */
  oldestOpenDays: number | null;
  /** Median age in days of the open rows, or null when nothing is open. */
  medianOpenDays: number | null;
}

export function posture(rows: Reservation[]): Posture {
  const open = rows.filter(isOpen);
  const ages = open.map((r) => ageDays(r.createdAt)).sort((a, b) => a - b);
  const unowned = open.filter((r) => !r.owner).length;
  const stalled = open.filter((r) => ageDays(r.updatedAt) >= STALL_DAYS).length;
  return {
    open: open.length,
    unowned,
    stalled,
    // Null, not 100. There is no coverage of nothing, and a board reporting
    // a perfect score for an empty view is a board nobody should trust.
    coverage: open.length ? Math.round(((open.length - unowned) / open.length) * 100) : null,
    oldestOpenDays: ages.length ? ages[ages.length - 1] : null,
    medianOpenDays: ages.length ? ages[Math.floor(ages.length / 2)] : null,
  };
}

/* --- triage ------------------------------------------------------------- */

export type AttentionReason = "unowned" | "stalled" | "new" | "followup";

export interface Waiting {
  row: Reservation;
  reasons: AttentionReason[];
  /** Higher is more urgent. Age in days, weighted by tier and reason. */
  urgency: number;
  waitingDays: number;
}

const TIER_WEIGHT: Record<string, number> = { A: 2.2, B: 1.4, C: 1 };

/**
 * What somebody should pick up next.
 *
 * Urgency is how long it has been waiting, multiplied by the tier, plus a
 * fixed bump per reason. It is a sorting aid, not a score presented to
 * anyone as a judgement — the reasons are shown alongside so the ranking can
 * be argued with.
 */
export function attention(rows: Reservation[], limit = 5): Waiting[] {
  const out: Waiting[] = [];
  for (const r of rows) {
    if (!isOpen(r)) continue;
    const reasons: AttentionReason[] = [];
    const sinceTouch = ageDays(r.updatedAt);
    if (!r.owner) reasons.push("unowned");
    if (sinceTouch >= STALL_DAYS) reasons.push("stalled");
    if (r.status === "new") reasons.push("new");
    if (r.followupAt && r.status === "new") reasons.push("followup");
    if (reasons.length === 0) continue;
    const waitingDays = Math.max(sinceTouch, 0);
    out.push({
      row: r,
      reasons,
      waitingDays,
      urgency: (waitingDays + 1) * (TIER_WEIGHT[r.tier] ?? 1) + reasons.length * 1.5,
    });
  }
  return out.sort((a, b) => b.urgency - a.urgency).slice(0, limit);
}

/* --- the read on one row ------------------------------------------------ */

export type ReadKey =
  | "deliberate"
  | "quick"
  | "priced"
  | "estimated"
  | "struggled"
  | "noJs"
  | "returning"
  | "followed";

/**
 * What the row's own behaviour columns say about it.
 *
 * Observations, each one a direct restatement of a column, never a
 * prediction. "Read the page before submitting" means timeOnPageMs was over
 * two minutes; it does not mean they are going to buy.
 */
export function read(r: Reservation): ReadKey[] {
  const keys: ReadKey[] = [];
  if ((r.timeOnPageMs ?? 0) >= 120_000) keys.push("deliberate");
  else if (r.timeOnPageMs != null && r.timeOnPageMs < 30_000) keys.push("quick");
  if ((r.sourceClicks ?? 0) > 0) keys.push("priced");
  if (r.estimatorGpus != null) keys.push("estimated");
  if ((r.validationFailures ?? 0) > 1) keys.push("struggled");
  if (!r.jsEnabled) keys.push("noJs");
  if ((r.pagesViewed?.length ?? 0) > 1) keys.push("returning");
  if (r.followupAt) keys.push("followed");
  return keys;
}

/** Coarse strength of the read, for the one-word summary beside it. */
export function signal(r: Reservation): "strong" | "fair" | "weak" {
  if (r.tier === "A" || (r.followupAt && r.score >= 45)) return "strong";
  if (r.tier === "B" || r.score >= 30) return "fair";
  return "weak";
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
