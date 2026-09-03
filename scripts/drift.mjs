/**
 * Does the scroll-driven palette still travel, and does it step visibly?
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
const base = `http://127.0.0.1:${PORT}`;

const browser = await launchGpu();
await assertHardware(browser);
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${base}/d3`, { waitUntil: "load" });
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
    probe.style.color = "var(--accent)";
    probe.style.position = "fixed";
    root.appendChild(probe);
    const accent = getComputedStyle(probe).color;
    probe.remove();
    return { phase: cs.getPropertyValue("--phase").trim(), accent };
  });
  samples.push({ frac, ...s });
}

// Rough sRGB distance between neighbours — enough to catch visible banding.
const parse = (c) => {
  const m = c.match(/[-\d.]+/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
};
let worst = 0;
for (let i = 1; i < samples.length; i++) {
  const a = parse(samples[i - 1].accent);
  const b = parse(samples[i].accent);
  worst = Math.max(worst, Math.hypot(...a.map((v, j) => v - b[j])));
}

console.log("\n  /d3 accent through the document\n");
console.log("  scroll   phase   accent");
for (const s of samples) console.log(`  ${(s.frac * 100).toFixed(0).padStart(5)}%  ${s.phase.padStart(6)}   ${s.accent}`);
console.log(`\n  travels: ${samples[0].accent}  ->  ${samples.at(-1).accent}`);
console.log(`  largest gap between the sampled tenths: ${worst.toFixed(3)}\n`);

await browser.close();
