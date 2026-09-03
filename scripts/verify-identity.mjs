/**
 * Identity verification.
 *
 * `config/site.ts` is the single source of the company name. This script proves
 * it, by failing if any candidate name appears as a literal anywhere else in
 * the source tree. Run it after a rename, and in CI before a deploy.
 *
 *   node scripts/verify-identity.mjs          # fail on any leak
 *   node scripts/verify-identity.mjs --quiet  # exit code only
 *
 * Also reports launch-blocking placeholders (example.com, empty env, unset
 * social handles) as warnings — those do not fail the run.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const QUIET = process.argv.includes("--quiet");

const SCAN_DIRS = ["app", "components", "content", "lib", "scripts", "config"];
const SCAN_EXT = /\.(tsx?|jsx?|mjs|cjs|css|json|md)$/;
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "shots", "out", "build"]);

/** This script names the candidates in its own output; it is not a leak. */
const SKIP_FILES = new Set(["scripts/verify-identity.mjs"]);

/** The one file allowed to contain the name. */
const SOURCE_OF_TRUTH = join("config", "site.ts");

// --- read the candidates straight out of the config -----------------------

const siteSrc = readFileSync(join(ROOT, SOURCE_OF_TRUTH), "utf8");

const candidatesMatch = siteSrc.match(/NAME_CANDIDATES\s*=\s*\[([^\]]*)\]/s);
if (!candidatesMatch) {
  console.error("✗ Could not find NAME_CANDIDATES in config/site.ts");
  process.exit(2);
}
const candidates = [...candidatesMatch[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);

const activeMatch = siteSrc.match(/^\s*name:\s*["'`]([^"'`]+)["'`]/m);
const activeName = activeMatch?.[1] ?? null;

const names = [...new Set([...candidates, activeName].filter(Boolean))];
if (names.length === 0) {
  console.error("✗ No names found to check.");
  process.exit(2);
}

// --- walk ------------------------------------------------------------------

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (SCAN_EXT.test(entry)) yield full;
  }
}

const leaks = [];
const warnings = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file);
    const relPosix = rel.split(sep).join("/");
    if (relPosix === SOURCE_OF_TRUTH.split(sep).join("/")) continue;
    if (SKIP_FILES.has(relPosix)) continue;

    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const name of names) {
        // Word boundaries: matches the name followed by punctuation or
        // possessives, but not when it is a substring of a longer word.
        const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
        if (re.test(line)) {
          leaks.push({ file: rel, line: i + 1, name, text: line.trim().slice(0, 120) });
        }
      }
    });
  }
}

// --- launch placeholders (warnings, not failures) --------------------------

const placeholderChecks = [
  [/domain:\s*["'`]example\.com["'`]/, "config/site.ts — domain is still example.com"],
  [/@example\.com/, "config/site.ts — email addresses are still @example.com"],
  [/linkedin:\s*["'`]["'`]/, "config/site.ts — no LinkedIn handle set (link will not render)"],
  [/legalName:\s*["'`]/, "config/site.ts — legalName is a placeholder until entity formation completes"],
];
for (const [re, msg] of placeholderChecks) {
  if (re.test(siteSrc)) warnings.push(msg);
}

try {
  const env = readFileSync(join(ROOT, ".env.example"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=\s*$/);
    if (m) warnings.push(`.env.example — ${m[1]} is unset`);
  }
} catch {}

// --- report ----------------------------------------------------------------

if (!QUIET) {
  console.log(`Identity check — active name: ${activeName ?? "(unset)"}`);
  console.log(`Candidates scanned: ${names.join(", ")}`);
  console.log(`Source of truth: ${SOURCE_OF_TRUTH}\n`);
}

if (leaks.length > 0) {
  console.error(`✗ ${leaks.length} hardcoded name reference(s) outside ${SOURCE_OF_TRUTH}:\n`);
  for (const l of leaks) console.error(`  ${l.file}:${l.line}  "${l.name}"\n      ${l.text}`);
  console.error(`\n  Import SITE from "@/config/site" instead of typing the name.`);
}

if (leaks.length === 0 && !QUIET) {
  console.log("✓ No hardcoded name references. Rename is safe.");
}

if (warnings.length > 0 && !QUIET) {
  console.warn(`\n⚠ ${warnings.length} launch placeholder(s):\n`);
  for (const w of warnings) console.warn(`  · ${w}`);
}

process.exit(leaks.length > 0 ? 1 : 0);
