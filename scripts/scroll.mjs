/**
 * Does the page hold a frame budget while someone actually scrolls it?
 *
 *   npx next build && npx next start --port 4320
 *   node scripts/scroll.mjs
 *
 * Every direction animates something on scroll, and two of them drive colour
 * from scroll position, which is the expensive kind. Sitting still says
 * nothing about that. This scrolls the page the way a reader does and reports
 * the frame interval distribution, so a dropped-frame problem shows up as a
 * number rather than a feeling.
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { assertHardware, launchGpu } from "./launch.mjs";

const PORT = process.env.PORT ?? "4320";
const base = `http://127.0.0.1:${PORT}`;
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];
const CPU_SLOWDOWN = 4;

const browser = await launchGpu();
const hw = await assertHardware(browser);
const rows = [];

// REDUCE=1 measures the same scroll with every motion system switched off,
// which is the floor: whatever it costs to paint these pages at all.
const reduce = process.env.REDUCE === "1";

// A single pass swings wildly — scene compiles land in different places and
// the host machine is not a lab. Three passes, median reported.
const RUNS = Number(process.env.RUNS ?? 3);

for (const route of ROUTES) {
  const samples = [];
  for (let run = 0; run < RUNS; run++) {
  await fetch(base + route).then((r) => r.text());
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduce ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });

  await page.goto(base + route, { waitUntil: "load" });
  // Let deferred scene work finish so we measure the steady state, not the
  // one-off compile.
  await page.waitForTimeout(4000);

  const result = await page.evaluate(async () => {
    const gaps = [];
    let last = performance.now();
    let running = true;
    const tick = (now) => {
      gaps.push(now - last);
      last = now;
      if (running) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // A steady read-through: roughly one viewport per 400ms for 6 seconds.
    const step = Math.round(window.innerHeight * 0.55);
    const started = performance.now();
    while (performance.now() - started < 6000) {
      window.scrollBy(0, step);
      await new Promise((r) => setTimeout(r, 220));
    }
    running = false;
    await new Promise((r) => setTimeout(r, 120));

    // Drop the first few, which include the observer warming up.
    const s = gaps.slice(5).sort((a, b) => a - b);
    const at = (q) => Math.round(s[Math.min(s.length - 1, Math.floor(s.length * q))] ?? 0);
    return {
      frames: s.length,
      median: at(0.5),
      p95: at(0.95),
      worst: Math.round(s.at(-1) ?? 0),
      // A frame is "dropped" if it took longer than two 60Hz intervals.
      dropped: s.filter((g) => g > 33).length,
      scrolled: Math.round(window.scrollY),
    };
  });

  samples.push(result);
  await context.close();
  }

  const mid = (key) => {
    const s = samples.map((x) => x[key]).sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  rows.push({
    route,
    frames: mid("frames"),
    median: mid("median"),
    p95: mid("p95"),
    worst: mid("worst"),
    dropped: mid("dropped"),
    // The spread across passes, so a noisy result is visible as noisy.
    spread: Math.max(...samples.map((s) => s.median)) - Math.min(...samples.map((s) => s.median)),
  });
}

await browser.close();

console.log(
  `\n  Frame intervals while scrolling · 4x CPU throttle · 1440x900 · median of ${RUNS}${reduce ? " · reduced motion" : ""}\n`,
);
console.log("  route         frames  median     p95   worst   >33ms  spread");
for (const r of rows)
  console.log(
    `  ${r.route.padEnd(13)}${String(r.frames).padStart(6)}${String(r.median + "ms").padStart(8)}${String(r.p95 + "ms").padStart(8)}${String(r.worst + "ms").padStart(8)}${String(`${Math.round((r.dropped / r.frames) * 100)}%`).padStart(8)}${String(r.spread + "ms").padStart(8)}`,
  );
console.log("\n  16ms is one 60Hz frame. Median at or near 16ms means the scroll is smooth.");
console.log(`  renderer: ${hw.renderer}${hw.software ? "  ← SOFTWARE, WebGL cost is not representative" : ""}\n`);
