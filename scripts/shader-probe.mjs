/**
 * Render the hero fragment shader in isolation and read what it outputs.
 *
 *   node scripts/shader-probe.mjs
 *
 * The shader source and palette are pulled straight out of the component so
 * this cannot drift from what ships. Renders into a canvas with
 * preserveDrawingBuffer so the pixels are actually readable, then reports
 * luminance across the frame. Dev-only diagnostic.
 */
import { readFileSync } from "node:fs";
import { assertHardware, launchGpu } from "./launch.mjs";

const src = readFileSync("components/d3/BusScene.tsx", "utf8");
const grab = (name) => {
  const m = src.match(new RegExp(`const ${name} = /\\* glsl \\*/ \`([\\s\\S]*?)\``));
  if (!m) throw new Error(`could not find ${name}`);
  return m[1];
};
const VERT = grab("VERT");
const FRAG = grab("FRAG");

const pal = readFileSync("components/d3/palette.ts", "utf8");
const hex = (key) => pal.match(new RegExp(`${key}: "(#[0-9a-f]{6})"`, "i"))?.[1];
const SCENE = { volt: hex("volt"), plasma: hex("plasma"), bg: hex("bg") };
console.log(`\n  palette: ${JSON.stringify(SCENE)}`);

const browser = await launchGpu();
await assertHardware(browser);
const page = await browser.newPage();
await page.setContent("<canvas id=c width=640 height=400></canvas>");

const out = await page.evaluate(
  ({ VERT, FRAG, SCENE, linear }) => {
    const canvas = document.getElementById("c");
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    const mk = (t, s) => {
      const sh = gl.createShader(t);
      gl.shaderSource(sh, s);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);

    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, "aPos");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

    const conv = (h) => {
      const n = parseInt(h.slice(1), 16);
      const f = (c) => (linear ? (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) : c);
      return [f(((n >> 16) & 255) / 255), f(((n >> 8) & 255) / 255), f((n & 255) / 255)];
    };
    const loc = (n) => gl.getUniformLocation(p, n);
    const found = {
      uTime: !!loc("uTime"),
      uPhase: !!loc("uPhase"),
      uRes: !!loc("uRes"),
      uVolt: !!loc("uVolt"),
      uPlasma: !!loc("uPlasma"),
      uBg: !!loc("uBg"),
    };
    gl.uniform3fv(loc("uVolt"), conv(SCENE.volt));
    gl.uniform3fv(loc("uPlasma"), conv(SCENE.plasma));
    gl.uniform3fv(loc("uBg"), conv(SCENE.bg));
    gl.uniform2f(loc("uRes"), 640, 400);
    gl.uniform1f(loc("uPhase"), 0);
    gl.uniform1f(loc("uTime"), 3.0);
    gl.viewport(0, 0, 640, 400);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const px = new Uint8Array(640 * 400 * 4);
    gl.readPixels(0, 0, 640, 400, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const lum = (i) => 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < px.length; i += 4) {
      const l = lum(i);
      sum += l;
      if (l > peak) peak = l;
    }
    // Top-right corner region, where the nav sits (readPixels is bottom-up).
    const at = (x, y) => {
      const i = (y * 640 + x) * 4;
      return [px[i], px[i + 1], px[i + 2]];
    };
    return {
      found,
      mean: +(sum / (640 * 400)).toFixed(1),
      peak: Math.round(peak),
      topRight: at(600, 380),
      centre: at(320, 200),
      left: at(30, 200),
    };
  },
  { VERT, FRAG, SCENE, linear: true },
);

console.log(`  uniforms located: ${JSON.stringify(out.found)}`);
console.log(`  mean luminance ${out.mean} / 255, peak ${out.peak}`);
console.log(`  top-right rgb ${out.topRight}   centre ${out.centre}   left ${out.left}\n`);

await browser.close();
