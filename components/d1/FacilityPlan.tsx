import { FLEET, POWER, FACILITY } from "@/content";

/**
 * Facility plan, drawn rather than photographed.
 *
 * There is no photograph of the building yet, and the brief forbids stock
 * datacentre imagery — correctly, since a stock photo of someone else's hall is
 * exactly the borrowed credibility this page is trying not to use. So: a line
 * drawing, annotated with the electrical figures we actually measured.
 *
 * Deliberately carries NO floor dimensions. We have the load and the current;
 * we are not publishing a square footage we have not verified. The title block
 * says NOT DIMENSIONED for the same reason a real drawing would.
 *
 * Note on type: SVG <text> must NOT take the .d1-label class — that class sets
 * a rem font-size which overrides the presentation attribute and blows the
 * labels up past their leader lines. Sizes are set inline here on purpose.
 */

const MONO = "var(--fm)";

function Label({
  x,
  y,
  children,
  anchor = "start",
  fill = "var(--ink-3)",
  size = 6.5,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  size?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      style={{ font: `500 ${size}px ${MONO}`, letterSpacing: "0.11em" }}
    >
      {children}
    </text>
  );
}

function Figure({
  x,
  y,
  children,
  anchor = "end",
  fill = "var(--accent)",
  size = 11,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  size?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      style={{ font: `500 ${size}px ${MONO}`, fontVariantNumeric: "tabular-nums" }}
    >
      {children}
    </text>
  );
}

export function FacilityPlan({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 660 380"
      className={className}
      role="img"
      aria-label={`Schematic plan of the facility: a privately owned warehouse in the ${FACILITY.region} containing ${FLEET.nodes} air-cooled ${FLEET.gpusPerNode}-GPU nodes, drawing approximately ${POWER.loadKw} kW, about ${POWER.amps} amps at ${POWER.voltage} three-phase.`}
    >
      <defs>
        <pattern
          id="d1fp-hatch"
          width="5"
          height="5"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="0" x2="0" y2="5" stroke="var(--rule-strong)" strokeWidth="0.7" />
        </pattern>
        <marker id="d1fp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,1 L9,5 L0,9 z" fill="var(--accent-2)" />
        </marker>
        <marker id="d1fp-dot" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="4.5" markerHeight="4.5">
          <circle cx="3" cy="3" r="2" fill="var(--accent)" />
        </marker>
      </defs>

      {/* --- building shell --- */}
      <rect x="56" y="66" width="384" height="228" fill="var(--surface)" stroke="var(--edge)" strokeWidth="1.3" />
      <rect x="56" y="66" width="384" height="228" fill="none" stroke="url(#d1fp-hatch)" strokeWidth="6" opacity="0.55" />

      {/* --- roll-up door on the west wall --- */}
      <line x1="56" y1="196" x2="56" y2="252" stroke="var(--bg)" strokeWidth="7" />
      <path d="M56,196 A56,56 0 0 1 112,252" fill="none" stroke="var(--rule-strong)" strokeWidth="0.7" strokeDasharray="3 3" />
      <Label x={64} y={266}>DOOR</Label>

      {/* --- the two nodes --- */}
      {[0, 1].map((n) => {
        const y = 106 + n * 90;
        return (
          <g key={n}>
            <Label x={172} y={y - 8} fill="var(--ink-2)">
              {`NODE ${String(n + 1).padStart(2, "0")} — ${FLEET.gpusPerNode} × B300`}
            </Label>
            <rect x="172" y={y} width="168" height="56" fill="var(--surface-2)" stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="1" />
            {Array.from({ length: FLEET.gpusPerNode }, (_, i) => (
              <rect
                key={i}
                x={178 + i * 20.2}
                y={y + 7}
                width="14"
                height="42"
                fill="var(--bg)"
                stroke="var(--rule-strong)"
                strokeWidth="0.6"
              />
            ))}
          </g>
        );
      })}

      {/* --- airflow --- */}
      <g stroke="var(--accent-2)" strokeOpacity="0.5" strokeWidth="1" markerEnd="url(#d1fp-arrow)">
        {[124, 214].map((y) => (
          <line key={`in-${y}`} x1="126" y1={y} x2="164" y2={y} />
        ))}
        {[124, 214].map((y) => (
          <line key={`out-${y}`} x1="348" y1={y} x2="386" y2={y} />
        ))}
      </g>
      <Label x={94} y={112} fill="var(--accent-2)" size={6}>INTAKE</Label>
      <Label x={352} y={112} fill="var(--accent-2)" size={6}>EXHAUST</Label>

      {/* --- service panel on the east wall --- */}
      <rect x="404" y="152" width="24" height="60" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1" />
      {[168, 182, 196].map((y) => (
        <line key={y} x1="404" y1={y} x2="428" y2={y} stroke="var(--rule-strong)" strokeWidth="0.6" />
      ))}

      {/* --- leader lines out to the annotation column at x=470 --- */}
      <g stroke="var(--accent)" strokeWidth="0.7" fill="none" markerStart="url(#d1fp-dot)">
        <path d="M340,98 L452,78 L470,78" />
        <path d="M428,182 L452,182 L470,182" />
        <path d="M256,252 L256,284 L452,284 L470,284" />
      </g>

      {/* --- annotations. Right column, never crossing the plan. --- */}
      <Figure x={470} y={72} anchor="start">{`~${POWER.loadKw} kW`}</Figure>
      <Label x={470} y={86}>FACILITY LOAD, {FLEET.total} UNITS</Label>

      <Figure x={470} y={176} anchor="start">{`~${POWER.amps} A`}</Figure>
      <Label x={470} y={190}>{POWER.voltage} · 3-PHASE SERVICE</Label>

      <Figure x={470} y={278} anchor="start">{`${FLEET.nodes} × ${FLEET.gpusPerNode}`}</Figure>
      <Label x={470} y={292}>{FLEET.cooling.toUpperCase()} NODES</Label>

      {/* --- title block --- */}
      <g>
        <rect x="56" y="312" width="240" height="40" fill="none" stroke="var(--rule-strong)" strokeWidth="0.8" />
        <line x1="56" y1="332" x2="296" y2="332" stroke="var(--rule-strong)" strokeWidth="0.6" />
        <line x1="196" y1="312" x2="196" y2="352" stroke="var(--rule-strong)" strokeWidth="0.6" />
        <Label x={62} y={325} fill="var(--ink-2)">FACILITY — PLAN</Label>
        <Label x={62} y={345} size={6}>{FACILITY.region.toUpperCase()}</Label>
        <Label x={202} y={325} size={6}>SCHEMATIC</Label>
        <Label x={202} y={345} size={6}>NOT DIMENSIONED</Label>
      </g>

      {/* --- north arrow, because plans have one --- */}
      <g transform="translate(412,258)">
        <circle r="12" fill="none" stroke="var(--rule-strong)" strokeWidth="0.7" />
        <path d="M0,-8 L3.6,3.6 L0,1 L-3.6,3.6 z" fill="var(--ink-3)" />
        <Label x={0} y={-15} anchor="middle" size={6}>N</Label>
      </g>
    </svg>
  );
}
