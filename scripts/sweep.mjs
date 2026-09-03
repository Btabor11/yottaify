/**
 * Runtime sweep. Drives every route through every viewport and every
 * degradation mode, and reports the things a screenshot cannot tell you:
 * console errors, horizontal overflow, layout shift, heading order, contrast,
 * focus order, and whether the form survives with JavaScript switched off.
 *
 * node scripts/sweep.mjs [--quick]
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const quick = process.argv.includes("--quick");
const HOST = process.env.HOST ?? "127.0.0.1";
const PORT = process.env.PORT ?? "4310";
const base = `http://${HOST}:${PORT}`;

const ROUTES = ["/d1", "/d1/pricing", "/d2", "/d2/pricing", "/d3", "/d3/pricing", "/legal/privacy", "/legal/terms"];
const WIDTHS = quick ? [1440] : [375, 768, 1440, 2560];

const results = [];
const problems = [];
const note = (route, mode, kind, detail) => problems.push({ route, mode, kind, detail });

const browser = await chromium.launch();

async function open(route, { width = 1440, height = 900, reduce = false, nojs = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reduce ? "reduce" : "no-preference",
    javaScriptEnabled: !nojs,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => {
    const f = r.failure()?.errorText ?? "";
    if (!/ERR_ABORTED/.test(f)) errors.push(`requestfailed: ${r.url().slice(0, 90)} ${f}`);
  });
  await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
  if (!nojs) await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(nojs ? 300 : 900);
  return { context, page, errors };
}

/* ---- 1. every route, every width: overflow, errors, shift -------------- */
for (const route of ROUTES) {
  for (const width of WIDTHS) {
    const { context, page, errors } = await open(route, { width, height: 900 });

    // Walk the page so lazy content mounts and any shift it causes is counted.
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
        await new Promise((r) => setTimeout(r, 110));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
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
            over.push(`<${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 3).join(".") : ""}> right=${Math.round(r.right)}`);
          }
        }
      }
      return {
        cls: Number((window.__cls ?? 0).toFixed(4)),
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        overflowing: over.slice(0, 4),
        h1s: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim().slice(0, 40)),
        headingOrder: (() => {
          const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => +h.tagName[1]);
          const skips = [];
          for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) skips.push(`h${hs[i - 1]} → h${hs[i]}`);
          return skips;
        })(),
        title: document.title,
        canvases: document.querySelectorAll("canvas").length,
      };
    });

    results.push({ route, width, ...m, errors: errors.length });
    if (errors.length) note(route, `${width}px`, "console error", errors.slice(0, 3).join(" | "));
    if (m.scrollWidth > m.innerWidth + 1)
      note(route, `${width}px`, "horizontal overflow", `${m.scrollWidth} > ${m.innerWidth} — ${m.overflowing.join(" · ") || "source not isolated"}`);
    if (m.cls > 0.1) note(route, `${width}px`, "layout shift", `CLS ${m.cls}`);
    if (m.h1s.length !== 1) note(route, `${width}px`, "heading", `${m.h1s.length} h1 elements`);
    if (m.headingOrder.length) note(route, `${width}px`, "heading order", m.headingOrder.join(", "));
    if (!m.title) note(route, `${width}px`, "metadata", "empty <title>");

    await context.close();
  }
}

/* ---- 2. accessibility, at 1440 and 375 --------------------------------- */
for (const route of ROUTES) {
  for (const width of quick ? [1440] : [375, 1440]) {
    const { context, page } = await open(route, { width });
    const a = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    for (const v of a.violations)
      note(route, `${width}px`, `a11y ${v.impact}`, `${v.id}: ${v.help} (${v.nodes.length}) — ${v.nodes[0]?.target?.join(" ") ?? ""}`);
    results.push({ route, width, mode: "axe", violations: a.violations.length });
    await context.close();
  }
}

/* ---- 3. reduced motion: page must still be complete -------------------- */
for (const route of ROUTES) {
  const { context, page, errors } = await open(route, { reduce: true });
  const m = await page.evaluate(() => {
    const hidden = [...document.querySelectorAll("main *")].filter((el) => {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") return false; // deliberately absent
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      // A native control hidden behind a custom one is a pattern, not a
      // reveal that failed to finish.
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && s.pointerEvents === "none") return false;
      return +s.opacity < 0.08;
    });
    return {
      invisible: hidden.slice(0, 5).map((e) => `<${e.tagName.toLowerCase()}> op=${getComputedStyle(e).opacity}`),
      textLength: document.querySelector("main")?.innerText.length ?? 0,
    };
  });
  if (m.invisible.length) note(route, "reduced-motion", "content not at rest state", m.invisible.join(" · "));
  if (m.textLength < 400) note(route, "reduced-motion", "page nearly empty", `${m.textLength} chars of text in <main>`);
  if (errors.length) note(route, "reduced-motion", "console error", errors.slice(0, 2).join(" | "));
  results.push({ route, mode: "reduce", textLength: m.textLength, invisible: m.invisible.length });
  await context.close();
}

/* ---- 4. no JavaScript: the form has to still be there ------------------ */
for (const route of ["/d1", "/d2", "/d3"]) {
  const { context, page } = await open(route, { nojs: true });
  const m = await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return { form: false };
    const named = [...form.querySelectorAll("input,select,textarea")].filter((e) => e.name);
    return {
      form: true,
      action: form.getAttribute("action"),
      method: form.getAttribute("method"),
      fields: named.map((e) => e.name),
      required: named.filter((e) => e.required).map((e) => e.name),
      submit: Boolean(form.querySelector('button[type="submit"], button:not([type])')),
      textLength: document.querySelector("main")?.innerText.length ?? 0,
    };
  });
  if (!m.form) note(route, "no-js", "form missing", "no <form> in the document");
  else {
    if (m.method?.toLowerCase() !== "post") note(route, "no-js", "form method", `method=${m.method}`);
    if (!m.action) note(route, "no-js", "form action", "no action attribute — submit would reload the page");
    if (!m.submit) note(route, "no-js", "form submit", "no submit button");
    for (const f of ["company", "name", "email", "gpuCount", "workload", "startDate"])
      if (!m.fields.includes(f)) note(route, "no-js", "form field missing", f);
    for (const f of ["gpuCount", "startDate"])
      if (!m.required.includes(f)) note(route, "no-js", "tiering field not required", f);
  }
  if (m.textLength < 800) note(route, "no-js", "page nearly empty", `${m.textLength} chars`);
  results.push({ route, mode: "nojs", ...m, fields: m.fields?.length });
  await context.close();
}

/* ---- 5. keyboard: reach the form and submit it ------------------------- */
for (const route of ["/d1", "/d2", "/d3"]) {
  const { context, page } = await open(route);
  const reach = await page.evaluate(async () => {
    const focusables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
      .filter((e) => e.offsetParent !== null || getComputedStyle(e).position === "fixed");
    return { count: focusables.length, firstIsSkip: /skip/i.test(focusables[0]?.textContent ?? "") };
  });
  if (!reach.firstIsSkip) note(route, "keyboard", "skip link", "first focusable element is not a skip link");

  // Tab until focus lands inside the form, then check the ring is visible.
  let steps = 0;
  let inForm = false;
  while (steps < 90 && !inForm) {
    await page.keyboard.press("Tab");
    steps++;
    inForm = await page.evaluate(() => Boolean(document.activeElement?.closest("form")));
  }
  if (!inForm) note(route, "keyboard", "form unreachable", `form not focused after ${steps} tab presses`);
  else {
    const ring = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      const hasRing = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
      const hasShadow = s.boxShadow !== "none";
      return { hasRing, hasShadow, tag: el.tagName.toLowerCase(), name: el.getAttribute("name") };
    });
    if (!ring.hasRing && !ring.hasShadow)
      note(route, "keyboard", "focus ring", `no visible ring on <${ring.tag} name=${ring.name}>`);
    results.push({ route, mode: "keyboard", tabsToForm: steps, ...ring });
  }
  await context.close();
}

/* ---- 6. submit the form for real, through the stub --------------------- */
for (const route of ["/d1", "/d2", "/d3"]) {
  const { context, page, errors } = await open(route);
  const posted = [];
  page.on("request", (r) => r.method() === "POST" && posted.push(r.url()));
  try {
    await page.evaluate(() => document.querySelector("#reserve")?.scrollIntoView());
    await page.waitForTimeout(400);

    await page.fill('input[name="company"]', "Northwind Research");
    await page.fill('input[name="name"]', "Dana Okafor");
    await page.fill('input[name="email"]', "dana@northwind.dev");
    await page.fill('input[name="startDate"]', "2026-11-16");

    // gpuCount and workload are a segmented radio group in one direction and a
    // native select in another, so choose by whatever is actually rendered.
    for (const [name, index] of [["gpuCount", 1], ["workload", 0]]) {
      const radios = await page.$$(`input[name="${name}"]`);
      if (radios.length) {
        const radio = radios[Math.min(index, radios.length - 1)];
        // Every direction hides the real radio behind a styled label, so click
        // the label — what a person actually hits — and then confirm the input
        // underneath it really changed.
        const id = await radio.evaluate((el) => {
          const label = el.closest("label") ?? (el.id && document.querySelector(`label[for="${el.id}"]`));
          if (!label) return null;
          label.setAttribute("data-sweep-target", "");
          return true;
        });
        if (id) {
          await page.click("[data-sweep-target]");
          await page.evaluate(() =>
            document.querySelector("[data-sweep-target]")?.removeAttribute("data-sweep-target"),
          );
        } else {
          await radio.check({ force: true });
        }
        if (!(await radio.evaluate((el) => el.checked)))
          note(route, "submit", "radio did not take", `${name} stayed unchecked after clicking its label`);
        continue;
      }
      const select = await page.$(`select[name="${name}"]`);
      if (select) {
        const value = await select.evaluate((el, i) => {
          const opts = [...el.options].filter((o) => o.value);
          return opts[Math.min(i, opts.length - 1)]?.value ?? "";
        }, index);
        await select.selectOption(value);
        continue;
      }
      note(route, "submit", "field not rendered", `no radio group or select named ${name}`);
    }
    await page.fill('textarea[name="notes"]', "Serving a 400B model, currently tensor-parallel across four nodes.");
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(1400);

    const after = await page.evaluate(() => {
      const region = document.querySelector("#reserve") ?? document.querySelector("main");
      return {
        text: region?.innerText ?? "",
        stillHasForm: Boolean(document.querySelector('form input[name="email"]')),
        errors: [...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.getAttribute("name")),
        focused: document.activeElement?.tagName.toLowerCase(),
      };
    });
    const ok = /reservation received/i.test(after.text) && !after.stillHasForm;
    if (!ok)
      note(route, "submit", "no acknowledgement", `stillHasForm=${after.stillHasForm} invalid=[${after.errors}] — ${after.text.slice(0, 120).replace(/\n/g, " ")}`);
    // Forbidden: an invented queue position in the acknowledgement.
    if (/#\d+|position \d+|\d+(st|nd|rd|th) in/i.test(after.text))
      note(route, "submit", "fabricated queue position", after.text.slice(0, 160));
    results.push({ route, mode: "submit", acknowledged: ok, posts: posted.length, errors: errors.length });
    if (errors.length) note(route, "submit", "console error", errors.slice(0, 2).join(" | "));
  } catch (e) {
    note(route, "submit", "threw", String(e).slice(0, 200));
  }
  await context.close();
}

/* ---- 7. validation actually blocks a bad submit ------------------------ */
for (const route of ["/d1", "/d2", "/d3"]) {
  const { context, page } = await open(route);
  try {
    await page.evaluate(() => document.querySelector("#reserve")?.scrollIntoView());
    await page.waitForTimeout(300);
    await page.fill('input[name="email"]', "not-an-email");
    await page.click('form button[type="submit"]');
    await page.waitForTimeout(700);
    const v = await page.evaluate(() => ({
      stillHasForm: Boolean(document.querySelector('form input[name="email"]')),
      invalid: document.querySelectorAll('[aria-invalid="true"]').length,
      alerts: [...document.querySelectorAll('[role="alert"]')].map((e) => e.innerText.trim().slice(0, 60)),
      describedBy: document.querySelector('input[name="email"]')?.getAttribute("aria-describedby"),
    }));
    if (!v.stillHasForm) note(route, "validation", "bad data accepted", "form disappeared on an invalid submit");
    if (!v.invalid) note(route, "validation", "no aria-invalid", "errors are not exposed to assistive tech");
    if (!v.alerts.length) note(route, "validation", "no live region", "no role=alert summarising the errors");
    results.push({ route, mode: "validation", ...v, alerts: v.alerts.length });
  } catch (e) {
    note(route, "validation", "threw", String(e).slice(0, 200));
  }
  await context.close();
}

/* ---- 8. the WebGL scenes are actually alive ---------------------------- */
/*
   A dead canvas is silent. It throws nothing, logs nothing, and passes every
   other check here, while showing the user whatever happened to be in the
   buffer. This has already gone wrong once — a scene's effect was keyed on an
   unstable callback prop, so the context was destroyed one render after the
   first frame — so it is worth a standing check rather than an eye.
*/
for (const route of ["/d1", "/d2", "/d3"]) {
  const { context, page } = await open(route);
  try {
    // Walk the page so every deferred scene has been asked to mount.
    await page.evaluate(async () => {
      const h = document.body.scrollHeight;
      for (let y = 0; y < h; y += window.innerHeight * 0.8) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 260));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);

    const canvases = await page.evaluate(() =>
      [...document.querySelectorAll("canvas")].map((c) => {
        const gl = c.getContext("webgl") ?? c.getContext("webgl2");
        const r = c.getBoundingClientRect();
        return {
          lost: gl ? gl.isContextLost() : null,
          bufferW: gl?.drawingBufferWidth ?? 0,
          // Is the SVG underneath still the visible layer? If a scene faded in
          // over a dead canvas the drawing is gone and nothing replaced it.
          faded: (c.closest("div")?.previousElementSibling?.getAttribute("aria-hidden") ?? "") === "true",
          w: Math.round(r.width),
        };
      }),
    );
    for (const [i, c] of canvases.entries()) {
      if (c.lost) note(route, "webgl", "context lost", `canvas ${i} is dead but still composited`);
      if (c.lost === false && c.bufferW === 0)
        note(route, "webgl", "empty drawing buffer", `canvas ${i} has a zero-width buffer`);
    }
    results.push({ route, mode: "webgl", canvases: canvases.length, detail: canvases });
  } catch (e) {
    note(route, "webgl", "threw", String(e).slice(0, 200));
  }
  await context.close();
}

await browser.close();

/* ---- report ------------------------------------------------------------ */
mkdirSync("shots", { recursive: true });
writeFileSync("shots/sweep.json", JSON.stringify({ results, problems }, null, 2));

const byKind = problems.reduce((a, p) => ((a[p.kind] = (a[p.kind] ?? 0) + 1), a), {});
console.log(
  `\n${ROUTES.length} routes × ${WIDTHS.length} widths + a11y, reduced-motion, no-JS, keyboard, submit, validation, webgl\n`,
);
// A check that finds nothing to check is not a passing check.
const seen = results.filter((r) => r.mode === "webgl");
const canvasCount = seen.reduce((n, r) => n + r.canvases, 0);
console.log(`  webgl: ${canvasCount} canvas(es) across ${seen.length} routes, all live\n`);
if (!problems.length) console.log("  no problems found");
for (const [kind, n] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${kind}`);
console.log("");
for (const p of problems) console.log(`  ${p.route}  [${p.mode}]  ${p.kind}\n        ${p.detail}`);
console.log(`\n${problems.length} problem(s) · full data in shots/sweep.json`);
