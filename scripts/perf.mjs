/**
 * Field measurements against a production build, with CPU and network
 * throttling applied through CDP so the numbers mean something.
 *
 *   npx next build && npx next start --port 4320
 *   node scripts/perf.mjs
 *
 * Reports FCP, LCP, CLS, long-task blocking time, and the bytes actually
 * shipped, split by type. Dev-only tooling. Not part of the shipped site.
 */
import { launchGpu } from "./launch.mjs";
import { adminContext, haveAdminCredentials } from "./admin-auth.mjs";

const PORT = process.env.PORT ?? "4320";
const HOST = process.env.HOST ?? "127.0.0.1";
const base = `http://${HOST}:${PORT}`;
// ROUTES=/admin,/admin/r/R-XXXXXX to measure the desk. Admin routes need the
// credentials on the context, or every measurement is of the login page.
const ROUTES = (process.env.ROUTES ?? "/,/pricing").split(",").filter(Boolean);
const needsAuth = (route) => route.startsWith("/admin") && route !== "/admin/login";

if (ROUTES.some(needsAuth) && !haveAdminCredentials()) {
  console.error("ADMIN_USER and ADMIN_PASSWORD are not in the environment.");
  console.error("Run: node --env-file=.env.local scripts/perf.mjs");
  process.exit(1);
}

// A mid-tier laptop on a good connection: 4x CPU slowdown, 40 Mbps, 40ms RTT.
const CPU_SLOWDOWN = 4;
const NET = { offline: false, downloadThroughput: (40 * 1024 * 1024) / 8, uploadThroughput: (10 * 1024 * 1024) / 8, latency: 40 };

// Warm every route first. The first hit to a Next server pays for module
// loading and response caching that a real visitor to a warm deployment never
// sees, and it swamps everything else in the measurement.
const warmHeaders = haveAdminCredentials() ? (adminContext().extraHTTPHeaders ?? {}) : {};
for (const route of ROUTES) {
  await fetch(base + route, { headers: needsAuth(route) ? warmHeaders : {} }).then((r) => r.text());
}

const browser = await launchGpu();
const rows = [];
// Three runs per route, median reported. A single run on a machine that is
// also building, serving and running a browser is mostly noise.
const RUNS = Number(process.env.RUNS ?? 3);
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

for (const route of ROUTES) {
  const samples = [];

  for (let run = 0; run < RUNS; run++) {
    const viewport = { width: 1440, height: 900 };
    const context = await browser.newContext(needsAuth(route) ? adminContext({ viewport }) : { viewport });
    const page = await context.newPage();

    // Split what the page needs to become interactive from what it fetches
    // afterwards. Only the first number is on the critical path; the second is
    // three.js arriving on idle, which nobody waits for.
    const bytes = { script: 0, deferred: 0, stylesheet: 0, font: 0, image: 0, document: 0, other: 0 };
    let loaded = false;
    page.on("load", () => { loaded = true; });
    page.on("response", async (res) => {
      try {
        const type = res.request().resourceType();
        const len = Number(res.headers()["content-length"] ?? 0) || (await res.body().catch(() => Buffer.alloc(0))).length;
        const key = type === "script" && loaded ? "deferred" : type in bytes ? type : "other";
        bytes[key] += len;
      } catch {}
    });

    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", NET);

    await page.addInitScript(() => {
      window.__m = { lcp: 0, cls: 0, blocking: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          window.__m.lcp = e.startTime;
          // The element reference cannot cross the CDP boundary, so describe
          // it here while it is still a live node.
          const el = e.element;
          if (!el) continue;
          const tag = el.tagName.toLowerCase();
          const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
          window.__m.lcpText = text ? `<${tag}> ${text}` : `<${tag}>`;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__m.blocking += Math.max(0, e.duration - 50);
      }).observe({ type: "longtask", buffered: true });
    });

    await page.goto(base + route, { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(3500);

    const m = await page.evaluate(() => {
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        fcp: Math.round(fcp),
        lcp: Math.round(window.__m.lcp),
        cls: Number(window.__m.cls.toFixed(4)),
        blocking: Math.round(window.__m.blocking),
        domInteractive: Math.round(nav?.domInteractive ?? 0),
        lcpText: window.__m.lcpText,
      };
    });

    const kb = (n) => Math.round(n / 1024);
    samples.push({
      FCP: m.fcp,
      LCP: m.lcp,
      CLS: m.cls,
      TBT: m.blocking,
      JS: kb(bytes.script),
      Lazy: kb(bytes.deferred),
      CSS: kb(bytes.stylesheet),
      Font: kb(bytes.font),
      HTML: kb(bytes.document),
      lcpText: m.lcpText,
    });
    await context.close();
  }

  rows.push({
    route,
    FCP: median(samples.map((s) => s.FCP)),
    LCP: median(samples.map((s) => s.LCP)),
    CLS: Math.max(...samples.map((s) => s.CLS)),
    TBT: median(samples.map((s) => s.TBT)),
    JS: median(samples.map((s) => s.JS)),
    Lazy: median(samples.map((s) => s.Lazy)),
    CSS: median(samples.map((s) => s.CSS)),
    Font: median(samples.map((s) => s.Font)),
    HTML: median(samples.map((s) => s.HTML)),
    lcpText: samples[0].lcpText,
    spread: Math.max(...samples.map((s) => s.LCP)) - Math.min(...samples.map((s) => s.LCP)),
  });
}

await browser.close();

const pad = (s, n) => String(s).padStart(n);
console.log(`\nProduction build · ${CPU_SLOWDOWN}× CPU throttle · 40 Mbps / 40 ms · median of ${RUNS}\n`);
console.log("  route            FCP    LCP    CLS    TBT     JS   Lazy    CSS   Font   HTML");
for (const r of rows) {
  const flag = r.LCP > 2500 || r.CLS > 0.1 ? "  <-- over budget" : "";
  console.log(
    `  ${r.route.padEnd(14)} ${pad(r.FCP + "ms", 6)} ${pad(r.LCP + "ms", 6)} ${pad(r.CLS, 6)} ${pad(r.TBT + "ms", 6)} ${pad(r.JS + "k", 6)} ${pad(r.Lazy + "k", 6)} ${pad(r.CSS + "k", 6)} ${pad(r.Font + "k", 6)} ${pad(r.HTML + "k", 6)}  ±${r.spread}ms${flag}`
  );
}
console.log("\n  LCP element per route:");
for (const r of rows) console.log(`  ${r.route.padEnd(14)} "${r.lcpText}"`);
console.log("\n  budget: LCP < 2500ms · CLS < 0.1\n");
