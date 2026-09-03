/**
 * Screenshot harness for design review.
 *
 * node scripts/shot.mjs <route> <label> [width] [height] [--w=] [--h=]
 *                       [--full] [--reduce] [--nojs] [--at=#selector]
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith("--"));
// Flags may appear anywhere, so positionals are whatever is left over.
const [route = "/", label = "shot", wArg, hArg] = argv.filter((a) => !a.startsWith("--"));

const flagValue = (name) => flags.find((f) => f.startsWith(`--${name}=`))?.slice(name.length + 3);
const w = flagValue("w") ?? wArg ?? "1440";
const h = flagValue("h") ?? hArg ?? "900";

const full = flags.includes("--full");
const reduce = flags.includes("--reduce");
const nojs = flags.includes("--nojs");
const port = process.env.PORT ?? "4310";

mkdirSync("shots", { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: full ? 1 : 2,
  reducedMotion: reduce ? "reduce" : "no-preference",
  javaScriptEnabled: !nojs,
});
const page = await context.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

const host = process.env.HOST ?? "127.0.0.1";
// `load`, not `networkidle`: the dev server keeps an HMR socket open forever.
await page.goto(`http://${host}:${port}${route}`, { waitUntil: "load", timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

if (full) {
  // Walk the page so scroll-triggered reveals have fired before capture.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 130));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

// --at=#selector scrolls that element into view before capturing.
const at = flags.find((f) => f.startsWith("--at="))?.slice(5);
if (at) {
  await page.evaluate(async (sel) => {
    const el = document.querySelector(sel);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - 16);
    }
    await new Promise((r) => setTimeout(r, 200));
  }, at);
  await page.waitForTimeout(1200);
}

await page.waitForTimeout(700);
const path = `shots/${label}.png`;
await page.screenshot({ path, fullPage: full });

const metrics = await page.evaluate(() => ({
  scrollHeight: document.body.scrollHeight,
  hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}));

console.log(JSON.stringify({ path, errors, metrics }, null, 2));
await browser.close();
