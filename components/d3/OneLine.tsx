import { FLEET, POWER, FACILITY, ACCESS } from "@/content";
import { SITE } from "@/config/site";

/**
 * FIG. 01 — single-line diagram.
 *
 * Utility, meter, main, bus, two feeders, two loads. It is the drawing an
 * electrician would produce for this building, and it is the most honest
 * possible picture of the company: five symbols and a number at the meter.
 *
 * Every figure on it is a payload figure. The drawing is not to scale and says
 * so, because an unscaled drawing presented as survey is a claim we cannot
 * support.
 */

/**
 * Type sizes are set in user units against a 400-unit-wide viewBox that renders
 * at roughly 400 CSS px, so these are close to their on-screen pixel sizes. Do
 * not shrink them to fit: if a label does not fit, move it.
 */
const LABEL = {
  font: "500 11px var(--font-mono)",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  fill: "var(--ink-2)",
};

const VALUE = {
  font: "500 12px var(--font-mono)",
  letterSpacing: "-0.02em",
  fill: "var(--accent)",
};

export function OneLine() {
  const cx = 150;

  return (
    <figure className="d3-panel d3-ticks">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-[var(--rule-strong)] px-4 py-2.5">
        <figcaption className="d3-tag whitespace-nowrap text-[0.5625rem] text-[var(--ink-2)]">
          Fig. 01 — single line
        </figcaption>
        <span className="d3-tag whitespace-nowrap text-[0.4375rem] text-[var(--ink-3)]">
          Not to scale
        </span>
      </div>

      <div className="px-4 py-6">
        <svg
          viewBox="0 0 400 506"
          className="h-auto w-full"
          role="img"
          aria-label={`Single-line diagram: utility service through a meter and main breaker to a bus, feeding two ${FLEET.gpusPerNode}-GPU nodes. ${POWER.summary}`}
        >
          {/* ---------- conductor ---------- */}
          <g stroke="var(--accent)" strokeWidth={1.2} fill="none">
            <line x1={cx} y1={54} x2={cx} y2={92} />
            <line x1={cx} y1={124} x2={cx} y2={160} />
            <line x1={cx} y1={196} x2={cx} y2={244} />
            {/* bus */}
            <line x1={62} y1={244} x2={302} y2={244} strokeWidth={2.4} />
            {/* feeders */}
            <line x1={100} y1={244} x2={100} y2={296} />
            <line x1={250} y1={244} x2={250} y2={296} />
            <line x1={100} y1={328} x2={100} y2={366} />
            <line x1={250} y1={328} x2={250} y2={366} />
          </g>

          {/* ---------- utility ---------- */}
          <circle cx={cx} cy={38} r={16} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.2} />
          <text x={cx} y={42} textAnchor="middle" style={{ ...VALUE, fill: "var(--accent)" }}>
            ~
          </text>
          <text x={cx + 26} y={33} style={LABEL}>
            Utility service
          </text>
          <text x={cx + 26} y={49} style={{ ...LABEL, fill: "var(--ink-3)" }}>
            {POWER.voltage} {POWER.phase}
          </text>

          {/* ---------- meter ---------- */}
          <circle cx={cx} cy={108} r={16} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.2} />
          <text x={cx} y={112} textAnchor="middle" style={{ ...VALUE, fill: "var(--accent)" }}>
            M
          </text>
          <text x={cx + 26} y={103} style={LABEL}>
            Meter
          </text>
          <text x={cx + 26} y={119} style={VALUE}>
            ~{POWER.loadKw} kW at {FLEET.total} units
          </text>

          {/* ---------- main breaker ---------- */}
          <g>
            <line x1={cx} y1={160} x2={cx} y2={168} stroke="var(--accent)" strokeWidth={1.2} />
            {/* the open-switch stroke that says "breaker" */}
            <line x1={cx} y1={168} x2={cx + 16} y2={188} stroke="var(--accent)" strokeWidth={1.6} />
            <line x1={cx} y1={196} x2={cx} y2={188} stroke="var(--accent)" strokeWidth={1.2} />
            <circle cx={cx} cy={168} r={2.2} fill="var(--accent)" />
            <circle cx={cx} cy={188} r={2.2} fill="var(--accent)" />
            <text x={cx + 32} y={172} style={LABEL}>
              Main
            </text>
            <text x={cx + 32} y={188} style={VALUE}>
              ~{POWER.amps} A
            </text>
          </g>

          {/* ---------- bus label ---------- */}
          <text x={62} y={234} style={LABEL}>
            Distribution bus
          </text>

          {/* ---------- feeder breakers + loads ---------- */}
          {[
            { x: 100, id: "A" },
            { x: 250, id: "B" },
          ].map((f) => (
            <g key={f.id}>
              <rect
                x={f.x - 11}
                y={296}
                width={22}
                height={32}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth={1.2}
              />
              <line
                x1={f.x - 6}
                y1={322}
                x2={f.x + 6}
                y2={302}
                stroke="var(--accent)"
                strokeWidth={1.3}
              />
              <text x={f.x} y={290} textAnchor="middle" style={LABEL}>
                Feeder {f.id}
              </text>

              {/* the load: eight devices in a frame */}
              <rect
                x={f.x - 48}
                y={366}
                width={96}
                height={96}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth={1.2}
              />
              {Array.from({ length: FLEET.gpusPerNode }, (_, i) => (
                <rect
                  key={i}
                  x={f.x - 40}
                  y={374 + i * 11}
                  width={80}
                  height={7}
                  fill="none"
                  stroke="var(--accent)"
                  strokeOpacity={0.55}
                  strokeWidth={0.8}
                />
              ))}
              <text x={f.x} y={479} textAnchor="middle" style={LABEL}>
                Node {f.id}
              </text>
              <text x={f.x} y={496} textAnchor="middle" style={VALUE}>
                {FLEET.gpusPerNode} × B300
              </text>
            </g>
          ))}
        </svg>
      </div>

      <dl className="grid grid-cols-1 gap-px border-t border-[var(--rule-strong)] bg-[var(--rule)] min-[22rem]:grid-cols-2">
        {[
          ["Building", FACILITY.ownership],
          ["Cooling", FLEET.cooling],
          ["Region", SITE.location.region],
          ["Access", ACCESS.model],
        ].map(([k, v]) => (
          <div key={k} className="bg-[var(--surface)] px-4 py-2.5">
            <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">{k}</dt>
            <dd className="d3-body mt-1 text-[0.75rem] text-[var(--ink-2)]">{v}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
