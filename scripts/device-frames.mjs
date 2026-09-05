/**
 * Frame pipeline for the hero's device sequence.
 *
 * Takes the generated assembly video (exploded module → assembled module on a
 * pure black ground), keys the black to alpha, subsamples it to a fixed number
 * of frames, and writes them as WebP with alpha at every width the component
 * serves. The result is a scrubbable image sequence that composites over any
 * ground without blend-mode tricks.
 *
 *   node scripts/device-frames.mjs --in=/path/to/assembly.mp4 [--out=public/device]
 *        [--count=72] [--sizes=1280,720] [--from=0] [--to=last]
 *        [--black=16] [--band=6] [--soft=12] [--q=0.82]
 *
 * Needs ffmpeg on PATH (the key is ffmpeg's lumakey) and Playwright's Chromium
 * for the WebP encode — Chromium is the one encoder already installed here
 * that writes lossy WebP with an alpha plane.
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const input = arg("in");
if (!input) {
  console.error("usage: node scripts/device-frames.mjs --in=video.mp4 [--out=public/device] [--count=72] [--sizes=1280,720]");
  process.exit(1);
}
const out = arg("out", "public/device");
const count = Number(arg("count", "72"));
const sizes = arg("sizes", "1280,720").split(",").map(Number);
// The key works on the clip's own luma, which is limited-range: black is Y=16,
// not 0. `black` is that level, `band` how far either side of it still counts
// as background, `soft` how many more levels ramp to fully opaque. 8-bit units.
const black = Number(arg("black", "16"));
const band = Number(arg("band", "6"));
const soft = Number(arg("soft", "12"));
const quality = Number(arg("q", "0.82"));

/* ---- 1. how many frames does the source have -------------------------- */
const probe = execFileSync("ffprobe", [
  "-v", "error", "-select_streams", "v:0", "-count_frames",
  "-show_entries", "stream=width,height,nb_read_frames", "-of", "csv=p=0", input,
]).toString().trim();
const [srcW, srcH, total] = probe.split(",").map(Number);
if (!Number.isFinite(total) || total < 2) throw new Error(`could not count frames in ${input}: "${probe}"`);
// Keep the source aspect; the component reads the real ratio from the manifest.
const heightFor = (w) => Math.round((w * srcH) / srcW / 2) * 2;

// Generated clips hold still at both ends. `--from`/`--to` trim to the span
// that actually moves so the scrub is uniform; the ends are always included.
const from = Number(arg("from", "0"));
const to = Number(arg("to", String(total - 1)));
if (from < 0 || to > total - 1 || to - from < 1) throw new Error(`bad span ${from}..${to} for ${total} frames`);
const picks = Array.from({ length: count }, (_, i) => from + Math.round((i * (to - from)) / (count - 1)));
const select = picks.map((n) => `eq(n\\,${n})`).join("+");

const work = mkdtempSync(join(tmpdir(), "device-frames-"));
console.log(`source ${input}: ${total} frames, span ${from}..${to} → ${count} picks · work dir ${work}`);

/* ---- 2. key + scale + extract, one pass per size ---------------------- */
for (const w of sizes) {
  const h = heightFor(w);
  const dir = join(work, String(w));
  mkdirSync(dir, { recursive: true });
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", input,
    "-vf",
    [
      `select='${select}'`,
      `scale=${w}:${h}:flags=lanczos`,
      // Keyed in the clip's own YUV, before any RGB conversion, so the levels
      // above mean what they say. lumakey takes fractions of full scale.
      `lumakey=threshold=${(black / 255).toFixed(4)}:tolerance=${(band / 255).toFixed(4)}:softness=${(soft / 255).toFixed(4)}`,
      "format=rgba",
    ].join(","),
    "-vsync", "vfr", join(dir, "f%03d.png"),
  ]);
  const n = readdirSync(dir).filter((f) => f.endsWith(".png")).length;
  console.log(`  ${w}×${h}: ${n} keyed PNG frames`);
  if (n !== count) throw new Error(`expected ${count} frames at ${w}, got ${n}`);
}

/* ---- 3. PNG → WebP with alpha, via Chromium's encoder ----------------- */
const browser = await chromium.launch();
const page = await browser.newPage();
let bytes = 0;
for (const w of sizes) {
  const dir = join(work, String(w));
  const dest = join(out, String(w));
  mkdirSync(dest, { recursive: true });
  const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  for (const [i, f] of files.entries()) {
    // Handed over as a data URL: a file:// image taints the canvas and
    // Chromium then refuses to export it.
    const src = `data:image/png;base64,${readFileSync(join(dir, f)).toString("base64")}`;
    const b64 = await page.evaluate(
      async ([src, q]) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        const blob = await new Promise((r) => c.toBlob(r, "image/webp", q));
        const buf = await blob.arrayBuffer();
        let s = "";
        const u8 = new Uint8Array(buf);
        for (let k = 0; k < u8.length; k += 0x8000) s += String.fromCharCode(...u8.subarray(k, k + 0x8000));
        return btoa(s);
      },
      [src, quality],
    );
    const buf = Buffer.from(b64, "base64");
    bytes += buf.length;
    // ffmpeg numbers from 1; the sequence is zero-based on the site.
    writeFileSync(join(dest, `f${String(i).padStart(3, "0")}.webp`), buf);
  }
  // The exploded still is frame zero, the assembled still is the last one.
  copyFileSync(join(dest, "f000.webp"), join(out, `exploded-${w}.webp`));
  copyFileSync(join(dest, `f${String(files.length - 1).padStart(3, "0")}.webp`), join(out, `assembled-${w}.webp`));
  console.log(`  ${w}: ${files.length} WebP frames → ${dest}`);
}
await browser.close();
rmSync(work, { recursive: true, force: true });

const manifest = {
  count,
  sizes,
  // width / height of every frame, so the component can reserve the box.
  aspect: Number((srcW / srcH).toFixed(4)),
  heights: Object.fromEntries(sizes.map((w) => [w, heightFor(w)])),
  source: input.split("/").pop(),
  span: [from, to],
  key: { black, band, soft },
  quality,
};
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${count} frames × ${sizes.length} sizes · ${(bytes / 1024 / 1024).toFixed(2)} MB total · manifest → ${out}/manifest.json`);
