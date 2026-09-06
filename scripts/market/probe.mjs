/**
 * Live probe: run every market source once and print what came back, without
 * writing anything. For checking parsers after a provider changes their page.
 *
 *   npm run market:probe            # all sources
 *   npm run market:probe -- runpod  # one
 */
import { runRefresh } from "../../lib/market/refresh.ts";

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const { results, snapshot } = await runRefresh({ only });

for (const r of results) {
  const tag = r.source.declined ? "declined" : r.error ? "FAIL   " : "ok     ";
  console.log(`\n${tag} ${r.source.id.padEnd(14)} ${String(r.durationMs).padStart(5)}ms  ${r.observations.length} obs${r.error ? `  — ${r.error.stage}: ${r.error.message}` : ""}`);
  for (const o of r.observations) {
    const price = o.usdPerGpuHour == null ? `(${o.fetchability})` : `$${o.usdPerGpuHour.toFixed(3)}`;
    console.log(`         ${o.provider.padEnd(16)} ${o.term.padEnd(10)} ${price.padEnd(10)} ${o.stock.padEnd(13)} ${o.variant ?? ""}`);
  }
}

console.log("\n--- digest ---");
console.log(`day ${snapshot.day} · ${snapshot.run.sourcesOk} ok / ${snapshot.run.sourcesFailed} failed · ${snapshot.run.observations} observations`);
console.log(`median on-demand $${snapshot.medianOnDemand?.toFixed(2)} · lowest listed $${snapshot.lowestListed?.usdPerGpuHour} (${snapshot.lowestListed?.provider} via ${snapshot.lowestListed?.sourceId}) · lowest bookable $${snapshot.lowestBookable?.usdPerGpuHour} (${snapshot.lowestBookable?.provider} via ${snapshot.lowestBookable?.sourceId})`);
if (snapshot.inStock) console.log(`in stock: ${snapshot.inStock.count} of ${snapshot.inStock.total} configs, ${snapshot.inStock.providers} providers`);
const L = snapshot.legibility;
console.log(`legibility ${L.index}/100 — agreement ${L.agreement} · coverage ${L.coverage} · visibility ${L.visibility} · bookable ${L.bookable} · compared ${L.comparedProviders}`);
console.log("\nprovider          published   reported                 spread");
for (const p of snapshot.providers) {
  const pub = p.published ? `$${p.published.usdPerGpuHour.toFixed(2)}` : `(${p.publishedState})`;
  const rep = p.reported.map((r) => `${r.sourceId}:$${r.usdPerGpuHour.toFixed(2)}`).join(" ");
  console.log(`${p.label.padEnd(17)} ${pub.padEnd(11)} ${rep.padEnd(40)} ${p.spread == null ? "—" : (p.spread * 100).toFixed(1) + "%"}   ${p.stock}`);
}
