/**
 * THE SOUNDING FIELD — still.
 *
 * Server-rendered SVG, and the real picture rather than a placeholder: every
 * row the filter returned is plotted here before a byte of JavaScript runs.
 * The WebGL scene that may fade in over it reads the same numbers through the
 * same projection, so the two are the same drawing.
 *
 * Read it as a survey: time runs away to the right, the pipeline runs down,
 * and each sounding stands off the plane by the capacity it asked for.
 *
 * The whole graphic is aria-hidden. It is a picture of the table immediately
 * beneath it, and that table is the accessible path to every one of these
 * rows — announcing four hundred coordinates would be worse than silence.
 * The figures in the caption carry the summary in text.
 */

import { STATUS_LABEL, type ReservationStatus } from "@/lib/server/schema";
import type { Field } from "@/app/admin/derive";
import { VIEW, beadRadius, lattice, paintOrder, planeCorners, project } from "./project";

export function Chart({ field }: { field: Field }) {
  const corners = planeCorners();
  const grid = lattice();
  const points = paintOrder(field.points);

  return (
    <svg
      className="adm-chart"
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* The water column: light at the surface, gone by the floor. */}
        <linearGradient id="adm-column" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--shoal)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--deep)" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id="adm-halo">
          <stop offset="0%" stopColor="var(--shoal)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--shoal)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* --- the plane -------------------------------------------------- */}
      <polygon points={corners.map(([x, y]) => `${x},${y}`).join(" ")} fill="url(#adm-column)" />

      <g stroke="var(--rule-strong)" strokeWidth="1" opacity="0.7">
        {grid.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>

      <polygon
        points={corners.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="var(--edge)"
        strokeWidth="1"
        opacity="0.75"
      />

      {/* --- the soundings ---------------------------------------------- */}
      <g>
        {points.map((p) => {
          const [bx, by] = project(p.x, p.depth, 0);
          const [tx, ty] = project(p.x, p.depth, p.magnitude);
          const r = beadRadius(p.magnitude);
          const tone = p.terminal ? "var(--spent)" : p.depth > 0.5 ? "var(--deep)" : "var(--shoal)";
          return (
            /* `data-sounding` is how a row hovered in the log finds its mark
               here. Nothing in this file reads it — the still is inert — but
               it is the anchor the board's hold channel writes against while
               the WebGL scene has not taken over. */
            <g key={p.reference} data-sounding={p.reference} opacity={p.terminal ? 0.4 : 1}>
              <title>{`${p.company} · ${p.reference} · ${p.gpus} GPUs · ${STATUS_LABEL[p.status as ReservationStatus] ?? p.status}`}</title>
              {/* Its shadow on the plane, so the stem reads as standing on it. */}
              <ellipse cx={bx} cy={by} rx={r * 0.9} ry={r * 0.34} fill="var(--bg)" opacity="0.55" />
              <line x1={bx} y1={by} x2={tx} y2={ty} stroke={tone} strokeWidth="1" opacity="0.55" />
              {p.tier === "A" && !p.terminal && <circle cx={tx} cy={ty} r={r * 2.6} fill="url(#adm-halo)" />}
              <circle
                className="adm-bead"
                cx={tx}
                cy={ty}
                r={r}
                fill={tone}
                fillOpacity={p.terminal ? 0.5 : 0.85}
                stroke={tone}
                strokeWidth={0}
              />
              <circle cx={tx - r * 0.28} cy={ty - r * 0.3} r={r * 0.3} fill="var(--ink)" opacity={p.terminal ? 0.3 : 0.8} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
