/**
 * Run the market refresh locally and store the result (Postgres if DATABASE_URL
 * is set, else .data/market/). Same code path as the cron.
 *
 *   npm run market:refresh              # all sources
 *   npm run market:refresh -- runpod    # one source
 */
import { runRefresh } from "../../lib/market/refresh.ts";
import { getMarketStore } from "../../lib/market/store.ts";
import { OUR_RATE } from "../../content/pricing.ts";

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const store = getMarketStore();
const { results, snapshot } = await runRefresh({ ourRate: OUR_RATE, only });
await store.saveRun(results, snapshot);

const L = snapshot.legibility;
console.log(`stored ${snapshot.day} → ${store.kind}`);
console.log(`${snapshot.run.sourcesOk} ok / ${snapshot.run.sourcesFailed} failed · ${snapshot.run.observations} observations`);
console.log(`legibility ${L.index}/100 · median $${snapshot.medianOnDemand?.toFixed(2)} · lowest bookable $${snapshot.lowestBookable?.usdPerGpuHour ?? "—"} (${snapshot.lowestBookable?.provider ?? "—"})`);
for (const s of snapshot.sources.filter((s) => s.state === "error")) console.log(`  FAIL ${s.id}: ${s.error}`);
