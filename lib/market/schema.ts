import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Observation, Snapshot, SourceResult } from "./types";

/**
 * Market tables. Kept apart from lib/server/schema.ts on purpose: that file is
 * the lead pipeline and has its own migration history. These tables are
 * created idempotently by the store (CREATE TABLE IF NOT EXISTS) so the
 * tracker works on any database the site already has, with no migration step.
 *
 * Adding this file to drizzle.config.ts `schema` is the tidy long-term move.
 */

export const marketRuns = pgTable(
  "market_runs",
  {
    id: uuid("id").primaryKey(),
    day: text("day").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }).notNull(),
    sourcesOk: integer("sources_ok").notNull(),
    sourcesFailed: integer("sources_failed").notNull(),
    observations: integer("observations").notNull(),
    /** Full per-source results, including errors, for audit. */
    results: jsonb("results").$type<SourceResult[]>().notNull(),
  },
  (t) => [index("market_runs_day_idx").on(t.day)],
);

export const marketObservations = pgTable(
  "market_observations",
  {
    id: uuid("id").primaryKey(),
    runId: uuid("run_id").notNull(),
    day: text("day").notNull(),
    sourceId: text("source_id").notNull(),
    provider: text("provider").notNull(),
    term: text("term").notNull(),
    usdPerGpuHour: text("usd_per_gpu_hour"),
    stock: text("stock").notNull(),
    row: jsonb("row").$type<Observation>().notNull(),
  },
  (t) => [index("market_obs_day_idx").on(t.day), index("market_obs_provider_idx").on(t.provider, t.day)],
);

export const marketSnapshots = pgTable("market_snapshots", {
  /** One row per UTC day; a re-run on the same day replaces it. */
  day: text("day").primaryKey(),
  runId: uuid("run_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  snapshot: jsonb("snapshot").$type<Snapshot>().notNull(),
});

export const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS market_runs (
  id uuid PRIMARY KEY, day text NOT NULL, started_at timestamptz NOT NULL, finished_at timestamptz NOT NULL,
  sources_ok integer NOT NULL, sources_failed integer NOT NULL, observations integer NOT NULL, results jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS market_runs_day_idx ON market_runs (day);
CREATE TABLE IF NOT EXISTS market_observations (
  id uuid PRIMARY KEY, run_id uuid NOT NULL, day text NOT NULL, source_id text NOT NULL, provider text NOT NULL,
  term text NOT NULL, usd_per_gpu_hour text, stock text NOT NULL, row jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS market_obs_day_idx ON market_observations (day);
CREATE INDEX IF NOT EXISTS market_obs_provider_idx ON market_observations (provider, day);
CREATE TABLE IF NOT EXISTS market_snapshots (
  day text PRIMARY KEY, run_id uuid NOT NULL, created_at timestamptz NOT NULL, snapshot jsonb NOT NULL);
`;
