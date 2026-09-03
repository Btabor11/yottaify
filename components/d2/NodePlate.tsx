import { FLEET, NODE, NVLINK, SPECS } from "@/content";

/**
 * Plate I — one 8-GPU node, drawn as a patent figure.
 *
 * Server rendered, no JavaScript, and the default render. The WebGL engraving
 * fades in over it as an enhancement; this is what reduced-motion visitors,
 * WebGL-less browsers, crawlers, and anyone who prints the page will see.
 *
 * Numbered callouts resolve to a legend beneath, which is both the patent-
 * drawing idiom and the accessible way to label a diagram — no hover, no
 * tooltip, every label readable at once.
 */

const COLS = 4;
const ROWS = 2;
const PITCH_X = 66;
const PITCH_Z = 78;
const CARD_W = 50;
const CARD_D = 58;
const CARD_H = 11;

function iso(x: number, z: number): [number, number] {
  return [(x - z) * 0.866, (x + z) * 0.5];
}

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

function wall(a: [number, number], b: [number, number], h: number): string {
  return [
    `${a[0].toFixed(1)},${(a[1] - h).toFixed(1)}`,
    `${b[0].toFixed(1)},${(b[1] - h).toFixed(1)}`,
    `${b[0].toFixed(1)},${b[1].toFixed(1)}`,
    `${a[0].toFixed(1)},${a[1].toFixed(1)}`,
  ].join(" ");
}

export const PLATE_LEGEND = [
  { n: 1, label: `B300 package, ×${FLEET.gpusPerNode}`, detail: "One device per socket" },
  {
    n: 2,
    label: "HBM3e stacks",
    detail: `${SPECS.find((s) => s.id === "hbm")!.value} GB per device`,
  },
  {
    n: 3,
    label: `${NVLINK.generation} fabric`,
    detail: `${NVLINK.links} links per GPU, ~${NVLINK.perGpuBidirectional} bidirectional`,
  },
  { n: 4, label: "Baseboard", detail: `${NODE.hbmGbFormatted} GB in one coherent domain` },
];

export function NodePlate({ className }: { className?: string }) {
  const packages = Array.from({ length: FLEET.gpusPerNode }, (_, i) => {
    const col = i % COLS;
    const r = Math.floor(i / COLS);
    const wx = (col - (COLS - 1) / 2) * PITCH_X;
    const wz = (r - (ROWS - 1) / 2) * PITCH_Z;
    const [sx, sy] = iso(wx, wz);
    return { i, wx, wz, sx, sy };
  });
  const drawOrder = [...packages].sort((a, b) => a.sy - b.sy);

  const edges: [number, number][] = [];
  for (let a = 0; a < FLEET.gpusPerNode; a++) {
    for (let b = a + 1; b < FLEET.gpusPerNode; b++) edges.push([a, b]);
  }

  const boardHw = (PITCH_X * COLS) / 2 + 15;
  const boardHd = (PITCH_Z * ROWS) / 2 + 13;
  const bc = [
    iso(-boardHw, -boardHd),
    iso(boardHw, -boardHd),
    iso(boardHw, boardHd),
    iso(-boardHw, boardHd),
  ] as [number, number][];

  const INK = "var(--ink)";

  /** Callout: a leader line to a ringed numeral, patent-drawing style. */
  const Callout = ({
    from,
    to,
    n,
  }: {
    from: [number, number];
    to: [number, number];
    n: number;
  }) => (
    <g>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={INK} strokeWidth="0.7" />
      <circle cx={to[0]} cy={to[1]} r="9" fill="var(--bg)" stroke={INK} strokeWidth="0.9" />
      <text
        x={to[0]}
        y={to[1] + 3.6}
        textAnchor="middle"
        fill={INK}
        style={{ font: `600 10px var(--fm)`, fontVariantNumeric: "tabular-nums" }}
      >
        {n}
      </text>
    </g>
  );

  return (
    <svg
      viewBox="-250 -170 500 350"
      className={className}
      role="img"
      aria-label={`Plate one: one ${FLEET.gpusPerNode}-GPU node. ${FLEET.gpusPerNode} NVIDIA B300 packages on a single baseboard, ${NODE.hbmGbFormatted} GB of HBM3e in total, connected as one ${NVLINK.generation} domain. Callouts one to four are described in the legend.`}
    >
      {/* --- baseboard --- */}
      <polygon points={wall(bc[1], bc[2], -8)} fill="var(--surface)" stroke={INK} strokeWidth="0.8" />
      <polygon points={wall(bc[2], bc[3], -8)} fill="var(--surface-2)" stroke={INK} strokeWidth="0.8" />
      <polygon points={face(0, 0, boardHw, boardHd)} fill="var(--bg)" stroke={INK} strokeWidth="0.9" />

      {/* --- NVLink fabric --- */}
      <g stroke={INK} strokeOpacity="0.3" strokeWidth="0.5" fill="none">
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

      {/* --- packages --- */}
      {drawOrder.map((p) => {
        const hw = CARD_W / 2;
        const hd = CARD_D / 2;
        const c = [
          iso(p.wx - hw, p.wz - hd),
          iso(p.wx + hw, p.wz - hd),
          iso(p.wx + hw, p.wz + hd),
          iso(p.wx - hw, p.wz + hd),
        ] as [number, number][];

        return (
          <g key={p.i}>
            <polygon points={wall(c[1], c[2], CARD_H)} fill="var(--surface-2)" stroke={INK} strokeWidth="0.7" />
            <polygon points={wall(c[2], c[3], CARD_H)} fill="var(--surface)" stroke={INK} strokeWidth="0.7" />
            <polygon points={face(p.wx, p.wz, hw, hd, CARD_H)} fill="var(--bg)" stroke={INK} strokeWidth="0.7" />
            {/* die */}
            <polygon
              points={face(p.wx, p.wz, CARD_W * 0.22, CARD_D * 0.3, CARD_H)}
              fill="var(--surface-2)"
              stroke={INK}
              strokeWidth="0.6"
            />
            {/* HBM stacks, two per side. Count is illustrative. */}
            {[-0.34, 0.34].map((ox) =>
              [-0.2, 0.2].map((oz) => (
                <polygon
                  key={`${ox}-${oz}`}
                  points={face(
                    p.wx + ox * CARD_W,
                    p.wz + oz * CARD_D,
                    CARD_W * 0.075,
                    CARD_D * 0.13,
                    CARD_H,
                  )}
                  fill="var(--accent)"
                  fillOpacity="0.22"
                  stroke={INK}
                  strokeWidth="0.5"
                />
              )),
            )}
          </g>
        );
      })}

      {/* --- callouts --- */}
      <Callout from={[packages[3].sx + 18, packages[3].sy - CARD_H - 6]} to={[196, -108]} n={1} />
      <Callout from={[packages[0].sx - 20, packages[0].sy - CARD_H - 4]} to={[-196, -122]} n={2} />
      <Callout from={[0, -6]} to={[-4, -140]} n={3} />
      <Callout from={[bc[3][0] + 26, bc[3][1] + 6]} to={[-146, 116]} n={4} />

      {/* --- plate title, bottom right, as a drawing would --- */}
      <text
        x={222}
        y={148}
        textAnchor="end"
        fill={INK}
        style={{ font: `600 11px var(--fm)`, letterSpacing: "0.12em" }}
      >
        FIG. 1
      </text>
      <text
        x={222}
        y={164}
        textAnchor="end"
        fill="var(--ink-3)"
        style={{ font: `500 8px var(--fm)`, letterSpacing: "0.1em" }}
      >
        SCHEMATIC — NOT TO SCALE
      </text>
    </svg>
  );
}
