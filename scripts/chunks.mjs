/**
 * What is actually inside the JavaScript each route loads?
 *
 *   npx next build && npx next start --port 4320
 *   node scripts/chunks.mjs [route]
 *
 * Lists the script-tag chunks for a route by size, both raw and gzipped, and
 * fingerprints each one against the libraries we care about so it is obvious
 * which dependency is responsible for a number. Dev-only tooling.
 */
import { gzipSync, brotliCompressSync } from "node:zlib";

const PORT = process.env.PORT ?? "4320";
const base = `http://127.0.0.1:${PORT}`;
const ROUTES = process.argv[2] ? [process.argv[2]] : ["/d1", "/d2", "/d3"];

// Strings that only appear if the library itself is in the bundle.
const FINGERPRINTS = [
  ["three", /THREE\.WebGLRenderer|WebGLRenderer:|BufferGeometry\b/],
  ["r3f", /react-three-fiber|@react-three\/fiber|useThree/],
  ["drei", /@react-three\/drei|drei/],
  ["gsap", /gsap|ScrollTrigger/],
  ["lenis", /lenis|Lenis/],
  ["motion", /framer-motion|motion-dom|animateValue/],
  ["zod", /zod|ZodError|\$ZodError/],
  ["react-dom", /react-dom|__SECRET_INTERNALS/],
];

const kb = (n) => `${Math.round(n / 1024)}k`;

for (const route of ROUTES) {
  const html = await fetch(base + route).then((r) => r.text());
  const srcs = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]))].filter((s) =>
    s.startsWith("/"),
  );

  const rows = [];
  for (const src of srcs) {
    const buf = Buffer.from(await fetch(base + src).then((r) => r.arrayBuffer()));
    const text = buf.toString("utf8");
    rows.push({
      src: src.replace("/_next/static/chunks/", "").replace("/_next/static/", ""),
      raw: buf.length,
      gz: gzipSync(buf).length,
      br: brotliCompressSync(buf).length,
      has: FINGERPRINTS.filter(([, re]) => re.test(text)).map(([name]) => name),
    });
  }
  rows.sort((a, b) => b.raw - a.raw);

  const total = rows.reduce((s, r) => s + r.raw, 0);
  const totalBr = rows.reduce((s, r) => s + r.br, 0);
  console.log(`\n  ${route} — ${kb(total)} raw, ${kb(totalBr)} brotli, ${rows.length} files\n`);
  console.log("    raw     gzip  brotli  chunk");
  for (const r of rows)
    console.log(
      `  ${kb(r.raw).padStart(5)}${kb(r.gz).padStart(9)}${kb(r.br).padStart(8)}  ${r.src.slice(0, 34).padEnd(34)} ${r.has.join(" ")}`,
    );
}
console.log();
