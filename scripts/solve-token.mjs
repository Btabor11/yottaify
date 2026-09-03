/**
 * Nudges a token along its own hue until it clears a contrast target against
 * the darkest ground it has to sit on, and prints the nearest passing value.
 *
 * node scripts/solve-token.mjs <hex> <groundHex...> --target 4.5
 *
 * Dev-only tooling. Not part of the shipped site.
 */
const args = process.argv.slice(2);
const target = Number(args[args.indexOf("--target") + 1] ?? 4.5);
const hexes = args.filter((a) => a.startsWith("#"));
const [ink, ...grounds] = hexes;

const srgb = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const worst = (hex) => Math.min(...grounds.map((g) => ratio(hex, g)));
const toHex = (rgb) => "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const parse = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// Which way to move: away from the ground we are failing hardest against.
const base = parse(ink);
const goDarker = lum(ink) > lum(grounds[0]) ? false : true;

let best = null;
for (let step = 0; step <= 120; step++) {
  const k = goDarker ? 1 - step / 200 : 1 + step / 200;
  // Scale toward black or toward white, preserving relative channel balance.
  const rgb = goDarker ? base.map((v) => v * k) : base.map((v) => v + (255 - v) * (step / 200));
  const hex = toHex(rgb);
  if (worst(hex) >= target) {
    best = hex;
    break;
  }
}

console.log(`  from  ${ink}   worst ${worst(ink).toFixed(2)}:1  against ${grounds.join(" ")}`);
if (best) {
  console.log(`  to    ${best}   worst ${worst(best).toFixed(2)}:1   target ${target}:1`);
  for (const g of grounds) console.log(`          vs ${g}  ${ratio(best, g).toFixed(2)}:1`);
} else {
  console.log(`  no value on this ramp reaches ${target}:1`);
}
