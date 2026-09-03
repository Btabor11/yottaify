import { FLEET, POWER, FACILITY } from "@/content";
import { SITE } from "@/config/site";

/**
 * FIG. 2 — building elevation.
 *
 * A section through the warehouse: the two racks, the air path, and the
 * incoming service. Deliberately an elevation rather than a plan, so it does
 * not repeat FIG. 1 (the node plate) or D1's floor plan.
 *
 * Every annotation is a payload figure. Nothing here is drawn to scale and
 * the drawing says so, because an unscaled drawing presented as survey is a
 * claim we cannot support.
 */
export function Elevation() {
  const ink = "var(--ink)";
  const ink3 = "var(--ink-3)";
  const rule = "var(--rule-strong)";
  const accent = "var(--accent)";

  // 8 units per rack, drawn as slots in a 19" frame.
  const rackSlots = (x: number) =>
    Array.from({ length: FLEET.gpusPerNode }, (_, i) => (
      <rect
        key={i}
        x={x + 3}
        y={150 - i * 11}
        width={44}
        height={8}
        fill="none"
        stroke={i === 0 ? accent : ink}
        strokeWidth={i === 0 ? 1 : 0.5}
      />
    ));

  return (
    <figure className="border border-[var(--ink)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--ink)] px-4 py-2">
        <figcaption className="d2-caps text-[var(--ink)]">
          Fig. 2 — section through the hall
        </figcaption>
        <span className="d2-caps text-[0.5rem] text-[var(--ink-3)]">Not to scale</span>
      </div>

      <div className="px-4 py-5">
        <svg
          viewBox="0 0 420 230"
          className="h-auto w-full"
          role="img"
          aria-label={`Section drawing of the facility: two ${FLEET.gpusPerNode}-GPU racks in an air-cooled hall, drawing ${POWER.summary}`}
        >
          {/* ground line */}
          <line x1={10} y1={175} x2={410} y2={175} stroke={ink} strokeWidth={1.25} />
          {Array.from({ length: 40 }, (_, i) => (
            <line
              key={i}
              x1={12 + i * 10}
              y1={175}
              x2={6 + i * 10}
              y2={181}
              stroke={ink3}
              strokeWidth={0.4}
            />
          ))}

          {/* shell: wall, wall, roof pitch */}
          <path
            d="M40 175 L40 62 L210 30 L380 62 L380 175"
            fill="none"
            stroke={ink}
            strokeWidth={1.25}
          />

          {/* roof hatch, drawn as a light structure rather than a solid */}
          {Array.from({ length: 16 }, (_, i) => (
            <line
              key={i}
              x1={44 + i * 21}
              y1={62 - i * 0}
              x2={44 + i * 21}
              y2={38 + Math.abs(8 - i) * 2.4}
              stroke={rule}
              strokeWidth={0.4}
            />
          ))}

          {/* two racks */}
          <g>
            <rect x={122} y={70} width={50} height={105} fill="none" stroke={ink} strokeWidth={1} />
            {rackSlots(122)}
            <rect x={248} y={70} width={50} height={105} fill="none" stroke={ink} strokeWidth={1} />
            {rackSlots(248)}
          </g>

          {/* air path: cold aisle in, warm out through the ridge */}
          <g stroke={accent} strokeWidth={0.7} fill="none" opacity={0.85}>
            <path d="M62 160 C 92 160, 100 128, 118 122" markerEnd="" />
            <path d="M178 118 C 200 112, 206 96, 210 64" />
            <path d="M304 122 C 328 116, 336 96, 340 66" />
            {[
              "M112 118 l6 4 l-6 4",
              "M208 70 l2 -6 l2 6",
              "M338 72 l2 -6 l2 6",
            ].map((d) => (
              <path key={d} d={d} />
            ))}
          </g>

          {/* service entry */}
          <g>
            <line x1={10} y1={110} x2={40} y2={110} stroke={ink} strokeWidth={1} />
            <rect x={40} y={100} width={16} height={20} fill="none" stroke={ink} strokeWidth={1} />
            <line x1={56} y1={110} x2={122} y2={110} stroke={ink} strokeWidth={0.5} strokeDasharray="3 2" />
            <line x1={172} y1={110} x2={248} y2={110} stroke={ink} strokeWidth={0.5} strokeDasharray="3 2" />
          </g>

          {/* dimension: hall width, annotated with the load */}
          <g stroke={ink3} strokeWidth={0.5}>
            <line x1={40} y1={200} x2={380} y2={200} />
            <line x1={40} y1={195} x2={40} y2={205} />
            <line x1={380} y1={195} x2={380} y2={205} />
          </g>

          {/* callouts */}
          {[
            { x: 14, y: 104, t: POWER.service, anchor: "start" as const },
            { x: 147, y: 62, t: `Node A — ${FLEET.gpusPerNode} × B300`, anchor: "middle" as const },
            { x: 273, y: 62, t: `Node B — ${FLEET.gpusPerNode} × B300`, anchor: "middle" as const },
            { x: 210, y: 24, t: FLEET.cooling, anchor: "middle" as const },
          ].map((c) => (
            <text
              key={c.t}
              x={c.x}
              y={c.y}
              textAnchor={c.anchor}
              style={{
                font: '500 7px var(--font-mono)',
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fill: "var(--ink-2)",
              }}
            >
              {c.t}
            </text>
          ))}

          <text
            x={210}
            y={214}
            textAnchor="middle"
            style={{
              font: '500 7px var(--font-mono)',
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fill: "var(--ink-3)",
            }}
          >
            {POWER.summary}
          </text>

          {/* title block, bottom right, as a drawing would carry */}
          <g>
            <line x1={276} y1={222} x2={410} y2={222} stroke={ink} strokeWidth={0.75} />
            <text
              x={410}
              y={219}
              textAnchor="end"
              style={{
                font: '500 6.5px var(--font-mono)',
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fill: "var(--ink-3)",
              }}
            >
              {SITE.location.region} · {FACILITY.ownership}
            </text>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[var(--rule)] px-4 py-2">
        {[
          ["—", "structure"],
          ["·—·", "service"],
          ["↗", "air path"],
        ].map(([g, l]) => (
          <span key={l} className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
            <span className="mr-1.5 text-[var(--ink)]">{g}</span>
            {l}
          </span>
        ))}
      </div>
    </figure>
  );
}
