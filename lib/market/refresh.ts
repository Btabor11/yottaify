import { randomUUID } from "node:crypto";
import { SOURCES } from "./sources";
import { buildSnapshot, utcDay } from "./digest";
import type { RunSummary, Snapshot, SourceResult } from "./types";

/**
 * One run: every source in parallel, each isolated, with a per-source timeout
 * on top of the fetch timeout so a hung parser cannot hold the cron open.
 * Returns the raw results (stored for audit) and the digested snapshot.
 */
export async function runRefresh(opts: { day?: string; only?: string[] } = {}): Promise<{ results: SourceResult[]; snapshot: Snapshot }> {
  const startedAt = new Date().toISOString();
  const runId = randomUUID();
  const sources = opts.only?.length ? SOURCES.filter((s) => opts.only!.includes(s.meta.id)) : SOURCES;

  const results = await Promise.all(
    sources.map(async (s): Promise<SourceResult> => {
      const t0 = Date.now();
      if (s.meta.declined) return { source: s.meta, observations: [], durationMs: 0 };
      try {
        const observations = await withTimeout(s.fetch(), 40_000, s.meta.id);
        return { source: s.meta, observations, durationMs: Date.now() - t0 };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const stage: "fetch" | "parse" = /HTTP \d|fetch|abort|timeout|ECONN|ENOTFOUND/i.test(message) ? "fetch" : "parse";
        return { source: s.meta, observations: [], error: { message, stage }, durationMs: Date.now() - t0 };
      }
    }),
  );

  const finishedAt = new Date().toISOString();
  const run: RunSummary = {
    runId,
    startedAt,
    finishedAt,
    sourcesOk: results.filter((r) => !r.error && !r.source.declined).length,
    sourcesFailed: results.filter((r) => r.error).length,
    observations: results.reduce((n, r) => n + r.observations.length, 0),
  };
  const snapshot = buildSnapshot(results, opts.day ?? utcDay(), run);
  return { results, snapshot };
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}: source timeout after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
