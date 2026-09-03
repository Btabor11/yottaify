import { FLEET, NODE, NVLINK } from "@/content";

/**
 * Static axonometric of one 8-GPU node, authored as SVG.
 *
 * This is the DEFAULT render, not a fallback of last resort: server rendered,
 * needs no JavaScript, and it is what a reduced-motion visitor, a WebGL-less
 * browser, and a crawler all see. The WebGL scene fades in on top as an
 * enhancement and this stays underneath.
 *
 * Labelled "schematic" because it is one — an illustrative 8-GPU baseboard,
 * not a photograph of our hardware.
 */

const COLS = 4;
const ROWS = 2;
const PITCH_X = 62;
const PITCH_Z = 74;
const CARD_W = 46;
const CARD_D = 54;
const CARD_H = 13;

/** Isometric projection: world (x, z) → screen (x, y). */
function iso(x: number, z: number): [number, number] {
  return [(x - z) * 0.866, (x + z) * 0.5];
}

/** Four corners of an axis-aligned footprint, projected, at a given height. */
function face(cx: number, cz: number, hw: number, hd: number, lift = 0): string {
  return (
    [
      iso(cx - hw, cz - hd),
      iso(cx + hw, cz - hd),
      iso(cx + hw, cz + hd),
      iso(cx - hw, cz + hd),
    ] as [number, number][]
  )
    .map(([x, y]) => `${x.toFixed(1)},${(y - lift).toFixed(1)}`)
    .join(" ");
}

/** A vertical side wall between two projected corners. */
function wall(a: [number, number], b: [number, number], h: number): string {
  return [
    `${a[0].toFixed(1)},${(a[1] - h).toFixed(1)}`,
    `${b[0].toFixed(1)},${(b[1] - h).toFixed(1)}`,
    `${b[0].toFixed(1)},${b[1].toFixed(1)}`,
    `${a[0].toFixed(1)},${a[1].toFixed(1)}`,
  ].join(" ");
}

export function NodeDiagram({ className }: { className?: string }) {
  const packages = Array.from({ length: FLEET.gpusPerNode }, (_, i) => {
    const col = i % COLS;
    const rowIndex = Math.floor(i / COLS);
    const wx = (col - (COLS - 1) / 2) * PITCH_X;
    const wz = (rowIndex - (ROWS - 1) / 2) * PITCH_Z;
    const [sx, sy] = iso(wx, wz);
    return { i, wx, wz, sx, sy };
  });

  // Painter's order: draw far packages first so near ones overlap correctly.
  const drawOrder = [...packages].sort((a, b) => a.sy - b.sy);

  // All-to-all reachability between the eight devices. NVLink 5 gives 18 links
  // per GPU into the domain; this mesh depicts the resulting any-to-any
  // connectivity, not a literal cable count.
  const edges: [number, number][] = [];
  for (let a = 0; a < FLEET.gpusPerNode; a++) {
    for (let b = a + 1; b < FLEET.gpusPerNode; b++) edges.push([a, b]);
  }

  const boardHw = (PITCH_X * COLS) / 2 + 14;
  const boardHd = (PITCH_Z * ROWS) / 2 + 12;
  const boardCorners = [
    iso(-boardHw, -boardHd),
    iso(boardHw, -boardHd),
    iso(boardHw, boardHd),
    iso(-boardHw, boardHd),
  ] as [number, number][];

  return (
    <svg
      viewBox="-200 -140 400 290"
      className={className}
      role="img"
      aria-label={`Schematic of one ${FLEET.gpusPerNode}-GPU node: ${FLEET.gpusPerNode} NVIDIA B300 packages on a single baseboard, ${NODE.hbmGbFormatted} GB of HBM3e in total, connected as one ${NVLINK.generation} domain.`}
    >
      <defs>
        <linearGradient id="d1nd-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--surface-2)" />
          <stop offset="100%" stopColor="var(--surface)" />
        </linearGradient>
        <linearGradient id="d1nd-die" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      {/* --- baseboard --- */}
      <polygon points={wall(boardCorners[1], boardCorners[2], -9)} fill="var(--bg)" stroke="var(--rule-strong)" strokeWidth="0.7" />
      <polygon points={wall(boardCorners[2], boardCorners[3], -9)} fill="var(--bg)" stroke="var(--rule-strong)" strokeWidth="0.7" />
      <polygon points={face(0, 0, boardHw, boardHd)} fill="url(#d1nd-board)" stroke="var(--rule-strong)" strokeWidth="0.7" />

      {/* --- NVLink mesh --- */}
      <g stroke="var(--accent)" strokeOpacity="0.22" strokeWidth="0.6" fill="none">
        {edges.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={packages[a].sx.toFixed(1)}
            y1={(packages[a].sy - 2).toFixed(1)}
            x2={packages[b].sx.toFixed(1)}
            y2={(packages[b].sy - 2).toFixed(1)}
          />
        ))}
      </g>

      {/* --- GPU packages --- */}
      {drawOrder.map((p) => {
        const hw = CARD_W / 2;
        const hd = CARD_D / 2;
        const corners = [
          iso(p.wx - hw, p.wz - hd),
          iso(p.wx + hw, p.wz - hd),
          iso(p.wx + hw, p.wz + hd),
          iso(p.wx - hw, p.wz + hd),
        ] as [number, number][];

        return (
          <g key={p.i}>
            <polygon points={wall(corners[1], corners[2], CARD_H)} fill="var(--bg)" stroke="var(--rule-strong)" strokeWidth="0.6" />
            <polygon points={wall(corners[2], corners[3], CARD_H)} fill="var(--surface)" stroke="var(--rule-strong)" strokeWidth="0.6" />
            <polygon points={face(p.wx, p.wz, hw, hd, CARD_H)} fill="var(--surface-2)" stroke="var(--rule-strong)" strokeWidth="0.6" />
            <polygon
              points={face(p.wx, p.wz, CARD_W * 0.3, CARD_D * 0.3, CARD_H)}
              fill="url(#d1nd-die)"
              stroke="var(--accent)"
              strokeOpacity="0.42"
              strokeWidth="0.5"
            />
          </g>
        );
      })}
    </svg>
  );
}
