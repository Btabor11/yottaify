/**
 * Point-cloud targets for the story stage.
 *
 * Every chapter of the story is one of these shapes, and the scene morphs the
 * same set of particles from one to the next as the reader scrolls. The
 * shapes are generated here, on the client, from the same content module the
 * copy reads — the bus has FLEET.total taps because the fleet has that many
 * devices, the node has FLEET.gpusPerNode packages, the die has eight HBM
 * stacks because that is the part.
 *
 * All generators are deterministic (seeded), so the field is the same on every
 * visit, and every generator returns exactly `n` points so the attribute
 * buffers line up.
 *
 * World units: the camera sits about nine units back with a 38° field of view,
 * so roughly seven units of width are visible at the origin.
 */

import type { StoryShape } from "@/content";

type Vec = [number, number, number];

/** mulberry32 — small, fast, good enough for point placement. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 2D value noise with a couple of octaves; enough for a ridgeline. */
function makeNoise(seed: number) {
  const r = rng(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const hash = (x: number, y: number) => perm[(perm[x & 255] + y) & 255] / 255;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const value = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = smooth(xf);
    const v = smooth(yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x: number, y: number, octaves = 4) => {
    let amp = 0.5;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * value(x, y);
      norm += amp;
      x *= 2.02;
      y *= 2.02;
      amp *= 0.5;
    }
    return sum / norm;
  };
}

/** Resample any list to exactly n points, jittering duplicates so they read as density. */
function fit(points: Vec[], n: number, r: () => number, jitter = 0.012): Float32Array {
  const out = new Float32Array(n * 3);
  const m = points.length;
  if (m === 0) return out;
  for (let i = 0; i < n; i++) {
    const src = i < m ? points[i] : points[Math.floor(r() * m)];
    const j = i < m ? 0 : jitter;
    out[i * 3] = src[0] + (r() - 0.5) * j;
    out[i * 3 + 1] = src[1] + (r() - 0.5) * j;
    out[i * 3 + 2] = src[2] + (r() - 0.5) * j;
  }
  return out;
}

/** Shuffle so that the i-th particle of one shape is not correlated with the i-th of another. */
function shuffle(points: Vec[], r: () => number): Vec[] {
  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }
  return points;
}

/** Rotate a point about X then Y, in radians. Used to bake a viewing angle into a shape. */
function tilt([x, y, z]: Vec, rx: number, ry: number): Vec {
  const cy = Math.cos(rx);
  const sy = Math.sin(rx);
  const y1 = y * cy - z * sy;
  const z1 = y * sy + z * cy;
  const cx = Math.cos(ry);
  const sx = Math.sin(ry);
  return [x * cx + z1 * sx, y1, -x * sx + z1 * cx];
}

/** Points on the surface of an axis-aligned box centred at c with size s. */
function boxSurface(c: Vec, s: Vec, count: number, r: () => number, out: Vec[]) {
  const [w, h, d] = s;
  const areas = [h * d, h * d, w * d, w * d, w * h, w * h];
  const total = areas.reduce((a, b) => a + b, 0);
  for (let i = 0; i < count; i++) {
    let pick = r() * total;
    let face = 0;
    while (pick > areas[face] && face < 5) {
      pick -= areas[face];
      face++;
    }
    const u = r() - 0.5;
    const v = r() - 0.5;
    let p: Vec;
    switch (face) {
      case 0: p = [c[0] + w / 2, c[1] + u * h, c[2] + v * d]; break;
      case 1: p = [c[0] - w / 2, c[1] + u * h, c[2] + v * d]; break;
      case 2: p = [c[0] + u * w, c[1] + h / 2, c[2] + v * d]; break;
      case 3: p = [c[0] + u * w, c[1] - h / 2, c[2] + v * d]; break;
      case 4: p = [c[0] + u * w, c[1] + v * h, c[2] + d / 2]; break;
      default: p = [c[0] + u * w, c[1] + v * h, c[2] - d / 2];
    }
    out.push(p);
  }
}

/** Points along the twelve edges of a box, which is what makes it legible at a distance. */
function boxEdges(c: Vec, s: Vec, count: number, r: () => number, out: Vec[]) {
  const [w, h, d] = s;
  const hx = w / 2;
  const hy = h / 2;
  const hz = d / 2;
  const corners: Vec[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) corners.push([sx * hx, sy * hy, sz * hz]);
  const edges: [Vec, Vec][] = [];
  for (let i = 0; i < 8; i++)
    for (let j = i + 1; j < 8; j++) {
      const diff = [0, 1, 2].filter((k) => corners[i][k] !== corners[j][k]).length;
      if (diff === 1) edges.push([corners[i], corners[j]]);
    }
  for (let i = 0; i < count; i++) {
    const [a, b] = edges[Math.floor(r() * edges.length)];
    const t = r();
    out.push([c[0] + a[0] + (b[0] - a[0]) * t, c[1] + a[1] + (b[1] - a[1]) * t, c[2] + a[2] + (b[2] - a[2]) * t]);
  }
}

function segment(a: Vec, b: Vec, count: number, r: () => number, out: Vec[], spread = 0) {
  for (let i = 0; i < count; i++) {
    const t = r();
    out.push([
      a[0] + (b[0] - a[0]) * t + (r() - 0.5) * spread,
      a[1] + (b[1] - a[1]) * t + (r() - 0.5) * spread,
      a[2] + (b[2] - a[2]) * t + (r() - 0.5) * spread,
    ]);
  }
}

/* ---------------------------------------------------------------------- */

/** 00 — the horizon. A valley floor at dusk with one taut line across it. */
function horizon(n: number, r: () => number, noise: ReturnType<typeof makeNoise>): Vec[] {
  const out: Vec[] = [];
  const floor = Math.floor(n * 0.9);
  for (let i = 0; i < floor; i++) {
    // Denser near the viewer, sparser toward the back, so the plane has depth.
    const z = -7 + Math.pow(r(), 0.55) * 10;
    const x = (r() - 0.5) * (12 + (z + 7) * 1.4);
    const h = noise(x * 0.22 + 3.1, z * 0.22 + 7.7, 3);
    out.push([x, -1.35 + h * 0.5 + (r() - 0.5) * 0.04, z]);
  }
  // The line: a shallow catenary, the utility feed crossing the valley.
  const line = n - floor;
  for (let i = 0; i < line; i++) {
    const t = r();
    const x = -8 + t * 16;
    const sag = 0.55 * (1 - Math.pow((t - 0.5) * 2, 2));
    out.push([x, 2.05 - sag, -3.2 + (r() - 0.5) * 0.03]);
  }
  return out;
}

/** 01 — terrain. Ridged hills, and the service drop running down into them. */
function terrain(n: number, r: () => number, noise: ReturnType<typeof makeNoise>): Vec[] {
  const out: Vec[] = [];
  const hills = Math.floor(n * 0.93);
  let placed = 0;
  while (placed < hills) {
    const x = (r() - 0.5) * 15;
    const z = -6 + r() * 9.5;
    const raw = noise(x * 0.19 + 11.3, z * 0.19 + 2.9, 4);
    // Ridged: fold the noise so crests are sharp lines, then favour them.
    const ridge = 1 - Math.abs(raw * 2 - 1);
    if (r() > 0.25 + ridge * 0.75) continue;
    const y = -1.55 + Math.pow(ridge, 1.6) * 2.2 - (z + 6) * 0.05;
    out.push([x, y, z]);
    placed++;
  }
  // Service drop: three spans down the hillside to a point in front.
  const drop = n - hills;
  const path: Vec[] = [
    [-7.2, 2.6, -5.2],
    [-4.1, 1.4, -3.0],
    [-1.3, 0.35, -1.0],
    [0.4, -0.7, 0.6],
  ];
  for (let s = 0; s < path.length - 1; s++) segment(path[s], path[s + 1], Math.floor(drop / 3), r, out, 0.02);
  return out;
}

/** 02 — the meter. A dial facing the reader, with the needle on the load. */
function meter(n: number, r: () => number): Vec[] {
  const out: Vec[] = [];
  const R = 2.35;
  const band = Math.floor(n * 0.5);
  for (let i = 0; i < band; i++) {
    const a = r() * Math.PI * 2;
    const rr = R - 0.14 + r() * 0.28;
    out.push([Math.cos(a) * rr, Math.sin(a) * rr, (r() - 0.5) * 0.06]);
  }
  // Sixty ticks, from 7 o'clock round to 5 o'clock.
  const ticks = Math.floor(n * 0.24);
  const start = Math.PI * 1.25;
  const sweep = -Math.PI * 1.5;
  for (let i = 0; i < ticks; i++) {
    const k = Math.floor(r() * 61);
    const a = start + (k / 60) * sweep;
    const major = k % 10 === 0;
    const len = major ? 0.42 : 0.2;
    const t = r();
    const rr = R - 0.32 - t * len;
    out.push([Math.cos(a) * rr, Math.sin(a) * rr, 0]);
  }
  // The needle, at the load's position on the dial.
  const needle = Math.floor(n * 0.14);
  const na = start + 0.62 * sweep;
  segment([0, 0, 0.05], [Math.cos(na) * (R - 0.55), Math.sin(na) * (R - 0.55), 0.05], needle, r, out, 0.035);
  // Hub.
  const hub = n - band - ticks - needle;
  for (let i = 0; i < hub; i++) {
    const a = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * 0.28;
    out.push([Math.cos(a) * rr, Math.sin(a) * rr, 0.06]);
  }
  return out;
}

/**
 * 03 — the bus. One rail per node, one tap per device, one riser.
 *
 * Rail count is `taps / perRail`, so the drawing follows the fleet rather than
 * a number typed in here. Everything vertical — tap length, device height, the
 * gap above the rail — is a fraction of the rail pitch, because the pitch is
 * what shrinks when nodes are added. Fixed heights read fine at two rails and
 * collide at six.
 */
function bus(n: number, r: () => number, taps: number, perRail: number): Vec[] {
  const out: Vec[] = [];
  const rails = Math.max(1, Math.round(taps / perRail));
  /** Total vertical span of the stack. Wider than the two-rail case needed. */
  const SPAN = 3.4;
  const pitchY = rails > 1 ? SPAN / (rails - 1) : 0;
  const railY = Array.from({ length: rails }, (_, i) => (rails > 1 ? SPAN / 2 - i * pitchY : 0));
  /** Devices always sit above their rail; at two rails there is room for more. */
  const tapLen = rails > 1 ? Math.min(0.5, pitchY * 0.38) : 0.5;
  const devH = rails > 1 ? Math.min(0.34, pitchY * 0.3) : 0.34;
  const devW = Math.min(0.6, (SPAN / rails) * 1.1 + 0.2);

  const x0 = -4.6;
  const x1 = 4.6;
  const railPts = Math.floor(n * 0.36);
  for (let i = 0; i < railPts; i++) {
    const y = railY[i % rails];
    out.push([x0 + r() * (x1 - x0), y + (r() - 0.5) * 0.045, 0]);
  }
  const tapPts = Math.floor(n * 0.28);
  const devPts = Math.floor(n * 0.3);
  const pitch = perRail > 1 ? (x1 - x0 - 1.2) / (perRail - 1) : 0;
  for (let i = 0; i < taps; i++) {
    const rail = Math.floor(i / perRail);
    const col = i % perRail;
    const x = x0 + 0.6 + col * pitch;
    const y = railY[rail] ?? 0;
    segment([x, y, 0], [x, y + tapLen, 0], Math.floor(tapPts / taps), r, out, 0.03);
    boxEdges([x, y + tapLen + devH * 0.5, 0], [devW, devH, 0.14], Math.floor(devPts / taps), r, out);
  }
  const riser = n - out.length;
  segment([x0 - 0.5, -SPAN / 2 - 0.4, 0], [x0 - 0.5, SPAN / 2 + 1.1, 0], Math.max(0, riser), r, out, 0.03);
  return out;
}

/** 04 — the node. A baseboard carrying the packages, seen from above and in front. */
function node(n: number, r: () => number, packages: number): Vec[] {
  const out: Vec[] = [];
  const cols = Math.ceil(packages / 2);
  const rows = Math.ceil(packages / cols);
  const pitchX = 1.32;
  const pitchZ = 1.3;
  const boardW = cols * pitchX + 0.6;
  const boardD = rows * pitchZ + 0.6;
  // Board: a sparse plane with a rim.
  const board = Math.floor(n * 0.14);
  for (let i = 0; i < board; i++) out.push([(r() - 0.5) * boardW, -0.08, (r() - 0.5) * boardD]);
  boxEdges([0, -0.08, 0], [boardW, 0.02, boardD], Math.floor(n * 0.08), r, out);
  const perPkg = Math.floor((n - out.length) / packages);
  for (let i = 0; i < packages; i++) {
    const c = i % cols;
    const rw = Math.floor(i / cols);
    const x = (c - (cols - 1) / 2) * pitchX;
    const z = (rw - (rows - 1) / 2) * pitchZ;
    // Package body: edges for legibility, a light sprinkle on the top face.
    boxEdges([x, 0.02, z], [1.02, 0.14, 0.86], Math.floor(perPkg * 0.42), r, out);
    boxSurface([x, 0.09, z], [1.0, 0.0, 0.84], Math.floor(perPkg * 0.14), r, out);
    // Die, raised and dense: the bright thing on each package.
    boxSurface([x, 0.15, z], [0.44, 0.06, 0.38], Math.floor(perPkg * 0.3), r, out);
    // HBM: two rows of stacks either side of the die.
    for (const side of [-1, 1]) {
      boxEdges([x + side * 0.34, 0.13, z], [0.16, 0.05, 0.76], Math.floor(perPkg * 0.07), r, out);
    }
  }
  while (out.length < n) out.push([(r() - 0.5) * boardW, -0.08, (r() - 0.5) * boardD]);
  return out.map((p) => tilt(p, -0.95, 0.42)).map(([x, y, z]) => [x * 1.02, y + 0.35, z]);
}

/** 05 — the die. One package, close: the die in the middle and eight HBM stacks around it. */
function die(n: number, r: () => number, stacks: number): Vec[] {
  const out: Vec[] = [];
  // Substrate.
  boxEdges([0, 0, 0], [3.9, 0.12, 3.1], Math.floor(n * 0.16), r, out);
  boxSurface([0, 0.06, 0], [3.86, 0, 3.06], Math.floor(n * 0.1), r, out);
  // The die: two reticles side by side, dense.
  boxSurface([-0.42, 0.13, 0], [0.8, 0.08, 1.16], Math.floor(n * 0.2), r, out);
  boxSurface([0.42, 0.13, 0], [0.8, 0.08, 1.16], Math.floor(n * 0.2), r, out);
  boxEdges([0, 0.13, 0], [1.66, 0.08, 1.18], Math.floor(n * 0.06), r, out);
  // HBM stacks: half on each side of the die.
  const per = Math.floor((n - out.length) / stacks);
  const half = stacks / 2;
  for (let i = 0; i < stacks; i++) {
    const side = i < half ? -1 : 1;
    const k = i % half;
    const z = (k - (half - 1) / 2) * 0.72;
    const x = side * 1.42;
    boxEdges([x, 0.16, z], [0.62, 0.14, 0.6], Math.floor(per * 0.65), r, out);
    boxSurface([x, 0.23, z], [0.6, 0, 0.58], Math.floor(per * 0.35), r, out);
  }
  while (out.length < n) out.push([(r() - 0.5) * 3.8, 0.06, (r() - 0.5) * 3.0]);
  return out.map((p) => tilt(p, -0.78, -0.35)).map(([x, y, z]) => [x, y + 0.2, z]);
}

/**
 * 06 — the word. Sampled off a canvas in the display face, so it is the same
 * letterform as the headline above it. Falls back to a calendar grid — the
 * days of a month, with the first few lit — when the font cannot be read.
 */
function word(n: number, r: () => number, text: string, fontFamily: string, dx: number): Vec[] {
  const out: Vec[] = [];
  try {
    const W = 1400;
    const H = 460;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 380px ${fontFamily}`;
    ctx.fillText(text.toUpperCase(), W / 2, H / 2 + 12);
    const data = ctx.getImageData(0, 0, W, H).data;
    const lit: [number, number][] = [];
    for (let y = 0; y < H; y += 2)
      for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4] > 128) lit.push([x, y]);
    if (lit.length < 400) throw new Error("font not ready");
    // Offset by `dx` (beside the chapter heading on landscape, centred on
    // portrait) and set a little high.
    const scale = 7.4 / W;
    for (let i = 0; i < n; i++) {
      const [x, y] = lit[Math.floor(r() * lit.length)];
      out.push([
        (x - W / 2) * scale + dx + (r() - 0.5) * 0.02,
        -(y - H / 2) * scale + 0.7 + (r() - 0.5) * 0.02,
        (r() - 0.5) * 0.08,
      ]);
    }
    return out;
  } catch {
    // Calendar: seven columns, five rows.
    const cols = 7;
    const rows = 5;
    for (let i = 0; i < n; i++) {
      const c = Math.floor(r() * cols);
      const rw = Math.floor(r() * rows);
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * 0.22;
      out.push([(c - 3) * 1.0 + dx + Math.cos(a) * rr, (2 - rw) * 0.9 + 0.7 + Math.sin(a) * rr, 0]);
    }
    return out;
  }
}

/**
 * The module's silhouette, read off the last frame of the hero sequence.
 * Straight-alpha RGBA, any size; only the alpha and the luminance are used.
 */
export interface DeviceMask {
  data: Uint8ClampedArray;
  w: number;
  h: number;
}

/**
 * The device. Unlike every other shape this one is generated in the frame's
 * own space — x and y as fractions of the picture box, −0.5..0.5, y up — and
 * placed by the shader from a uniform the scene measures off the DOM, so the
 * particles sit exactly on the photograph whatever the layout. A third of the
 * points trace the silhouette's edge, the rest fill it weighted by brightness,
 * so the fins and the highlights read first.
 */
export function device(n: number, r: () => number, mask: DeviceMask | null): Vec[] {
  const out: Vec[] = [];
  if (mask) {
    const { data, w, h } = mask;
    const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 60000)));
    const alphaAt = (x: number, y: number) =>
      x < 0 || y < 0 || x >= w || y >= h ? 0 : data[(y * w + x) * 4 + 3];
    const fill: [number, number, number][] = [];
    const edge: [number, number][] = [];
    for (let y = 0; y < h; y += step)
      for (let x = 0; x < w; x += step) {
        const a = alphaAt(x, y);
        if (a < 128) continue;
        const i = (y * w + x) * 4;
        const lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        fill.push([x, y, 0.25 + lum]);
        if (
          alphaAt(x - step, y) < 128 ||
          alphaAt(x + step, y) < 128 ||
          alphaAt(x, y - step) < 128 ||
          alphaAt(x, y + step) < 128
        )
          edge.push([x, y]);
      }
    if (fill.length > 50) {
      const toBox = (x: number, y: number): Vec => [
        (x + (r() - 0.5) * step) / w - 0.5,
        0.5 - (y + (r() - 0.5) * step) / h,
        (r() - 0.5) * 0.02,
      ];
      const edgeN = edge.length ? Math.floor(n * 0.3) : 0;
      for (let i = 0; i < edgeN; i++) {
        const [x, y] = edge[Math.floor(r() * edge.length)];
        out.push(toBox(x, y));
      }
      while (out.length < n) {
        const [x, y, wgt] = fill[Math.floor(r() * fill.length)];
        if (r() < wgt) out.push(toBox(x, y));
      }
      return out;
    }
  }
  // No mask (a failed fetch): a slab in the middle of the box, edges and a
  // sparse top, so the ignition still reads as a block of something.
  boxEdges([0, -0.05, 0], [0.56, 0.22, 0.04], Math.floor(n * 0.4), r, out);
  boxSurface([0, 0.06, 0], [0.54, 0, 0.04], Math.floor(n * 0.3), r, out);
  while (out.length < n) out.push([(r() - 0.5) * 0.56, -0.16 + r() * 0.22, (r() - 0.5) * 0.02]);
  return out;
}

export interface ShapeInputs {
  /** The module's silhouette for the device shape; null falls back to a slab. */
  device: DeviceMask | null;
  /** Number of devices in the fleet. Taps on the bus, across one rail per node. */
  fleet: number;
  /** Devices per node. Packages on the board, and taps per rail. */
  perNode: number;
  /** HBM stacks per device. */
  stacks: number;
  /** The word the last chapter forms. */
  word: string;
  /** CSS font-family for the word, read off the direction root. */
  fontFamily: string;
  /** Lateral offset of the word in scene units. 0 centres it. */
  wordOffset: number;
}

export const SHAPE_ORDER: StoryShape[] = ["device", "horizon", "terrain", "meter", "bus", "node", "die", "days"];

/** Build every shape as a flat Float32Array of n×3, in SHAPE_ORDER. */
export function buildShapes(n: number, inputs: ShapeInputs): Float32Array[] {
  const noise = makeNoise(7);
  const gen: Record<StoryShape, () => Vec[]> = {
    device: () => device(n, rng(10), inputs.device),
    horizon: () => horizon(n, rng(11), noise),
    terrain: () => terrain(n, rng(12), noise),
    meter: () => meter(n, rng(13)),
    bus: () => bus(n, rng(14), inputs.fleet, inputs.perNode),
    node: () => node(n, rng(15), inputs.perNode),
    die: () => die(n, rng(16), inputs.stacks),
    days: () => word(n, rng(17), inputs.word, inputs.fontFamily, inputs.wordOffset),
  };
  return SHAPE_ORDER.map((name, i) => {
    const r = rng(100 + i);
    return fit(shuffle(gen[name](), r), n, r);
  });
}

/** Per-particle seeds: three uniform randoms, used for timing, drift and brightness. */
export function buildSeeds(n: number): Float32Array {
  const r = rng(99);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) out[i] = r();
  return out;
}
