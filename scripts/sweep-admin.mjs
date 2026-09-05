/**
 * Runtime sweep for the desk.
 *
 * scripts/sweep.mjs drives the public site. It cannot drive /admin: those
 * routes are behind credentials, they have no reservation form, and their
 * failure modes are different ones — a filter that only works with
 * JavaScript, a table that pushes the page sideways at 375, an action button
 * that cannot be reached from the keyboard, a canvas that died and left a
 * chart with no data on it.
 *
 *   node --env-file=.env.local scripts/sweep-admin.mjs [--quick]
 *
 * Credentials are read from the environment by scripts/admin-auth.mjs and are
 * never printed. Dev-only tooling. Not part of the shipped site.
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { adminContext, haveAdminCredentials } from "./admin-auth.mjs";

if (!haveAdminCredentials()) {
  console.error("ADMIN_USER and ADMIN_PASSWORD are not in the environment.");
  console.error("Run: node --env-file=.env.local scripts/sweep-admin.mjs");
  process.exit(1);
}

const quick = process.argv.includes("--quick");
const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = process.env.PORT ?? "4310";
const base = `http://${HOST}:${PORT}`;
const WIDTHS = quick ? [1440] : [375, 768, 1440, 2560];

const results = [];
const problems = [];
const note = (route, mode, kind, detail) => problems.push({ route, mode, kind, detail });

const browser = await chromium.launch();

async function open(route, { width = 1440, height = 900, reduce = false, nojs = false } = {}) {
  const context = await browser.newContext(
    adminContext({
      viewport: { width, height },
      reducedMotion: reduce ? "reduce" : "no-preference",
      javaScriptEnabled: !nojs,
    }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText ?? "";
    if (!/ERR_ABORTED/.test(f)) errors.push(`requestfailed: ${r.url().slice(0, 90)} ${f}`);
  });
  const res = await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
  if (!nojs) await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(nojs ? 300 : 900);
  return { context, page, errors, status: res?.status() ?? 0 };
}

/* ---- find a real reference so the dossier is swept against real data --- */
let reference = null;
{
  const { context, page } = await open("/admin");
  reference = await page.evaluate(() => document.querySelector("td .adm-ref")?.textContent?.trim() ?? null);
  await context.close();
}
if (!reference) note("/admin", "setup", "no rows", "the board returned no reservations — seed with scripts/seed-desk.mjs");

const ROUTES = [
  ["/admin", "board"],
  ["/admin?status=all", "board, every status"],
  ["/admin?status=spam", "board, spam only"],
  ["/admin?q=zzzz-no-such-company", "board, empty result"],
  ["/admin/login", "login"],
  ...(reference ? [[`/admin/r/${reference}`, "dossier"]] : []),
];

/* ---- 1. every route, every width --------------------------------------- */
for (const [route, name] of ROUTES) {
  for (const width of WIDTHS) {
    const { context, page, errors, status } = await open(route, { width, height: 900 });
    if (status >= 400) note(route, `${width}px`, "status", `HTTP ${status}`);

    await page.evaluate(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 450));
    });

    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const over = [];
      if (de.scrollWidth > window.innerWidth + 1) {
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > window.innerWidth + 1 || r.left < -1) {
            const s = getComputedStyle(el);
            if (s.position === "fixed" || s.overflowX === "auto" || s.overflowX === "scroll") continue;
            // Anything inside a horizontal scroller is that scroller's
            // business, not the page's. Asked of the computed style rather
            // than a class name, so it keeps working when the class changes.
            let scrolled = false;
            for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
              const ps = getComputedStyle(p).overflowX;
              if (ps === "auto" || ps === "scroll" || ps === "hidden") {
                scrolled = true;
                break;
              }
            }
            if (scrolled) continue;
            over.push(
              `<${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? "." + el.className.split(" ").slice(0, 2).join(".") : ""}> right=${Math.round(r.right)}`,
            );
          }
        }
      }
      const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
      const skips = [];
      for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skips.push(`h${hs[i - 1]} → h${hs[i]}`);
      return {
        cls: Number((window.__cls ?? 0).toFixed(4)),
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        overflowing: [...new Set(over)].slice(0, 4),
        h1s: document.querySelectorAll("h1").length,
        headingOrder: skips,
        title: document.title,
        canvases: document.querySelectorAll("canvas").length,
      };
    });

    results.push({ route: name, width, ...m, errors: errors.length });
    if (errors.length) note(route, `${width}px`, "console error", errors.slice(0, 3).join(" | "));
    if (m.scrollWidth > m.innerWidth + 1)
      note(route, `${width}px`, "horizontal overflow", `${m.scrollWidth} > ${m.innerWidth} — ${m.overflowing.join(" · ") || "source not isolated"}`);
    if (m.cls > 0.1) note(route, `${width}px`, "layout shift", `CLS ${m.cls}`);
    if (m.h1s !== 1) note(route, `${width}px`, "heading", `${m.h1s} h1 elements`);
    if (m.headingOrder.length) note(route, `${width}px`, "heading order", m.headingOrder.join(", "));
    if (!m.title) note(route, `${width}px`, "metadata", "empty <title>");
    await context.close();
  }
}

/* ---- 2. accessibility --------------------------------------------------- */
for (const [route] of ROUTES) {
  for (const width of quick ? [1440] : [375, 1440]) {
    const { context, page } = await open(route, { width });
    // Audit the resting state: let entrance animations land first, and leave
    // infinite ones (the store pip, the sweep) running so they are audited
    // as the reader actually sees them.
    await page
      .evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        ),
      )
      .catch(() => {});
    const a = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    for (const v of a.violations)
      note(route, `${width}px`, `a11y ${v.impact}`, `${v.id}: ${v.help} (${v.nodes.length}) — ${v.nodes[0]?.target?.join(" ") ?? ""}`);
    results.push({ route, width, mode: "axe", violations: a.violations.length });
    await context.close();
  }
}

/* ---- 3. reduced motion -------------------------------------------------- */
for (const [route] of ROUTES) {
  const { context, page, errors } = await open(route, { reduce: true });
  const m = await page.evaluate(() => {
    const root = document.querySelector("main") ?? document.body;
    const hidden = [...root.querySelectorAll("*")].filter((el) => {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      return +s.opacity < 0.08;
    });
    return {
      invisible: hidden.slice(0, 5).map((e) => `<${e.tagName.toLowerCase()}> op=${getComputedStyle(e).opacity}`),
      textLength: root.innerText.length,
      canvases: document.querySelectorAll("canvas").length,
    };
  });
  if (m.invisible.length) note(route, "reduced-motion", "content not at rest state", m.invisible.join(" · "));
  if (m.textLength < 200) note(route, "reduced-motion", "page nearly empty", `${m.textLength} chars`);
  if (m.canvases > 0) note(route, "reduced-motion", "scene mounted anyway", `${m.canvases} canvas(es) with reduced motion asked for`);
  if (errors.length) note(route, "reduced-motion", "console error", errors.slice(0, 2).join(" | "));
  results.push({ route, mode: "reduce", ...m, invisible: m.invisible.length });
  await context.close();
}

/* ---- 4. no JavaScript: the desk is what you reach for when things break -- */
for (const [route] of ROUTES) {
  const { context, page } = await open(route, { nojs: true });
  const m = await page.evaluate(() => {
    const root = document.querySelector("main") ?? document.body;
    return {
      textLength: root.innerText.length,
      // Filters must be links, not buttons that need a listener.
      filterLinks: document.querySelectorAll("nav .adm-chip[href], .adm-chip[href]").length,
      forms: [...document.querySelectorAll("form")].map((f) => ({
        method: (f.getAttribute("method") ?? "get").toLowerCase(),
        action: f.getAttribute("action"),
        submit: Boolean(f.querySelector('button[type="submit"], button:not([type])')),
      })),
      rows: document.querySelectorAll(".adm-log tbody tr").length,
    };
  });
  if (m.textLength < 200) note(route, "no-js", "page nearly empty", `${m.textLength} chars`);
  for (const [i, f] of m.forms.entries()) {
    if (!f.submit) note(route, "no-js", "form has no submit", `form ${i}`);
    // A server-action form has no action attribute in the HTML; React fills
    // it in on hydration, so those are exempt. A GET form must name its own.
    if (f.method === "get" && !f.action) note(route, "no-js", "GET form has no action", `form ${i}`);
  }
  results.push({ route, mode: "nojs", ...m, forms: m.forms.length });
  await context.close();
}

/* ---- 5. the filters actually filter, as links --------------------------- */
{
  const { context, page } = await open("/admin", { nojs: true });
  const before = await page.evaluate(() => document.querySelectorAll(".adm-log tbody tr").length);
  const href = await page.evaluate(() => {
    const links = [...document.querySelectorAll(".adm-chip[href]")];
    return links.find((a) => /status=spam/.test(a.getAttribute("href") ?? ""))?.getAttribute("href") ?? null;
  });
  if (!href) note("/admin", "no-js", "filter not a link", "no spam view reachable without JavaScript");
  else {
    await page.goto(base + href, { waitUntil: "load" });
    const after = await page.evaluate(() => ({
      rows: document.querySelectorAll(".adm-log tbody tr").length,
      current: document.querySelectorAll('.adm-chip[aria-current="true"]').length,
    }));
    if (after.rows === before)
      note("/admin", "no-js", "filter had no effect", `${before} rows before, ${after.rows} after following ${href}`);
    if (after.current === 0) note("/admin", "no-js", "no current view", "no chip carries aria-current after filtering");
    results.push({ route: "/admin", mode: "filter", before, ...after });
  }
  await context.close();
}

/* ---- 5b. the log sorts, as links, and says which column it sorted by ---- */
{
  const { context, page } = await open("/admin?status=all", { nojs: true });
  const read = () =>
    page.evaluate(() => ({
      // Capacity is the fifth column, and its cell text starts with the count.
      caps: [...document.querySelectorAll(".adm-log tbody tr")].map((tr) =>
        Number((tr.children[4]?.textContent ?? "").replace(/[^0-9].*$/, "") || 0),
      ),
      marked: document.querySelectorAll('.adm-log th[aria-sort]:not([aria-sort="none"])').length,
    }));
  const href = await page.evaluate(
    () =>
      [...document.querySelectorAll(".adm-log th .adm-sort")]
        .find((a) => /sort=-?capacity/.test(a.getAttribute("href") ?? ""))
        ?.getAttribute("href") ?? null,
  );
  if (!href) note("/admin", "no-js", "log not sortable", "no column heading links to a capacity sort");
  else {
    await page.goto(base + href, { waitUntil: "load" });
    const { caps, marked } = await read();
    const descending = caps.every((n, i) => i === 0 || caps[i - 1] >= n);
    if (caps.length < 2) note("/admin", "no-js", "sort untestable", "fewer than two rows on the all view");
    else if (!descending) note("/admin", "no-js", "sort had no effect", `capacity column reads ${caps.join(", ")}`);
    if (marked !== 1)
      note("/admin", "a11y", "aria-sort wrong", `${marked} heading(s) claim to be the sorted column, expected exactly 1`);
    results.push({ route: "/admin", mode: "sort", rows: caps.length, descending, marked });
  }
  await context.close();
}

/* ---- 6. keyboard -------------------------------------------------------- */
for (const [route] of ROUTES) {
  const { context, page } = await open(route);
  const first = await page.evaluate(() => {
    const f = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(
      (e) => e.offsetParent !== null || getComputedStyle(e).position === "fixed",
    );
    return { count: f.length, firstIsSkip: /skip/i.test(f[0]?.textContent ?? "") };
  });
  // The login page is one plate with no chrome to skip past.
  if (!first.firstIsSkip && route !== "/admin/login")
    note(route, "keyboard", "skip link", "first focusable element is not a skip link");

  // Tab through and confirm every stop draws something.
  let ringless = [];
  for (let i = 0; i < Math.min(24, first.count); i++) {
    await page.keyboard.press("Tab");
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      const ring = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
      return ring || s.boxShadow !== "none"
        ? null
        : `<${el.tagName.toLowerCase()}>${el.textContent?.trim().slice(0, 20) ?? ""}`;
    });
    if (r) ringless.push(r);
  }
  if (ringless.length) note(route, "keyboard", "focus ring", [...new Set(ringless)].slice(0, 3).join(" · "));
  results.push({ route, mode: "keyboard", focusables: first.count, ringless: ringless.length });
  await context.close();
}

/* ---- 6b. an action in flight says so, and cannot be fired twice --------- */
{
  const ref = await (async () => {
    const { context, page } = await open("/admin");
    const r = await page.evaluate(() => document.querySelector("td .adm-ref")?.textContent?.trim() ?? null);
    await context.close();
    return r;
  })();
  const { context, page } = await open(`/admin/r/${ref}`);

  /* The action is held open and then dropped on the floor, so the pending
     state can be looked at without the sweep actually editing a row. */
  await page.route(`**/admin/r/${ref}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await new Promise((r) => setTimeout(r, 1500));
    await route.abort();
  });

  const save = page.locator('form[action] button[type="submit"]', { hasText: /save/i }).first();
  await save.click({ noWaitAfter: true });
  await page.waitForTimeout(400);
  const state = await page.evaluate(() => {
    const b = document.querySelector("button[data-pending]");
    return b ? { busy: b.getAttribute("aria-busy"), disabled: b.disabled } : null;
  });
  if (!state) note(`/admin/r/${ref}`, "actions", "no pending state", "a submitted action gave no sign it was in flight");
  else if (!state.disabled)
    note(`/admin/r/${ref}`, "actions", "double submit", "the button stayed live while its action was in flight");
  results.push({ route: `/admin/r/${ref}`, mode: "pending", ...state });
  await context.close();
}

/* ---- 6c. the dossier's readings say what they mean ---------------------- */
if (reference) {
  const route = `/admin/r/${reference}`;
  const { context, page } = await open(route);
  const m = await page.evaluate(() => {
    const depths = [...document.querySelectorAll(".adm-gauge-depth")].map((e) => e.textContent?.trim() ?? "");
    // A figure that repeats itself: "16" beside the unit "16 GPUs".
    const doubled = [...document.querySelectorAll(".adm-figure")]
      .map((f) => [f.textContent?.trim() ?? "", f.nextElementSibling?.textContent?.trim() ?? ""])
      .filter(([v, u]) => v && u && u.startsWith(v))
      .map(([v, u]) => `${v} · ${u}`);
    return { depths, doubled };
  });
  // The pipeline runs 0 at the surface to 1 on the floor. `.00` at the bottom
  // means a leading zero was sliced off a number that did not have one.
  const floor = m.depths[m.depths.length - 1];
  if (m.depths.length && floor !== "1.00")
    note(route, "dossier", "depth scale broken", `the deepest stage reads "${floor}", expected 1.00`);
  if (m.doubled.length) note(route, "dossier", "figure repeats its unit", m.doubled.join(" · "));
  results.push({ route, mode: "readings", depths: m.depths.length, floor, doubled: m.doubled.length });
  await context.close();
}

/* ---- 7. the chart's scene is alive, and matches the still it replaced ---- */
{
  const { context, page } = await open("/admin");
  await page.waitForTimeout(3400); // the mount waits for an idle main thread
  const m = await page.evaluate(() => {
    const c = document.querySelector(".adm-chart-hull canvas");
    const svg = document.querySelector(".adm-chart-hull svg");
    if (!c) return { canvas: false, svgVisible: svg ? +getComputedStyle(svg.parentElement).opacity : null };
    const gl = c.getContext("webgl") ?? c.getContext("webgl2");
    const r = c.getBoundingClientRect();
    return {
      canvas: true,
      lost: gl ? gl.isContextLost() : null,
      bufferW: gl?.drawingBufferWidth ?? 0,
      w: Math.round(r.width),
      h: Math.round(r.height),
      // The axis labels are HTML over the plot: they must survive the swap.
      ticks: document.querySelectorAll(".adm-chart-depth-tick, .adm-chart-time-tick").length,
    };
  });
  if (!m.canvas) note("/admin", "webgl", "no scene", "the still is showing and the canvas never mounted");
  else {
    if (m.lost) note("/admin", "webgl", "context lost", "canvas is dead but still composited");
    if (m.lost === false && m.bufferW === 0) note("/admin", "webgl", "empty drawing buffer", "zero-width buffer");
    if (m.ticks === 0) note("/admin", "webgl", "axes lost", "the chart has no axis labels once the scene mounts");

    /* Picking. Sweep the pointer across the plot and see whether any bead
       claims it. A silent picker is the failure mode here: the scene keeps
       drawing, nothing throws, and the chart is quietly just a picture. */
    const box = await page.locator(".adm-chart-hull").boundingBox();
    let held = null;
    for (let gy = 0.24; gy <= 0.72 && !held; gy += 0.06) {
      for (let gx = 0.3; gx <= 0.94 && !held; gx += 0.035) {
        await page.mouse.move(box.x + box.width * gx, box.y + box.height * gy);
        await page.waitForTimeout(45);
        held = await page.evaluate(() => {
          const t = document.querySelector('.adm-tip[data-held="true"]');
          return t ? { ref: t.querySelector(".adm-tip-ref")?.textContent ?? "", left: t.style.left } : null;
        });
      }
    }
    if (!held) note("/admin", "webgl", "chart not pickable", "no sounding responded to the pointer anywhere on the plot");
    else if (!/^R-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(held.ref))
      note("/admin", "webgl", "tooltip has no reference", `read "${held.ref}"`);
    else if (!held.left) note("/admin", "webgl", "tooltip unplaced", "the label never received a position");

    /* The channel runs both ways: holding a mark should have marked its row
       in the log, and hovering a row should light its mark in the field. */
    const rowLit = await page.evaluate(
      (ref) => document.querySelector("tr[data-held]")?.getAttribute("data-ref") === ref,
      held?.ref,
    );
    if (held && !rowLit) note("/admin", "webgl", "log not linked", `holding ${held.ref} did not mark its row in the log`);

    /* And the way back, from the triage list beside the plot — the one place
       a card and its mark are on screen together. Hovering a row down in the
       log would scroll the field away and stop its loop, which is exactly why
       the review frame hovers a card instead. */
    await page.mouse.move(4, 4);
    const cardRef = await page.evaluate(() => document.querySelector("li[data-ref]")?.getAttribute("data-ref") ?? null);
    await page.locator(`li[data-ref="${cardRef}"]`).first().hover();
    await page.waitForTimeout(240);
    const back = await page.evaluate(() => ({
      tip: document.querySelector('.adm-tip[data-held="true"] .adm-tip-ref')?.textContent ?? null,
      card: document.querySelector("li[data-ref][data-held]")?.getAttribute("data-ref") ?? null,
    }));
    if (back.tip !== cardRef)
      note("/admin", "webgl", "field not linked", `hovering card ${cardRef} lit ${back.tip ?? "nothing"} in the field`);
    results.push({ route: "/admin", mode: "pick", held: held?.ref ?? null, rowLit, cardRef, ...back });
  }
  await context.close();
}

await browser.close();

/* ---- report ------------------------------------------------------------- */
mkdirSync("shots", { recursive: true });
writeFileSync("shots/sweep-admin.json", JSON.stringify({ results, problems }, null, 2));

const byKind = problems.reduce((a, p) => ((a[p.kind] = (a[p.kind] ?? 0) + 1), a), {});
console.log(`\n${ROUTES.length} admin routes × ${WIDTHS.length} widths + a11y, reduced-motion, no-JS, filters, keyboard, webgl\n`);
if (!problems.length) console.log("  no problems found");
for (const [kind, n] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${kind}`);
console.log("");
for (const p of problems) console.log(`  ${p.route}  [${p.mode}]  ${p.kind}\n        ${p.detail}`);
console.log(`\n${problems.length} problem(s) · full data in shots/sweep-admin.json`);
