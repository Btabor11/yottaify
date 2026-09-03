/**
 * How much JavaScript does each route actually require before it is
 * interactive?
 *
 *   npx next build && npx next start --port 4320
 *   node scripts/critical.mjs
 *
 * `perf.mjs` splits JS by whether a response arrived before or after the load
 * event, which makes a fast route look like it defers more than a slow one
 * purely because its load event fired sooner. This measures the honest split
 * instead: bytes referenced by script tags in the server-rendered HTML are on
 * the critical path, and anything a dynamic import pulls in afterwards is not.
 *
 * Dev-only tooling. Not part of the shipped site.
 */
const PORT = process.env.PORT ?? "4320";
const base = `http://127.0.0.1:${PORT}`;
const ROUTES = ["/d1", "/d1/pricing", "/d2", "/d2/pricing", "/d3", "/d3/pricing"];

const sizes = new Map();
async function sizeOf(url) {
  if (!sizes.has(url)) {
    const body = await fetch(base + url).then((r) => r.arrayBuffer());
    sizes.set(url, body.byteLength);
  }
  return sizes.get(url);
}

const kb = (n) => `${Math.round(n / 1024)}k`;
const rows = [];

for (const route of ROUTES) {
  const html = await fetch(base + route).then((r) => r.text());

  // Every script the document itself asks for. These block interactivity.
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((s) => s.startsWith("/"));
  let critical = 0;
  for (const src of new Set(srcs)) critical += await sizeOf(src);

  // Chunks the flight payload names for later. Next inlines these as strings
  // in the RSC stream, so they appear in the HTML without a script tag.
  const lazy = [...html.matchAll(/static\/chunks\/[\w.-]+\.js/g)].map((m) => `/_next/${m[0]}`);
  let deferred = 0;
  for (const src of new Set(lazy)) if (!srcs.includes(src)) deferred += await sizeOf(src);

  rows.push({ route, critical, deferred, scripts: new Set(srcs).size, html: html.length });
}

console.log("\n  Uncompressed bytes, from the production server\n");
console.log("  route          critical   deferred   files    HTML");
for (const r of rows)
  console.log(
    `  ${r.route.padEnd(14)}${kb(r.critical).padStart(8)}${kb(r.deferred).padStart(11)}${String(r.scripts).padStart(8)}${kb(r.html).padStart(8)}`,
  );
console.log("\n  critical = referenced by a script tag in the HTML");
console.log("  deferred = reached only through a dynamic import\n");
