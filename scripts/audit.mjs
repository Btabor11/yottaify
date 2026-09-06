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
    // A palette names its sheet with `@sheet d3.css` in its header; otherwise the parent directory names it.
    const src = read(f);
    const named = src.match(/@sheet\s+([\w.()-]+\.css)/)?.[1];
    const want = named ?? `${basename(dirname(f))}.css`;
    const sheet = css.find((c) => basename(c) === want);
    if (!sheet) {
      hits.push(`${f}: no matching ${want} to check against`);
      continue;
    }
    const sheetSrc = read(sheet);
    for (const line of src.split("\n")) {
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
  // Grounds that actually carry text, per sheet and per token block. d3 has
  // two blocks — `.d3` (dark) and `.d3-paper` (paper) — and both are checked,
  // because a component styled with semantic tokens lands on either.
  const TEXT_GROUNDS = {
    d3: { blocks: [".d3", ".d3-paper"], grounds: ["--bg", "--surface", "--surface-2", "--row-ours"] },
    legal: { blocks: [".legal"], grounds: ["--bg", "--surface"] },
    // The desk plates itself in four steps, and a token is only safe if it
    // clears on the deepest of them.
    admin: { blocks: [".admin"], grounds: ["--bg", "--surface", "--surface-2", "--surface-3"] },
  };
  const INKS = ["--ink", "--ink-2", "--ink-3", "--accent", "--accent-2", "--caution", "--hot", "--alarm", "--ember", "--hbm", "--shoal", "--deep"];
  const hits = [];
  /** Tokens declared inside `selector { … }`, first block only. */
  const blockTokens = (src, selector) => {
    const start = src.indexOf(`${selector} {`);
    if (start < 0) return null;
    const end = src.indexOf("\n}", start);
    const tok = {};
    for (const m of src.slice(start, end).matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) tok[m[1]] ??= m[2];
    return tok;
  };
  for (const [dir, { blocks, grounds }] of Object.entries(TEXT_GROUNDS)) {
    const sheet = css.find((c) => basename(c) === `${dir}.css`);
    if (!sheet) continue;
    const src = read(sheet);
    for (const block of blocks) {
      const tok = blockTokens(src, block);
      if (!tok) {
        if (block === blocks[0]) hits.push(`${dir}: no "${block} {" token block found`);
        continue;
      }
      for (const ink of INKS) {
        if (!tok[ink]) continue;
        for (const g of grounds) {
          if (!tok[g]) continue;
          const r = ratio(tok[ink], tok[g]);
          if (r < 4.5) hits.push(`${block}: ${ink} ${tok[ink]} on ${g} ${tok[g]} is ${r.toFixed(2)}:1, needs 4.5:1`);
        }
      }
      for (const g of grounds) {
        if (!tok["--edge"] || !tok[g]) continue;
        const r = ratio(tok["--edge"], tok[g]);
        if (r < 3) hits.push(`${block}: --edge on ${g} is ${r.toFixed(2)}:1, needs 3:1 as a control border`);
      }
    }
  }
  check("every ink clears 4.5:1 and --edge clears 3:1, on both grounds", hits);

  /* ---- 2b'. the live colour, sampled along its travel -------------------
     `--live` is a color-mix in OKLCH between --ember and --hbm, the long way
     round the hue wheel, and it is used as text (voice clauses, lead figures).
     Reproduce the curve here and check every stop against every ground. */
  {
    const rampHits = [];
    const s2l = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const l2s = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
    const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const rgb2hex = (rgb) => "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
    const toLch = ([r, g, b]) => {
      const [lr, lg, lb] = [s2l(r), s2l(g), s2l(b)];
      const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
      const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
      const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
      const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
      const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
      const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
      let H = (Math.atan2(bb, a) * 180) / Math.PI;
      if (H < 0) H += 360;
      return [L, Math.hypot(a, bb), H];
    };
    const toRgb = ([L, C, H]) => {
      const h = (H * Math.PI) / 180;
      const a = C * Math.cos(h);
      const b = C * Math.sin(h);
      const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
      const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
      const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
      return [
        l2s(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        l2s(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        l2s(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
      ];
    };
    const mixLonger = (f, t, x) => {
      const [L1, C1, H1] = toLch(hex2rgb(f));
      const [L2, C2, H2] = toLch(hex2rgb(t));
      let d = H2 - H1;
      if (d > -180 && d < 180) d = d > 0 ? d - 360 : d + 360;
      return rgb2hex(toRgb([L1 + (L2 - L1) * x, C1 + (C2 - C1) * x, (((H1 + d * x) % 360) + 360) % 360]));
    };
    const sheet = css.find((c) => basename(c) === "d3.css");
    if (sheet) {
      const src = read(sheet);
      for (const block of [".d3", ".d3-paper"]) {
        const tok = blockTokens(src, block);
        if (!tok || !tok["--ember"] || !tok["--hbm"]) continue;
        for (let i = 0; i <= 40; i++) {
          const c = mixLonger(tok["--ember"], tok["--hbm"], i / 40);
          for (const g of ["--bg", "--surface", "--surface-2"]) {
            if (!tok[g]) continue;
            const r = ratio(c, tok[g]);
            if (r < 4.5) rampHits.push(`${block}: --live at ${(i / 40).toFixed(3)} (${c}) on ${g} is ${r.toFixed(2)}:1`);
          }
        }
      }
    }
    check("the live colour clears 4.5:1 at every point of its travel", rampHits);
  }
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
    [pr, "7.85", "median low $7.85"],
    [pr, "7.87", "median high $7.87"],
    [pr, "6.50", "neocloud low $6.50"],
    [pr, "6.95", "neocloud high $6.95"],
    [pr, "7.89", "lowest verified in stock $7.89"],
    [pr, "15.00", "Oracle $15.00"],
    [pr, "17.80", "AWS $17.80"],
    [pr, "4.25", "reserved low $4.25"],
    [pr, "5.62", "reserved high $5.62"],
    [op, "FLEET_TOTAL = 48", "fleet = 48 B300s"],
    [op, "GPUS_PER_NODE = 8", "8 GPUs per node"],
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
      if (/\b(288|2,?304|7\.89|17\.80|15\.00)\b/.test(code) && !/SOURCE|source|href/.test(code))
        hits.push(`spec literal   ${f}:${i + 1}  ${t.slice(0, 80)}`);
    });
  }
  check("no price or spec literal typed into a component", hits);
}

/* ---- 4b. our own rate is not published anywhere ------------------------
   The site deliberately does not print a per-GPU-hour figure for us: the
   number is quoted on the call, against the job. That is a policy, and a
   policy that lives only in someone's memory gets broken by the next person
   who adds a stat tile. So it is checked.

   Note this is the *inverse* of check 3. Third-party rates must be present in
   content/; ours must be absent from the entire tree. */
{
  const hits = [];
  // Trailing \w rules out `max-w-[6.75em]` and friends: a CSS measure that
  // happens to share the digits is not a leak.
  const RATE = /(?<![.\d])6\.75(?![\w%])/;
  for (const f of files) {
    read(f).split("\n").forEach((line, i) => {
      if (RATE.test(line)) hits.push(`our rate as a literal  ${f}:${i + 1}  ${line.trim().slice(0, 80)}`);
    });
  }

  const pr = read("content/pricing.ts");
  if (/\bOUR_RATE\b|export const RATE\b/.test(pr))
    hits.push('content/pricing.ts still exports a rate constant — the figure is quoted, not published');
  if (/\bisUs\b/.test(pr))
    hits.push('content/pricing.ts still carries an "isUs" row flag — the table has no row for us');
  if (/id:\s*"ours"[\s\S]{0,400}?usdPerGpuHour/.test(pr))
    hits.push('content/pricing.ts has a priced "ours" row in PRICE_ROWS');
  if (!/export const QUOTE\b/.test(pr))
    hits.push("content/pricing.ts must export QUOTE — the position we state instead of a figure");

  // JSON-LD is the easiest place to leak a number without seeing it on screen.
  const schema = read("components/shared/pricingSchema.ts");
  if (/\bprice:\s*[\d"']/.test(schema))
    hits.push("components/shared/pricingSchema.ts publishes a price in structured data");

  // Same for the market snapshot, which is serialised to the client whole.
  if (/\bourRate\b/.test(read("lib/market/types.ts")))
    hits.push("lib/market/types.ts puts our rate in the client snapshot payload");

  check("our own per-GPU-hour rate appears nowhere", hits);
}

/* ---- 4c. every certification is marked as not held ---------------------
   content/assurance.ts names frameworks a buyer will ask for. Naming them is
   fine; the failure mode is one of them quietly reading as held — which is
   also the single fastest way to fail a real procurement review.

   The structure is what makes the file safe to publish, so the structure is
   what gets checked: every entry carries `held: false`, every status is one
   the vocabulary allows, and none of the allowed statuses mean "held". */
{
  const hits = [];
  const src = read("content/assurance.ts");

  const vocab = src.match(/export const CERT_STATUS = \{([\s\S]*?)\n\} as const;/)?.[1] ?? "";
  const statuses = [...vocab.matchAll(/^\s*"?([a-z-]+)"?:/gm)].map((m) => m[1]);
  if (statuses.length === 0) hits.push("CERT_STATUS vocabulary not found in content/assurance.ts");
  for (const s of statuses)
    if (/held|certified|awarded|compliant|achieved/i.test(s))
      hits.push(`CERT_STATUS."${s}" reads as an achievement — no status may mean "held"`);

  const block = src.match(/export const CERTIFICATIONS[\s\S]*?\n\];/)?.[0] ?? "";
  if (!block) hits.push("CERTIFICATIONS array not found in content/assurance.ts");

  const entries = [...block.matchAll(/\bstatus:\s*"([a-z-]+)"/g)].map((m) => m[1]);
  const held = [...block.matchAll(/\bheld:\s*(true|false)\b/g)].map((m) => m[1]);
  if (held.includes("true")) hits.push('a certification is marked held: true — none are held');
  if (entries.length !== held.length)
    hits.push(`${entries.length} certification statuses but ${held.length} held: flags — every entry declares one`);
  for (const s of entries)
    if (!statuses.includes(s)) hits.push(`certification status "${s}" is outside CERT_STATUS`);

  // The disclaimer sits above the table and is what makes it publishable.
  const disclaimer = src.match(/disclaimer:\s*\n?\s*"([^"]+)"/)?.[1] ?? "";
  if (!/\bnot\b|\bno\b|\bnone\b|\bnothing\b/i.test(disclaimer))
    hits.push("the roadmap disclaimer does not disclaim anything");

  check("every certification is named as planned, never as held", hits);
}

/* ---- 4d. withdrawn electrical figures stay withdrawn -------------------
   The load, current and service figures the site used to publish were
   calculated for a two-node build. The fleet is six nodes, so they are wrong,
   and re-stating them scaled would be an estimate wearing a measurement's
   clothes. They come back when the service is specified and metered — which
   means editing content/operator.ts deliberately, not by a figure drifting
   back into a component. See the POWER header there. */
{
  const hits = [];
  const op = read("content/operator.ts");
  const power = op.match(/export const POWER = \{[\s\S]*?\n\} as const;/)?.[0] ?? "";
  if (!power) hits.push("POWER block not found in content/operator.ts");
  for (const key of ["loadKw", "amps", "voltage", "phase", "service"])
    if (new RegExp(`^\\s*${key}:`, "m").test(power))
      hits.push(`POWER.${key} is back — the six-node service is not specified yet`);

  const STALE = /(?<![.\d])(35 ?kW|97 ?A\b|208 ?V)/;
  for (const f of files) {
    read(f).split("\n").forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return;
      if (STALE.test(line)) hits.push(`stale electrical figure  ${f}:${i + 1}  ${t.slice(0, 80)}`);
    });
  }
  check("the two-node electrical figures have not crept back", hits);
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
    '"An SLA"',
    '"Certifications in hand"',
    // Options in the follow-up's "what do you need from a provider" multi-select.
    // The client is telling us what they need; we are not claiming to have it.
    '{ value: "soc2", label: "SOC 2 report" }',
    '{ value: "iso27001", label: "ISO 27001" }',
    '{ value: "hipaa", label: "HIPAA" }',
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
  // A claim has to reach a reader. Server-only code and the market data
  // fetchers pick the cheapest listing *as data*; that is a variable, not
  // a sentence. Everything that renders is still scanned.
  const NEVER_RENDERED = /^lib\/(server|market)\//;
  // The certification roadmap has to be able to write "SOC 2" — that is its
  // subject. It is exempt from the compliance-badge pattern ONLY, and only
  // because check 4c proves structurally that every framework in it is marked
  // as not held. Remove that check and this exemption becomes a lie.
  const ROADMAP = "content/assurance.ts";
  for (const f of files) {
    if (NEVER_RENDERED.test(f)) continue;
    read(f).split("\n").forEach((line, i) => {
      const t = line.trim();
      if (t.startsWith("*") || t.startsWith("//") || t.startsWith("/*")) return;
      if (ACKNOWLEDGED.some((a) => line.includes(a))) return;
      for (const [re, why] of patterns) {
        if (f === ROADMAP && why === "compliance badge") continue;
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
  // that carries both a URL and an as-of date. The market pipeline under
  // lib/market keeps its own tracker registry (lib/market/sources) whose ids
  // are not content sources, so it is not scanned here.
  const src = read("content/sources.ts");
  const entries = [...src.matchAll(/^ {2}([\w-]+):\s*\{([\s\S]*?)^ {2}\},/gm)].map(([, id, body]) => ({ id, body }));
  const referenced = new Set(
    files
      .filter((f) => !f.startsWith("lib/market/"))
      .flatMap((f) => [...read(f).matchAll(/sourceId:\s*"([^"]+)"|source\("([^"]+)"\)/g)].map((m) => m[1] ?? m[2]))
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
