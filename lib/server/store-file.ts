import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type {
  AnalyticsEventRow,
  NewAnalyticsEventRow,
  NewReservation,
  NewReservationEvent,
  Reservation,
  ReservationEvent,
} from "./schema";
import { computeStats, OPEN_LIST, type ListFilter, type Stats, type Store } from "./store-shared";

/**
 * JSON files under .data/ (gitignored). Same row shapes as Postgres, so the
 * admin and the pipeline are identical. Writes are serialised through a
 * promise chain because two concurrent form posts would otherwise race the
 * read-modify-write.
 *
 * For a laptop, a demo, or a broken DATABASE_URL. Not for production.
 */
export class FileStore implements Store {
  readonly kind = "file" as const;
  private dir = process.env.DATA_DIR ?? join(process.cwd(), ".data");
  private lock: Promise<unknown> = Promise.resolve();

  private file(name: string) {
    return join(this.dir, name);
  }

  private async ensure() {
    if (!existsSync(this.dir)) await mkdir(this.dir, { recursive: true });
  }

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.lock.then(fn, fn);
    this.lock = next.catch(() => undefined);
    return next;
  }

  private async readJson<T>(name: string, fallback: T): Promise<T> {
    await this.ensure();
    try {
      return JSON.parse(await readFile(this.file(name), "utf8"), reviveDates) as T;
    } catch {
      return fallback;
    }
  }

  private async readJsonl<T>(name: string): Promise<T[]> {
    await this.ensure();
    try {
      const raw = await readFile(this.file(name), "utf8");
      return raw
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l, reviveDates) as T);
    } catch {
      return [];
    }
  }

  private async all(): Promise<Reservation[]> {
    return this.readJson<Reservation[]>("reservations.json", []);
  }

  private async save(rows: Reservation[]) {
    await this.ensure();
    await writeFile(this.file("reservations.json"), JSON.stringify(rows, null, 2));
  }

  async createReservation(row: NewReservation): Promise<Reservation> {
    return this.serial(async () => {
      const rows = await this.all();
      const now = new Date();
      const r = { ...DEFAULTS, ...row, id: row.id ?? randomUUID(), createdAt: row.createdAt ?? now, updatedAt: now } as Reservation;
      rows.push(r);
      await this.save(rows);
      return r;
    });
  }

  async getReservation(id: string) {
    return (await this.all()).find((r) => r.id === id) ?? null;
  }

  async getByReference(reference: string) {
    return (await this.all()).find((r) => r.reference === reference) ?? null;
  }

  async getByIdempotencyKey(key: string) {
    return (await this.all()).find((r) => r.idempotencyKey === key) ?? null;
  }

  async updateReservation(id: string, patch: Partial<NewReservation>) {
    return this.serial(async () => {
      const rows = await this.all();
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error(`Reservation ${id} not found`);
      rows[i] = { ...rows[i], ...patch, updatedAt: new Date() } as Reservation;
      await this.save(rows);
      return rows[i];
    });
  }

  async deleteReservation(id: string) {
    await this.serial(async () => {
      const rows = await this.all();
      await this.save(rows.filter((r) => r.id !== id));
      const events = await this.readJsonl<ReservationEvent>("reservation_events.jsonl");
      const kept = events.filter((e) => e.reservationId !== id);
      await writeFile(this.file("reservation_events.jsonl"), kept.map((e) => JSON.stringify(e)).join("\n") + (kept.length ? "\n" : ""));
    });
  }

  async listReservations(filter: ListFilter = {}) {
    let rows = await this.all();
    if (!filter.includeSpam) rows = rows.filter((r) => !r.spam);
    if (filter.status && filter.status !== "all") {
      rows =
        filter.status === "open"
          ? rows.filter((r) => (OPEN_LIST as readonly string[]).includes(r.status))
          : rows.filter((r) => r.status === filter.status);
    }
    if (filter.tier) rows = rows.filter((r) => r.tier === filter.tier);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      rows = rows.filter((r) =>
        [r.company, r.name, r.email, r.reference, r.notes ?? ""].some((v) => v.toLowerCase().includes(q)),
      );
    }
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows.slice(0, filter.limit ?? 500);
  }

  async addEvent(ev: NewReservationEvent) {
    const e = { id: randomUUID(), createdAt: new Date(), payload: null, ...ev } as ReservationEvent;
    await this.ensure();
    await appendFile(this.file("reservation_events.jsonl"), JSON.stringify(e) + "\n");
    return e;
  }

  async listEvents(reservationId: string) {
    const all = await this.readJsonl<ReservationEvent>("reservation_events.jsonl");
    return all
      .filter((e) => e.reservationId === reservationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async recordAnalytics(rows: NewAnalyticsEventRow[]) {
    if (!rows.length) return;
    await this.ensure();
    const lines = rows.map((r) => JSON.stringify({ id: randomUUID(), createdAt: new Date(), ...r })).join("\n") + "\n";
    await appendFile(this.file("events.jsonl"), lines);
  }

  async listAnalytics(sessionId: string) {
    const all = await this.readJsonl<AnalyticsEventRow>("events.jsonl");
    return all.filter((e) => e.sessionId === sessionId).slice(0, 500);
  }

  async stats(): Promise<Stats> {
    const [rows, ev] = await Promise.all([this.all(), this.readJsonl<AnalyticsEventRow>("events.jsonl")]);
    return computeStats(rows, ev.length);
  }

  async ping() {
    try {
      await this.ensure();
      return true;
    } catch {
      return false;
    }
  }
}

/** Column defaults the database would apply. */
const DEFAULTS = {
  notes: null,
  role: null,
  phone: null,
  teamSize: null,
  currentProvider: null,
  currentSpend: null,
  termInterest: null,
  durationMonths: null,
  storageNeeds: null,
  dataMovement: null,
  compliance: null,
  decisionTimeframe: null,
  heardFrom: null,
  dealbreakers: null,
  followupAt: null,
  path: null,
  referrer: null,
  landingPath: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  utmTerm: null,
  utmContent: null,
  userAgent: null,
  ipHash: null,
  country: null,
  region: null,
  city: null,
  locale: null,
  timezone: null,
  viewportW: null,
  viewportH: null,
  screenW: null,
  screenH: null,
  dpr: null,
  deviceClass: null,
  reducedMotion: null,
  colorScheme: null,
  jsEnabled: true,
  sessionId: null,
  timeOnPageMs: null,
  formFillMs: null,
  validationFailures: null,
  estimatorGpus: null,
  estimatorHours: null,
  sectionsViewed: null,
  pagesViewed: null,
  sourceClicks: null,
  status: "new",
  tier: "C",
  score: 0,
  spam: false,
  spamReason: null,
  owner: null,
  internalNotes: null,
  receiptSentAt: null,
  notifySentAt: null,
  webhookSentAt: null,
  idempotencyKey: null,
} satisfies Partial<Reservation>;

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function reviveDates(_k: string, v: unknown) {
  return typeof v === "string" && ISO.test(v) ? new Date(v) : v;
}
