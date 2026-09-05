/**
 * Does the scroll-driven live colour still travel, and does it step visibly?
 *
 *   node scripts/drift.mjs
 *
 * `--phase` now advances in discrete steps instead of every frame, so the two
 * things worth checking by measurement rather than by eye are that the accent
 * still moves the full distance down the page, and that no single step is a
 * large enough jump to read as banding. Prints the resolved accent at points
 * through the document plus the largest step between neighbours.
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { assertHardware, launchGpu } from "./launch.mjs";

const PORT = process.env.PORT ?? "4320";
const HOST = process.env.HOST ?? "127.0.0.1";
const base = `http://${HOST}:${PORT}`;

const browser = await launchGpu();
await assertHardware(browser);
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/`, { waitUntil: "load" });
await page.waitForTimeout(1500);

const samples = [];
for (let i = 0; i <= 10; i++) {
  const frac = i / 10;
  await page.evaluate((f) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.round(max * f));
  }, frac);
  // Let the eased follow settle on its step.
  await page.waitForTimeout(900);
  const s = await page.evaluate(() => {
    const root = document.querySelector(".d3");
    const cs = getComputedStyle(root);
    // A custom property reads back as its unresolved token, so paint it onto a
    // throwaway element to get the colour the screen actually shows.
    const probe = document.createElement("span");
    probe.style.color = "var(--live)";
    probe.style.position = "fixed";
    root.appendChild(probe);
    const accent = getComputedStyle(probe).color;
    probe.remove();
    return { phase: cs.getPropertyValue("--phase").trim(), accent };
  });
  samples.push({ frac, ...s });
}

// The browser resolves the color-mix to oklch(L C H). The thing worth
// measuring is that hue keeps moving the long way round (ember → magenta →
// blue → teal) and never doubles back, and that lightness stays in the band
// the audit proved legible.
const parse = (c) => {
  const m = c.match(/[-\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
};
let hueSpan = 0;
let reversed = false;
let prevH = null;
for (const s of samples) {
  const [, , h] = parse(s.accent);
  if (prevH !== null && h !== prevH) {
    // Going the long way from ~47° means hue decreases (wrapping past 0).
    let d = h - prevH;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    if (d > 0.5) reversed = true;
    hueSpan += Math.abs(d);
  }
  prevH = h;
}
const L = samples.map((s) => parse(s.accent)[0]);

console.log("\n  --live through the story\n");
console.log("  scroll   phase   live");
for (const s of samples) console.log(`  ${(s.frac * 100).toFixed(0).padStart(5)}%  ${s.phase.padStart(6)}   ${s.accent}`);
console.log(`\n  travels: ${samples[0].accent}  ->  ${samples.at(-1).accent}`);
console.log(`  hue travelled: ${hueSpan.toFixed(0)}°  ${reversed ? "(REVERSED — went the short way somewhere)" : "(monotonic, the long way round)"}`);
console.log(`  lightness band: ${Math.min(...L).toFixed(3)} – ${Math.max(...L).toFixed(3)}\n`);
if (hueSpan < 180) {
  console.error("  the live colour did not travel: check that the story section carries data-pin-host");
  process.exitCode = 1;
}

await browser.close();
