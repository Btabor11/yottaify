/**
 * Where does the main thread time actually go on a route, by function?
 *
 *   node scripts/profile.mjs [route] [msAfterLoad]
 *
 * Runs the V8 sampling profiler over a window after load and aggregates self
 * time by function, so an expensive idle page names its own culprit. Dev-only
 * tooling. Not part of the shipped site.
 */
import { assertHardware, launchGpu } from "./launch.mjs";

const PORT = process.env.PORT ?? "4320";
const base = `http://127.0.0.1:${PORT}`;
const route = process.argv[2] ?? "/d1";
const window_ms = Number(process.argv[3] ?? 6000);

const browser = await launchGpu();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 200 });

await page.goto(base + route, { waitUntil: "load" });
// Let the idle-scheduled work settle, then profile the steady state.
await page.waitForTimeout(3500);
await cdp.send("Profiler.start");
await page.waitForTimeout(window_ms);
const { profile } = await cdp.send("Profiler.stop");

const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
for (let i = 0; i < profile.samples.length; i++) {
  const node = byId.get(profile.samples[i]);
  if (!node) continue;
  const f = node.callFrame;
  const name = f.functionName || "(anonymous)";
  const url = (f.url || "").replace(/^https?:\/\/[^/]+/, "").replace(/\/_next\/static\/chunks\//, "");
  const key = `${name}  ${url}:${f.lineNumber + 1}`;
  self.set(key, (self.get(key) ?? 0) + 1);
}

const total = profile.samples.length || 1;
const rows = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22);

console.log(`\n  ${route} — ${total} samples over ${window_ms}ms of steady state, 4x throttle\n`);
console.log("   self%   samples  function");
for (const [key, n] of rows)
  console.log(`  ${((n / total) * 100).toFixed(1).padStart(5)}%  ${String(n).padStart(7)}  ${key.slice(0, 90)}`);

const idle = self.get("(idle)  :1") ?? self.get("(program)  :1") ?? 0;
console.log(`\n  idle share: ${((idle / total) * 100).toFixed(1)}%  — a page at rest should be nearly all idle\n`);

await browser.close();
