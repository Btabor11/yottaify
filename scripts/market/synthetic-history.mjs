/**
 * DEV ONLY. Writes N days of clearly-labelled synthetic snapshots into the
 * file store so the /market page's time scrubber can be exercised before the
 * tracker has real history. Refuses to run against a database or in
 * production. Every synthetic snapshot carries `synthetic: true` and the page
 * badges it. Delete .data/market/ to clear.
 *
 *   node --experimental-strip-types --import ./scripts/alias-loader.mjs scripts/market/synthetic-history.mjs 30
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL) {
  console.error("refusing: synthetic history is for the local file store only");
  process.exit(1);
}
const days = Number(process.argv[2] ?? 30);
const dir = join(process.cwd(), ".data", "market");
await mkdir(dir, { recursive: true });

// Base on today's real snapshot if one exists, so providers and shapes are real.
const files = (await import("node:fs")).readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
if (!files.length) {
  console.error("run `npm run market:refresh` first so there is a real snapshot to base the synthetic history on");
  process.exit(1);
}
const base = JSON.parse(await readFile(join(dir, files.at(-1)), "utf8"));
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

for (let i = days; i >= 1; i--) {
  const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
  const drift = 1 + (rnd() - 0.5) * 0.08;
  const snap = structuredClone(base);
  snap.day = d;
  snap.synthetic = true;
  snap.run = { ...snap.run, runId: `synthetic-${d}`, startedAt: `${d}T06:17:00.000Z`, finishedAt: `${d}T06:17:40.000Z` };
  for (const p of snap.providers) {
    const j = 1 + (rnd() - 0.5) * 0.06;
    if (p.published) p.published.usdPerGpuHour = +(p.published.usdPerGpuHour * drift * j).toFixed(3);
    for (const r of p.reported) r.usdPerGpuHour = +(r.usdPerGpuHour * drift * (1 + (rnd() - 0.5) * 0.1)).toFixed(3);
    const figs = [p.published?.usdPerGpuHour, ...p.reported.map((r) => r.usdPerGpuHour)].filter((x) => x != null);
    p.low = figs.length ? Math.min(...figs) : null;
    p.high = figs.length ? Math.max(...figs) : null;
    p.spread = figs.length >= 2 ? (p.high - p.low) / p.low : null;
    if (rnd() < 0.15 && p.stock !== "not-reported") p.stock = ["in-stock", "limited", "out-of-stock"][Math.floor(rnd() * 3)];
  }
  if (snap.inStock) snap.inStock.count = Math.max(4, Math.min(snap.inStock.total, Math.round(snap.inStock.count + (rnd() - 0.5) * 8)));
  snap.legibility = { ...snap.legibility, index: Math.max(20, Math.min(90, Math.round(snap.legibility.index + (rnd() - 0.5) * 20))) };
  snap.medianOnDemand = +(snap.medianOnDemand * drift).toFixed(2);
  await writeFile(join(dir, `${d}.json`), JSON.stringify(snap, null, 2));
}
console.log(`wrote ${days} synthetic days before ${files.at(-1).slice(0, 10)} — labelled synthetic; delete .data/market to clear`);
