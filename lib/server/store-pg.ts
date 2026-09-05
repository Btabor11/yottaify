import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  events,
  reservationEvents,
  reservations,
  type AnalyticsEventRow,
  type NewAnalyticsEventRow,
  type NewReservation,
  type NewReservationEvent,
  type Reservation,
} from "./schema";
import { computeStats, OPEN_LIST, type ListFilter, type Stats, type Store } from "./store-shared";

/** Postgres, through Drizzle. Any provider that speaks the wire protocol. */
export class PgStore implements Store {
  readonly kind = "postgres" as const;
  private get d() {
    const d = db();
    if (!d) throw new Error("DATABASE_URL is not set");
    return d;
  }

  async createReservation(row: NewReservation): Promise<Reservation> {
    const [r] = await this.d.insert(reservations).values(row).returning();
    return r;
  }

  async getReservation(id: string) {
    const [r] = await this.d.select().from(reservations).where(eq(reservations.id, id)).limit(1);
    return r ?? null;
  }

  async getByReference(reference: string) {
    const [r] = await this.d.select().from(reservations).where(eq(reservations.reference, reference)).limit(1);
    return r ?? null;
  }

  async getByIdempotencyKey(key: string) {
    const [r] = await this.d.select().from(reservations).where(eq(reservations.idempotencyKey, key)).limit(1);
    return r ?? null;
  }

  async updateReservation(id: string, patch: Partial<NewReservation>) {
    const [r] = await this.d
      .update(reservations)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(reservations.id, id))
      .returning();
    if (!r) throw new Error(`Reservation ${id} not found`);
    return r;
  }

  async deleteReservation(id: string) {
    // reservation_events cascades on delete (see schema).
    await this.d.delete(reservations).where(eq(reservations.id, id));
  }

  async listReservations(filter: ListFilter = {}) {
    const conds = [];
    if (!filter.includeSpam) conds.push(eq(reservations.spam, false));
    if (filter.status && filter.status !== "all") {
      if (filter.status === "open") conds.push(inArray(reservations.status, OPEN_LIST));
      else conds.push(eq(reservations.status, filter.status));
    }
    if (filter.tier) conds.push(eq(reservations.tier, filter.tier));
    if (filter.q) {
      const like = `%${filter.q}%`;
      conds.push(
        or(
          ilike(reservations.company, like),
          ilike(reservations.name, like),
          ilike(reservations.email, like),
          ilike(reservations.reference, like),
          ilike(reservations.notes, like),
        )!,
      );
    }
    return this.d
      .select()
      .from(reservations)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(reservations.createdAt))
      .limit(filter.limit ?? 500);
  }

  async addEvent(ev: NewReservationEvent) {
    const [e] = await this.d.insert(reservationEvents).values(ev).returning();
    return e;
  }

  async listEvents(reservationId: string) {
    return this.d
      .select()
      .from(reservationEvents)
      .where(eq(reservationEvents.reservationId, reservationId))
      .orderBy(desc(reservationEvents.createdAt));
  }

  async recordAnalytics(rows: NewAnalyticsEventRow[]) {
    if (!rows.length) return;
    await this.d.insert(events).values(rows);
  }

  async listAnalytics(sessionId: string): Promise<AnalyticsEventRow[]> {
    return this.d.select().from(events).where(eq(events.sessionId, sessionId)).orderBy(events.createdAt).limit(500);
  }

  async stats(): Promise<Stats> {
    const rows = await this.d.select().from(reservations);
    const [{ n }] = await this.d.select({ n: sql<number>`count(*)::int` }).from(events);
    return computeStats(rows, Number(n));
  }

  async ping() {
    try {
      await this.d.execute(sql`select 1`);
      return true;
    } catch {
      return false;
    }
  }
}
