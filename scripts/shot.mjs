/**
 * Screenshot harness for design review.
 *
 * node scripts/shot.mjs <route> <label> [width] [height] [--w=] [--h=]
 *                       [--full] [--reduce] [--nojs] [--at=#selector]
 *                       [--auth=user:pass]   (HTTP Basic, for /admin)
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { adminContext, haveAdminCredentials } from "./admin-auth.mjs";

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

/**
 * Credentials for /admin.
 *
 * Preferred form is no flag at all: run the script as
 * `node --env-file=.env.local scripts/shot.mjs …` and adminContext picks the
 * desk's own environment variables up itself, so nothing secret is ever typed
 * onto a command line or echoed into a log. `--auth=user:pass` stays for CI.
 */
const authFlag = flagValue("auth");
if (authFlag) {
  process.env.ADMIN_USER = authFlag.slice(0, authFlag.indexOf(":"));
  process.env.ADMIN_PASSWORD = authFlag.slice(authFlag.indexOf(":") + 1);
}
const authed = haveAdminCredentials();

const context = await browser.newContext(
  adminContext({
    viewport: { width: Number(w), height: Number(h) },
    deviceScaleFactor: full ? 1 : 2,
    reducedMotion: reduce ? "reduce" : "no-preference",
    javaScriptEnabled: !nojs,
  }),
);
const page = await context.newPage();

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

const host = process.env.HOST ?? "127.0.0.1";
// `load`, not `networkidle`: the dev server keeps an HMR socket open forever.
const response = await page.goto(`http://${host}:${port}${route}`, { waitUntil: "load", timeout: 60000 });
// A page that is *meant* to 404 makes the browser log a failed-resource error
// for its own document. Reported as `status` instead, so a deliberate 404
// frame reads as a 404 rather than as a broken page.
const status = response?.status() ?? 0;
const OWN_404 = "Failed to load resource: the server responded with a status of 404 (Not Found)";
// With JS disabled every page.evaluate hangs until its promise is collected,
// so each one below is gated. A --nojs capture is about whether the page is
// legible without scripting, which needs none of them.
if (!nojs) await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(900);

if (full && !nojs) {
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
if (at && !nojs) {
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

// --pending: hold a dossier's action open and photograph the button while it
// is in flight. The request is dropped rather than served, so a review pass
// never edits a row.
if (flags.includes("--pending") && !nojs) {
  await page.route("**/admin/r/**", async (r) => {
    if (r.request().method() !== "POST") return r.continue();
    await new Promise((done) => setTimeout(done, 8000));
    await r.abort();
  });
  await page
    .locator('form[action] button[type="submit"]', { hasText: /save/i })
    .first()
    .click({ noWaitAfter: true });
  await page.waitForTimeout(400);
}

// --holdcard: hover the first card in the desk's triage list, which should
// light that reservation's mark out in the sounding field beside it. The
// other half of --pick. Not the log: hovering a row down there scrolls the
// field out of view, which stops its frame loop and blanks the canvas.
if (flags.includes("--holdcard") && !nojs) {
  await page.locator("li[data-ref]").first().hover();
  await page.waitForTimeout(600);
}

// --pick: sweep the pointer across the desk's sounding field until a bead
// takes it, so a review frame can show the chart being held rather than idle.
if (flags.includes("--pick") && !nojs) {
  const box = await page.locator(".adm-chart-hull").boundingBox();
  if (box) {
    let held = false;
    for (let gy = 0.24; gy <= 0.72 && !held; gy += 0.06) {
      for (let gx = 0.34; gx <= 0.94 && !held; gx += 0.035) {
        await page.mouse.move(box.x + box.width * gx, box.y + box.height * gy);
        await page.waitForTimeout(45);
        held = await page.evaluate(() => Boolean(document.querySelector('.adm-tip[data-held="true"]')));
      }
    }
    await page.waitForTimeout(500);
  }
}

await page.waitForTimeout(700);
const path = `shots/${label}.png`;
await page.screenshot({ path, fullPage: full });

const metrics = nojs
  ? "unavailable without JS — read the image"
  : await page.evaluate(() => ({
      scrollHeight: document.body.scrollHeight,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

// `landed` catches the case that wastes the most time: a protected route that
// quietly redirected to its login page, so the capture is of the wrong screen.
console.log(
  JSON.stringify(
    {
      path,
      landed: page.url().replace(/^https?:\/\/[^/]+/, ""),
      status,
      auth: authed,
      errors: status === 404 ? errors.filter((e) => e !== OWN_404) : errors,
      metrics,
    },
    null,
    2,
  ),
);
await browser.close();
