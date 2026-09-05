import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { desc, gte, sql } from "drizzle-orm";
import { db, hasDatabase } from "@/lib/server/db";
import { CREATE_SQL, marketObservations, marketRuns, marketSnapshots } from "./schema";
import type { Snapshot, SourceResult } from "./types";

/**
 * Persistence for the tracker. Same split as the lead store: Postgres when
 * DATABASE_URL is set, JSON files under .data/market/ otherwise. Both expose
 * the same three calls, and the page only ever reads snapshots.
 */
export interface MarketStore {
  kind: "pg" | "file";
  saveRun(results: SourceResult[], snapshot: Snapshot): Promise<void>;
  latest(): Promise<Snapshot | null>;
  /** Snapshots for the last N days, oldest first. */
  history(days: number): Promise<Snapshot[]>;
}

class PgMarketStore implements MarketStore {
  readonly kind = "pg" as const;
  private ready: Promise<void> | null = null;

  private ensure() {
    this.ready ??= (async () => {
      const d = db()!;
      for (const stmt of CREATE_SQL.split(";").map((s) => s.trim()).filter(Boolean)) await d.execute(sql.raw(stmt));
    })();
    return this.ready;
  }

  async saveRun(results: SourceResult[], snapshot: Snapshot) {
    await this.ensure();
    const d = db()!;
    const runId = snapshot.run.runId;
    await d.insert(marketRuns).values({
      id: runId,
      day: snapshot.day,
      startedAt: new Date(snapshot.run.startedAt),
      finishedAt: new Date(snapshot.run.finishedAt),
      sourcesOk: snapshot.run.sourcesOk,
      sourcesFailed: snapshot.run.sourcesFailed,
      observations: snapshot.run.observations,
      results,
    });
    const rows = results.flatMap((r) =>
      r.observations.map((o) => ({
        id: randomUUID(),
        runId,
        day: snapshot.day,
        sourceId: o.sourceId,
        provider: o.provider,
        term: o.term,
        usdPerGpuHour: o.usdPerGpuHour == null ? null : String(o.usdPerGpuHour),
        stock: o.stock,
        row: o,
      })),
    );
    if (rows.length) await d.insert(marketObservations).values(rows);
    await d
      .insert(marketSnapshots)
      .values({ day: snapshot.day, runId, createdAt: new Date(), snapshot })
      .onConflictDoUpdate({ target: marketSnapshots.day, set: { runId, createdAt: new Date(), snapshot } });
  }

  async latest() {
    await this.ensure();
    const rows = await db()!.select().from(marketSnapshots).orderBy(desc(marketSnapshots.day)).limit(1);
    return rows[0]?.snapshot ?? null;
  }

  async history(days: number) {
    await this.ensure();
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const rows = await db()!.select().from(marketSnapshots).where(gte(marketSnapshots.day, since)).orderBy(marketSnapshots.day);
    return rows.map((r) => r.snapshot);
  }
}

class FileMarketStore implements MarketStore {
  readonly kind = "file" as const;
  private dir = join(process.env.DATA_DIR ?? join(process.cwd(), ".data"), "market");

  private async ensure() {
    if (!existsSync(this.dir)) await mkdir(this.dir, { recursive: true });
  }

  async saveRun(results: SourceResult[], snapshot: Snapshot) {
    await this.ensure();
    await writeFile(join(this.dir, `${snapshot.day}.json`), JSON.stringify(snapshot, null, 2));
    await writeFile(join(this.dir, `${snapshot.day}.run.json`), JSON.stringify({ run: snapshot.run, results }, null, 2));
  }

  private async days(): Promise<string[]> {
    await this.ensure();
    return (await readdir(this.dir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)).sort();
  }

  async latest() {
    const ds = await this.days();
    const last = ds.at(-1);
    return last ? (JSON.parse(await readFile(join(this.dir, `${last}.json`), "utf8")) as Snapshot) : null;
  }

  async history(days: number) {
    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const ds = (await this.days()).filter((d) => d >= since);
    return Promise.all(ds.map(async (d) => JSON.parse(await readFile(join(this.dir, `${d}.json`), "utf8")) as Snapshot));
  }
}

let instance: MarketStore | null = null;
export function getMarketStore(): MarketStore {
  instance ??= hasDatabase() ? new PgMarketStore() : new FileMarketStore();
  return instance;
}
