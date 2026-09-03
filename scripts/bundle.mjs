/**
 * Reads the prerendered HTML and reports what each route actually asks the
 * browser to fetch before it can paint — and, separately, which chunks exist
 * but are only reachable through a runtime import.
 *
 * node scripts/bundle.mjs   (after `next build`)
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PAGES = ["d1", "d2", "d3", "d1/pricing", "d2/pricing", "d3/pricing"];
const CHUNK_DIR = ".next/static/chunks";

const sizeOf = (url) => {
  const p = join(".next", url.replace(/^\/_next\//, ""));
  return existsSync(p) ? statSync(p).size : 0;
};

// Which chunk holds three.js, so we can say plainly whether it is on the
// critical path or behind an idle-time import.
const allChunks = [];
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".js")) allChunks.push(p);
  }
})(CHUNK_DIR);

const threeChunks = allChunks.filter((p) => {
  const src = readFileSync(p, "utf8");
  return /WebGLRenderer|THREE\.REVISION|isMesh|BufferGeometry/.test(src);
});

console.log(`\n  three.js lives in ${threeChunks.length} chunk(s):`);
for (const c of threeChunks) console.log(`    ${(statSync(c).size / 1024).toFixed(0).padStart(5)} KB  ${c.replace(CHUNK_DIR + "/", "")}`);

const kb = (n) => (n / 1024).toFixed(0);
console.log("\n  route          eager JS   eager chunks   three.js eager?");
for (const page of PAGES) {
  const file = `.next/server/app/${page}.html`;
  if (!existsSync(file)) {
    console.log(`  ${page.padEnd(13)} (not prerendered)`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const urls = new Set([
    ...[...html.matchAll(/(?:src|href)="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]),
  ]);
  const total = [...urls].reduce((a, u) => a + sizeOf(u), 0);
  const threeEager = [...urls].some((u) => threeChunks.some((c) => c.endsWith(u.split("/").pop())));
  console.log(
    `  ${page.padEnd(13)} ${kb(total).padStart(6)} KB ${String(urls.size).padStart(9)}       ${threeEager ? "YES — on the critical path" : "no — loaded on idle"}`,
  );
}
console.log("\n  Sizes are uncompressed. Divide by ~3.2 for the gzipped wire cost.");

// What is actually in the eager payload, largest first, with a guess at the
// library each chunk carries so the number is actionable rather than scary.
const FINGERPRINTS = [
  [/ScrollTrigger|gsap|_gsapVersion/, "gsap + ScrollTrigger"],
  [/lenis|Lenis/, "lenis"],
  [/WebGLRenderer|THREE\.REVISION/, "three.js"],
  [/react-dom|__SECRET_INTERNALS/, "react-dom"],
  [/framer-motion|motion-dom/, "motion"],
  [/zod|ZodError/, "zod"],
  [/next\/dist\/client|__NEXT_DATA__|next-route-announcer/, "next client runtime"],
];

const route = process.argv[2] ?? "d1";
const html = readFileSync(`.next/server/app/${route}.html`, "utf8");
const urls = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map((m) => m[1]))];
console.log(`\n  /${route} eager payload, largest first:\n`);
for (const u of urls.map((u) => ({ u, size: sizeOf(u) })).sort((a, b) => b.size - a.size)) {
  const p = join(".next", u.u.replace(/^\/_next\//, ""));
  const src = existsSync(p) ? readFileSync(p, "utf8") : "";
  const tags = FINGERPRINTS.filter(([re]) => re.test(src)).map(([, name]) => name);
  console.log(`    ${kb(u.size).padStart(5)} KB  ${u.u.split("/").pop().padEnd(22)} ${tags.join(", ")}`);
}
console.log("");
