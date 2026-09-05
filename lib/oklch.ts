/**
 * Minimal OKLCH, enough to reproduce `color-mix(in oklch longer hue, …)` on
 * the CPU so the canvas travels the same curve as the CSS.
 *
 * Björn Ottosson's OKLab, sRGB in and out. No gamut mapping beyond a clamp,
 * which is fine for the two poles this site uses: both are inside sRGB and
 * the path between them stays inside as well.
 */

export type RGB = [number, number, number];
export type LCH = [number, number, number];

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToOklch([r, g, b]: RGB): LCH {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

export function oklchToRgb([L, C, H]: LCH): RGB {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return [clamp(linearToSrgb(lr)), clamp(linearToSrgb(lg)), clamp(linearToSrgb(lb))];
}

/**
 * Mix two sRGB hex colours in OKLCH at `t`, taking the *longer* arc around the
 * hue wheel — the CSS `longer hue` interpolation method.
 */
export function mixOklchLonger(fromHex: string, toHex: string, t: number): RGB {
  const [L1, C1, H1] = rgbToOklch(hexToRgb(fromHex));
  const [L2, C2, H2] = rgbToOklch(hexToRgb(toHex));
  let d = H2 - H1;
  // Longer arc: if the short way is under 180°, go the other way round.
  if (d > -180 && d < 180) d = d > 0 ? d - 360 : d + 360;
  const H = H1 + d * t;
  return oklchToRgb([L1 + (L2 - L1) * t, C1 + (C2 - C1) * t, ((H % 360) + 360) % 360]);
}

/** Same as above, sampled into an RGB byte ramp of `n` stops. */
export function rampBytes(fromHex: string, toHex: string, n = 256): Uint8Array {
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const [r, g, b] = mixOklchLonger(fromHex, toHex, i / (n - 1));
    out[i * 4] = Math.round(r * 255);
    out[i * 4 + 1] = Math.round(g * 255);
    out[i * 4 + 2] = Math.round(b * 255);
    out[i * 4 + 3] = 255;
  }
  return out;
}

/** WCAG relative luminance and contrast, for checking a ramp against a ground. */
export function contrast(a: RGB, b: RGB): number {
  const lum = ([r, g, bb]: RGB) => 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(bb);
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
