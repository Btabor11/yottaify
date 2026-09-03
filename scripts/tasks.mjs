/**
 * When does the main thread block, relative to the moments a visitor notices?
 *
 *   npx next build && npx next start --port 4320
 *   node scripts/tasks.mjs
 *
 * Total blocking time is a single number that hides the thing that matters:
 * a long task before the page is usable hurts, and one scheduled deliberately
 * at idle afterwards mostly does not. This lists every long task with its
 * position relative to LCP and the load event. Dev-only tooling.
 */
import { assertHardware, launchGpu } from "./launch.mjs";

const PORT = process.env.PORT ?? "4320";
const base = `http://127.0.0.1:${PORT}`;
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : ["/d1", "/d2", "/d3"];
const CPU_SLOWDOWN = 4;

const browser = await launchGpu();

for (const route of ROUTES) {
  await fetch(base + route).then((r) => r.text());
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });

  await page.addInitScript(() => {
    window.__t = { tasks: [], lcp: 0, load: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__t.tasks.push({ start: e.startTime, dur: e.duration });
    }).observe({ type: "longtask", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__t.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    addEventListener("load", () => {
      window.__t.load = performance.now();
    });
  });

  await page.goto(base + route, { waitUntil: "load" });
  // Long enough for the idle-scheduled scene work to have happened.
  await page.waitForTimeout(6000);
  const t = await page.evaluate(() => window.__t);

  const blocking = (list) => Math.round(list.reduce((s, x) => s + Math.max(0, x.dur - 50), 0));
  const beforeLcp = t.tasks.filter((x) => x.start < t.lcp);
  const beforeLoad = t.tasks.filter((x) => x.start < t.load);
  const afterLoad = t.tasks.filter((x) => x.start >= t.load);

  console.log(`\n  ${route} — LCP ${Math.round(t.lcp)}ms, load ${Math.round(t.load)}ms`);
  console.log(`    blocking before LCP   ${String(blocking(beforeLcp)).padStart(5)}ms  (${beforeLcp.length} tasks)`);
  console.log(`    blocking before load  ${String(blocking(beforeLoad)).padStart(5)}ms  (${beforeLoad.length} tasks)`);
  console.log(`    blocking after load   ${String(blocking(afterLoad)).padStart(5)}ms  (${afterLoad.length} tasks)`);
  const worst = [...t.tasks].sort((a, b) => b.dur - a.dur).slice(0, 4);
  console.log(
    `    longest tasks         ${worst.map((w) => `${Math.round(w.dur)}ms @${Math.round(w.start)}`).join(", ")}`,
  );

  await context.close();
}

await browser.close();
console.log("\n  Blocking before load is what a visitor feels. After load is idle work.\n");
