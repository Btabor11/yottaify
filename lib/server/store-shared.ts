/**
 * THE STORE — one interface, two implementations.
 *
 *   DATABASE_URL set    → Postgres through Drizzle (store-pg.ts)
 *   unset               → JSON files under .data/ (store-file.ts)
 *
 * The pipeline, the API routes and the admin never know which one they have.
 * The file store exists so the whole system — receipt, reference, follow-up,
 * admin, export — is exercisable on a laptop with zero setup, and so a
 * misconfigured database in production degrades to "leads on disk" rather
 * than "leads gone". It is not a production store: Vercel's filesystem is
 * ephemeral. See DATA.md.
 */

import type {
  AnalyticsEventRow,
  NewAnalyticsEventRow,
  NewReservation,
  NewReservationEvent,
  Reservation,
  ReservationEvent,
  ReservationStatus,
} from "./schema";

export interface ListFilter {
  status?: ReservationStatus | "open" | "all";
  q?: string;
  tier?: "A" | "B" | "C";
  includeSpam?: boolean;
  limit?: number;
}

export interface Stats {
  total: number;
  open: number;
  spam: number;
  byStatus: Record<string, number>;
  byGpuCount: Record<string, number>;
  byWorkload: Record<string, number>;
  byStartMonth: Record<string, number>;
  byTier: Record<string, number>;
  bySource: Record<string, number>;
  /** Sum of the low end of every open request's GPU band. */
  gpusRequestedOpen: number;
  last7d: number;
  followupRate: number;
  jsDisabledCount: number;
  eventsTotal: number;
}

export interface Store {
  readonly kind: "postgres" | "file";
  createReservation(row: NewReservation): Promise<Reservation>;
  getReservation(id: string): Promise<Reservation | null>;
  getByReference(reference: string): Promise<Reservation | null>;
  getByIdempotencyKey(key: string): Promise<Reservation | null>;
  updateReservation(id: string, patch: Partial<NewReservation>): Promise<Reservation>;
  /**
   * Erase a reservation and its audit trail. Analytics events are keyed by
   * session, not by reservation, and carry no identity; they are left alone.
   * This is the code path behind "ask and we will delete it" in the policy.
   */
  deleteReservation(id: string): Promise<void>;
  listReservations(filter?: ListFilter): Promise<Reservation[]>;
  addEvent(ev: NewReservationEvent): Promise<ReservationEvent>;
  listEvents(reservationId: string): Promise<ReservationEvent[]>;
  recordAnalytics(rows: NewAnalyticsEventRow[]): Promise<void>;
  listAnalytics(sessionId: string): Promise<AnalyticsEventRow[]>;
  stats(): Promise<Stats>;
  /** Cheap liveness probe for the admin header. */
  ping(): Promise<boolean>;
}

export const OPEN_LIST = ["new", "contacted", "call_scheduled", "term_sheet", "contracted", "onboarding"] as const;

/** Low end of a GPU band, for summing. "1-2" → 1, "48+" → 48. */
export function gpuLow(band: string): number {
  const n = parseInt(band, 10);
  return Number.isFinite(n) ? n : 0;
}

/** The stats reducer is shared so both stores report identically. */
export function computeStats(rows: Reservation[], eventsTotal: number): Stats {
  const inc = (m: Record<string, number>, k: string) => {
    m[k] = (m[k] ?? 0) + 1;
  };
  const s: Stats = {
    total: 0,
    open: 0,
    spam: 0,
    byStatus: {},
    byGpuCount: {},
    byWorkload: {},
    byStartMonth: {},
    byTier: {},
    bySource: {},
    gpusRequestedOpen: 0,
    last7d: 0,
    followupRate: 0,
    jsDisabledCount: 0,
    eventsTotal,
  };
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  let followups = 0;
  const OPEN = new Set<string>(OPEN_LIST);
  for (const r of rows) {
    if (r.spam) {
      s.spam++;
      continue;
    }
    s.total++;
    inc(s.byStatus, r.status);
    inc(s.byGpuCount, r.gpuCount);
    inc(s.byWorkload, r.workload);
    inc(s.byStartMonth, r.startDate.slice(0, 7));
    inc(s.byTier, r.tier);
    inc(s.bySource, r.utmSource ?? (r.referrer ? safeHost(r.referrer) : "direct"));
    if (OPEN.has(r.status)) {
      s.open++;
      s.gpusRequestedOpen += gpuLow(r.gpuCount);
    }
    if (new Date(r.createdAt).getTime() >= weekAgo) s.last7d++;
    if (r.followupAt) followups++;
    if (!r.jsEnabled) s.jsDisabledCount++;
  }
  s.followupRate = s.total ? Math.round((followups / s.total) * 100) : 0;
  return s;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "referral";
  }
}
