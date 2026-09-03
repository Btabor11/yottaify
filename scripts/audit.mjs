/**
 * Static audit. Checks the rules that can be checked without a browser:
 * hardcoded colour, hardcoded identity, forbidden claims, motion base-state,
 * and drift between the content layer and the verified payload.
 *
 * node scripts/audit.mjs
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";

const ROOTS = ["app", "components", "lib", "content", "config"];
const fails = [];
const passes = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if ([".ts", ".tsx", ".css"].includes(extname(p))) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
const components = files.filter((f) => f.endsWith(".tsx"));
const css = files.filter((f) => f.endsWith(".css"));
const read = (f) => readFileSync(f, "utf8");

function check(label, hits) {
  if (hits.length) fails.push(`${label}\n    ${hits.join("\n    ")}`);
  else passes.push(label);
}

/* ---- 1. no hardcoded colour in components ------------------------------
   palette.ts modules are the sanctioned exception (check 2 verifies them). */
{
  const hits = [];
  const tw =
    /\b(bg|text|border|fill|stroke|from|to|via|decoration|outline|ring|divide|shadow|accent|caret)-(zinc|neutral|slate|gray|grey|stone|white|black|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\d{2,3})?\b/;
  for (const f of components) {
    read(f).split("\n").forEach((line, i) => {
      const code = line.split("//")[0];
      if (/#[0-9a-fA-F]{3,8}\b/.test(code) && !/%23/.test(code))
        hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 92)}`);
      if (tw.test(code)) hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 92)}`);
    });
  }
  check("no hardcoded colour in components", hits);
}

/* ---- 2. palette.ts token entries match their direction's CSS ----------- */
{
  const hits = [];
  const palettes = files.filter((f) => basename(f) === "palette.ts");
  for (const f of palettes) {
    const dir = basename(dirname(f));
    const sheet = css.find((c) => basename(c) === `${dir}.css`);
    if (!sheet) {
      hits.push(`${f}: no matching ${dir}.css to check against`);
      continue;
    }
    const sheetSrc = read(sheet);
    for (const line of read(f).split("\n")) {
      const m = line.match(/"(#[0-9a-fA-F]{6})"\s*\/\*\s*(--[\w-]+)\s*\*\//);
      if (!m) continue;
      const [, hex, token] = m;
      const declared = sheetSrc.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
      if (!declared) hits.push(`${f}: ${token} claimed but not declared in ${dir}.css`);
      else if (declared.toLowerCase() !== hex.toLowerCase())
        hits.push(`${f}: ${token} is ${hex} here but ${declared} in ${dir}.css`);
    }
  }
  check("scene palettes match their CSS tokens", hits);
}

/* ---- 2b. token contrast ------------------------------------------------
   Every ink must clear 4.5:1 against every ground it can sit on, and --edge
   must clear 3:1 as a UI component border. --rule and --rule-strong are
   decorative by contract and exempt — check 2c enforces that they stay so. */
{
  const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  // Grounds that actually carry text in each direction. D2 uses --surface-2
  // only as an SVG fill, so it is not a text ground there.
  const TEXT_GROUNDS = {
    d1: ["--bg", "--surface", "--surface-2"],
    d2: ["--bg", "--surface"],
    d3: ["--bg", "--surface", "--surface-2", "--row-ours"],
    legal: ["--bg", "--surface"],
  };
  const INKS = ["--ink", "--ink-2", "--ink-3", "--accent", "--accent-2", "--caution", "--hot", "--alarm", "--volt", "--plasma"];
  const hits = [];
  for (const [dir, grounds] of Object.entries(TEXT_GROUNDS)) {
    const sheet = css.find((c) => basename(c) === `${dir}.css`);
    if (!sheet) continue;
    const tok = {};
    for (const m of read(sheet).matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) tok[m[1]] ??= m[2];
    for (const ink of INKS) {
      if (!tok[ink]) continue;
      for (const g of grounds) {
        if (!tok[g]) continue;
        const r = ratio(tok[ink], tok[g]);
        if (r < 4.5) hits.push(`${dir}: ${ink} ${tok[ink]} on ${g} ${tok[g]} is ${r.toFixed(2)}:1, needs 4.5:1`);
      }
    }
    for (const g of grounds) {
      if (!tok["--edge"] || !tok[g]) continue;
      const r = ratio(tok["--edge"], tok[g]);
      if (r < 3) hits.push(`${dir}: --edge on ${g} is ${r.toFixed(2)}:1, needs 3:1 as a control border`);
    }
  }
  check("every ink clears 4.5:1 and --edge clears 3:1", hits);
}

/* ---- 2c. decorative tokens are never set as legible text --------------- */
{
  const hits = [];
  for (const f of components) {
    read(f).split("\n").forEach((line, i) => {
      if (!/text-\[var\(--rule(-strong)?\)\]/.test(line)) return;
      if (/aria-hidden/.test(line)) return; // decoration, exempt from contrast
      hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 92)}`);
    });
  }
  check("--rule and --rule-strong are only used on decoration", hits);
}

/* ---- 3. verified payload present in content/ --------------------------- */
{
  const hw = read("content/hardware.ts");
  const pr = read("content/pricing.ts");
  const op = read("content/operator.ts");
  const expect = [
    [hw, "288", "HBM3e per GPU = 288 GB"],
    [hw, "8 TB/s", "memory bandwidth ~8 TB/s"],
    [hw, "14", "dense FP4 low = 14 PFLOPS"],
    [hw, "15", "dense FP4 high = 15 PFLOPS"],
    [hw, "1,000", "TDP low = 1,000 W"],
    [hw, "1,400", "TDP high = 1,400 W"],
    [hw, "18", "NVLink 5 links = 18"],
    [hw, "1.8 TB/s", "NVLink bandwidth ~1.8 TB/s"],
    [hw, "2304", "node HBM = 2,304 GB"],
    [pr, "6.75", "our rate $6.75"],
    [pr, "7.85", "median low $7.85"],
    [pr, "7.87", "median high $7.87"],
    [pr, "6.50", "neocloud low $6.50"],
    [pr, "6.95", "neocloud high $6.95"],
    [pr, "7.89", "lowest verified in stock $7.89"],
    [pr, "15.00", "Oracle $15.00"],
    [pr, "17.80", "AWS $17.80"],
    [pr, "4.25", "reserved low $4.25"],
    [pr, "5.62", "reserved high $5.62"],
    [op, "16", "fleet = 16 B300s"],
    [op, "35", "load ~35 kW"],
    [op, "97", "~97 A"],
    [op, "208", "208 V"],
  ];
  check(
    "verified payload present in content/",
    expect.filter(([src, needle]) => !src.includes(needle)).map(([, n, why]) => `${why} — "${n}" not found`)
  );
}

/* ---- 4. no price or spec literal typed into a component ----------------
   Prose in comments is exempt; the rule is about what reaches the DOM. */
{
  const hits = [];
  for (const f of components) {
    let inBlock = false;
    read(f).split("\n").forEach((line, i) => {
      const t = line.trim();
      const opens = /\/\*/.test(line);
      const closes = /\*\//.test(line);
      const wasInBlock = inBlock;
      if (opens && !closes) inBlock = true;
      if (closes) inBlock = false;
      if (wasInBlock || opens || t.startsWith("//")) return;
      const code = line.split("//")[0];
      if (/[">\s]\$\d+(\.\d\d)?\b/.test(code)) hits.push(`price literal  ${f}:${i + 1}  ${t.slice(0, 80)}`);
      if (/\b(288|2,?304|7\.89|6\.75|17\.80|15\.00|35 ?kW|97 ?A)\b/.test(code) && !/SOURCE|source|href/.test(code))
        hits.push(`spec literal   ${f}:${i + 1}  ${t.slice(0, 80)}`);
    });
  }
  check("no price or spec literal typed into a component", hits);
}

/* ---- 5. forbidden claims ----------------------------------------------
   Several forbidden words appear on the site *because* the site disclaims
   them — "we are not the cheapest", "what we do not have: an SLA". A hit only
   counts when the claim is asserted, so lines carrying a negation pass, and
   the handful that read as assertions out of context are acknowledged below
   with the reason they are allowed. Anything not on this list fails. */
{
  const ACKNOWLEDGED = [
    // The subject is the market, not us: the cheapest *verifiable third-party*
    // listing is $7.89, which is the whole point of the pricing section.
    "The cheapest one we could confirm as in stock was",
    "The cheapest B300-class capacity we could confirm as actually available",
    // Items in the "what we do not have" ledger. The heading carries the
    // negation, the list items are bare nouns.
    '"Uptime history"',
    '"An SLA"',
  ];
  const NEG = /\b(not|no|never|without|isn'?t|aren'?t|don'?t|doesn'?t|zero|lack|nothing|none|neither|nor|avoid|unverified|cannot|can'?t)\b/i;
  const patterns = [
    [/\btrusted by\b/i, "trusted-by strip"],
    [/\bSOC ?2\b|\bISO ?27001\b|\bHIPAA\b|\bFedRAMP\b/i, "compliance badge"],
    [/\b9[59]\.\d+ ?%|\buptime\b/i, "uptime claim"],
    [/\bSLA\b/, "SLA claim"],
    [/\btestimonial|\bcase stud/i, "testimonial or case study"],
    [/you(?:'| a)?re #\d+|position #\d+|\b#\d+ in (line|queue)\b/i, "fabricated queue position"],
    [/\bcheapest\b|\blowest price\b|\bbeats? every\b|\bunbeatable\b|\bbest price\b|\bcheaper than (everyone|anyone)\b/i, "superlative price claim"],
    [/\bas seen in\b|\bfeatured in\b|\bwe won\b|\bSeries [A-C]\b|\bbacked by\b|\braised \$/i, "press, award or funding claim"],
    [/unsplash|pexels|shutterstock|gettyimages/i, "stock photography"],
    [/\b\d{3,}\+? (customers|GPUs deployed|users|teams)\b/i, "statistics counter"],
  ];
  const hits = [];
  for (const f of files) {
    read(f).split("\n").forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return;
      if (ACKNOWLEDGED.some((a) => line.includes(a))) return;
      for (const [re, why] of patterns) {
        if (!re.test(line)) continue;
        if (NEG.test(line)) continue; // disclaimed, not claimed
        hits.push(`${why}: ${f}:${i + 1}  ${t.slice(0, 80)}`);
      }
    });
  }
  check("no forbidden claim asserted", hits);
}

/* ---- 6. identity is renameable from config/site.ts alone --------------- */
{
  const cfg = read("config/site.ts");
  const name = cfg.match(/name:\s*"([^"]+)"/)?.[1];
  const hits = [];
  for (const f of files) {
    if (f === "config/site.ts") continue;
    read(f).split("\n").forEach((line, i) => {
      if (name && new RegExp(`\\b${name}\\b`, "i").test(line))
        hits.push(`${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
    });
  }
  check(`company name "${name}" appears only in config/site.ts`, hits);
}

/* ---- 7. every published rate carries a source and an as-of date -------- */
{
  const pr = read("content/pricing.ts");
  const block = pr.slice(pr.indexOf("PRICE_ROWS"));
  const rows = block.split(/\n  \{/).slice(1);
  const bad = [];
  for (const row of rows) {
    const id = row.match(/id:\s*"([^"]+)"/)?.[1];
    if (!id) continue;
    if (!/sourceId:|source:/.test(row)) bad.push(`row "${id}" has no source`);
    if (!/asOf|AS_OF/.test(row) && !/sourceId:/.test(row)) bad.push(`row "${id}" has no as-of date`);
  }
  if (!rows.length) bad.push("could not parse PRICE_ROWS — check the shape of content/pricing.ts");
  check("every rate row carries a source and a date", bad);

  // Every sourceId referenced anywhere must resolve to an entry in SOURCES
  // that carries both a URL and an as-of date.
  const src = read("content/sources.ts");
  const entries = [...src.matchAll(/^ {2}([\w-]+):\s*\{([\s\S]*?)^ {2}\},/gm)].map(([, id, body]) => ({ id, body }));
  const referenced = new Set(
    files.flatMap((f) => [...read(f).matchAll(/sourceId:\s*"([^"]+)"|source\("([^"]+)"\)/g)].map((m) => m[1] ?? m[2]))
  );
  const byId = new Map(entries.map((e) => [e.id, e.body]));
  const bad2 = [];
  for (const id of referenced) {
    if (!byId.has(id)) bad2.push(`sourceId "${id}" is referenced but not defined in content/sources.ts`);
  }
  // A third-party figure must be linkable. Our own survey and our own rate
  // legitimately have no URL, but must still say so explicitly and be dated.
  const NEEDS_URL = ["rate-card", "vendor-spec"];
  for (const { id, body } of entries) {
    const kind = body.match(/kind:\s*"([^"]+)"/)?.[1];
    const url = body.match(/url:\s*(null|"[^"]*")/)?.[1];
    if (!body.match(/label:\s*"/)) bad2.push(`source "${id}" has no label`);
    if (!body.match(/accessed:\s*"\d{4}-\d{2}-\d{2}"/)) bad2.push(`source "${id}" has no ISO accessed date`);
    if (!body.match(/note:\s*"/)) bad2.push(`source "${id}" has no note explaining what it is`);
    if (!kind) bad2.push(`source "${id}" has no kind`);
    if (!url) bad2.push(`source "${id}" does not declare a url (use null if first-party)`);
    else if (NEEDS_URL.includes(kind) && !url.startsWith('"http'))
      bad2.push(`source "${id}" is ${kind} and must carry a public URL`);

    // A URL proves a citation EXISTS. `quotes` is what makes it CHECKABLE:
    // the literal figures read off that page, plus any arithmetic applied.
    //
    // This check exists because the previous version passed while five specs
    // cited an NVIDIA marketing page that published none of them. A structural
    // check that only asks "is there a link?" certifies that failure as fine.
    if (url && url.startsWith('"http')) {
      const quotes = body.match(/quotes:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
      const items = [...quotes.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      if (items.length === 0)
        bad2.push(
          `source "${id}" has a URL but no quotes[] — record the figures actually read off that page`
        );
      for (const q of items) {
        if (!/\d/.test(q)) bad2.push(`source "${id}" quote carries no figure: "${q}"`);
      }
    }
  }
  if (!entries.length) bad2.push("could not parse SOURCES — check the shape of content/sources.ts");
  check("every external source records the figures actually read off the page", bad2);
}

/* ---- 8. motion base state is the final state --------------------------- */
{
  const hits = [];
  for (const f of css) {
    const src = read(f);
    src.split("\n").forEach((line, i) => {
      if (!/^\s*animation:/.test(line) || /animation:\s*none/.test(line)) return;
      if (/\bforwards\b/.test(line))
        hits.push(`fill-mode forwards  ${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
      if (!/\bbackwards\b/.test(line) && !/infinite|steps\(/.test(line))
        hits.push(`no backwards fill   ${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
    });
    // opacity:0 as a resting declaration, outside @keyframes. A visually
    // hidden native input behind a custom control is the one legitimate use.
    let inKeyframes = 0;
    let selector = "";
    src.split("\n").forEach((line, i) => {
      if (/@keyframes/.test(line)) inKeyframes = 1;
      if (inKeyframes && /^\}/.test(line)) inKeyframes = 0;
      if (/\{\s*$/.test(line)) selector = line.trim();
      if (inKeyframes) return;
      if (!/^\s*opacity:\s*0;\s*$/.test(line)) return;
      if (/\binput\s*\{$/.test(selector)) return; // hidden control, not a base state
      hits.push(`opacity:0 at rest   ${f}:${i + 1}  under ${selector}`);
    });
  }
  check("no animation rests at an offset", hits);

  const globals = read("app/globals.css");
  check(
    "a global reduced-motion stop exists",
    /@media \(prefers-reduced-motion: reduce\)/.test(globals) && /animation-duration:\s*0\.001ms\s*!important/.test(globals)
      ? []
      : ["app/globals.css has no catch-all reduced-motion block"]
  );
}

/* ---- 9. animated client components are reduced-motion aware ------------
   Either directly, or by being mounted through a gate that is. A bare
   requestAnimationFrame throttling a scroll listener is state readout, not
   motion, so only real animation drivers count here. */
{
  const gates = components.filter((f) => /SceneMount|Field\.tsx|SmoothScroll/.test(f));
  const hits = gates.filter((f) => !/prefersReducedMotion|prefers-reduced-motion|reduced/i.test(read(f)))
    .map((f) => `mount gate ${f} has no reduced-motion check`);
  if (!gates.length) hits.push("no mount gate found — scenes may be unguarded");
  for (const f of components) {
    const s = read(f);
    if (!/\bgsap\b|useFrame|ScrollTrigger/.test(s)) continue;
    if (/prefersReducedMotion|prefers-reduced-motion|reduced/i.test(s)) continue;
    if (/Scene\.tsx$/.test(f)) continue; // mounted only via SceneMount, which gates
    hits.push(f);
  }
  check("animated components honour reduced motion", hits);
}

/* ---- 10. the form never depends on motion ------------------------------ */
{
  const forms = components.filter((f) => /ReservationForm|OrderCard|Console/.test(basename(f)));
  const hits = [];
  for (const f of forms) {
    const s = read(f);
    if (/gsap|ScrollTrigger|useFrame|Canvas/.test(s)) hits.push(`${f} imports a motion or 3D dependency`);
    if (!/method="post"/.test(s)) hits.push(`${f} has no native POST fallback`);
    if (!/noValidate/.test(s)) hits.push(`${f} does not hand validation to the app`);
  }
  // One form now: the site has a single direction. Kept as an assertion so a
  // silent rename of Console.tsx cannot make this whole check vacuously pass.
  if (forms.length !== 1) hits.push(`expected 1 form component, found ${forms.length}`);
  check("reservation form works without motion or JS", hits);
}

/* ---- report ------------------------------------------------------------ */
console.log(`scanned ${files.length} files across ${ROOTS.join(", ")}\n`);
for (const p of passes) console.log(`  ok    ${p}`);
console.log("");
for (const f of fails) console.log(`  FAIL  ${f}\n`);
console.log(fails.length ? `${fails.length} of ${passes.length + fails.length} checks failing` : `all ${passes.length} checks pass`);
process.exit(fails.length ? 1 : 0);
