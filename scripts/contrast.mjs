/**
 * Contrast table for the token palettes. Prints every ink against every
 * ground so a failing pair is visible before axe finds it in a component.
 *
 * node scripts/contrast.mjs
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { readFileSync } from "node:fs";

const SHEETS = {
  site: "app/(site)/d3.css",
  legal: "app/legal/legal.css",
};

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const GROUNDS = ["--bg", "--surface", "--surface-2"];
const INKS = ["--ink", "--ink-2", "--ink-3", "--accent", "--accent-2", "--caution", "--hot", "--alarm", "--volt", "--plasma"];
const BORDERS = ["--edge", "--rule-strong", "--rule"];

for (const [name, path] of Object.entries(SHEETS)) {
  const src = readFileSync(path, "utf8");
  const tok = {};
  for (const m of src.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) tok[m[1]] ??= m[2];

  console.log(`\n${name}  ${path}`);
  const grounds = GROUNDS.filter((g) => tok[g]);
  const pad = (s, n) => String(s).padEnd(n);
  console.log("  " + pad("", 14) + grounds.map((g) => pad(g, 16)).join(""));

  for (const list of [INKS, BORDERS]) {
    for (const ink of list) {
      if (!tok[ink]) continue;
      // Text needs 4.5:1; a border or large figure needs 3:1.
      const min = list === BORDERS ? 3 : 4.5;
      const cells = grounds.map((g) => {
        const r = ratio(tok[ink], tok[g]);
        const flag = r >= min ? "  " : r >= 3 ? " ~" : " ✗";
        return pad(`${r.toFixed(2)}:1${flag}`, 16);
      });
      console.log("  " + pad(ink, 14) + cells.join(""));
    }
    console.log("  " + "-".repeat(14 + grounds.length * 16));
  }
}
console.log("\n  4.5:1 body text · 3:1 large text, borders and UI · ~ = passes 3:1 only · ✗ = fails both\n");
