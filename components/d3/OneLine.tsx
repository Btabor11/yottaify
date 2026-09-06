import { FLEET, FACILITY, ACCESS } from "@/content";
import { SITE } from "@/config/site";

/**
 * FIG. 01 — single-line diagram.
 *
 * Utility, meter, main, bus, one feeder per node. It is the drawing an
 * electrician would produce for this building, and it is the most honest
 * possible picture of the company.
 *
 * It carries no figures. It used to annotate the meter and the main with a
 * load and a current, both calculated for a two-node build; the fleet is six
 * nodes and those numbers are void until the service is re-specified. The
 * topology is settled, so the topology is what is drawn. The drawing is not to
 * scale and says so, because an unscaled drawing presented as survey is a
 * claim we cannot support.
 *
 * Feeder count is derived, so the drawing follows the fleet. Loads are laid
 * out on a row-major grid rather than a single row: six 96-unit frames side by
 * side would either overflow the 400-unit viewBox or shrink the type below
 * legibility, and neither is acceptable on a drawing whose whole point is that
 * it can be read.
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
  const cx = 200;
  const nodes = FLEET.nodes;
  /** Evenly spaced along the bus, wide enough that eight bars stay separable. */
  const PITCH = 58;
  const first = cx - ((nodes - 1) * PITCH) / 2;
  const feeders = Array.from({ length: nodes }, (_, i) => first + i * PITCH);
  const busX0 = feeders[0] - 32;
  const busX1 = feeders[nodes - 1] + 32;

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
          viewBox="0 0 400 442"
          className="h-auto w-full"
          role="img"
          aria-label={`Single-line diagram: utility service through a meter and main breaker to a distribution bus, which feeds ${FLEET.nodesWord} ${FLEET.gpusPerNode}-GPU nodes through one feeder each. Topology only — no load or current figures are published.`}
        >
          {/* ---------- conductor ---------- */}
          <g stroke="var(--accent)" strokeWidth={1.2} fill="none">
            <line x1={cx} y1={54} x2={cx} y2={92} />
            <line x1={cx} y1={124} x2={cx} y2={160} />
            <line x1={cx} y1={196} x2={cx} y2={244} />
            {/* bus */}
            <line x1={busX0} y1={244} x2={busX1} y2={244} strokeWidth={2.4} />
            {/* feeders, above and below their breakers */}
            {feeders.map((x) => (
              <g key={x}>
                <line x1={x} y1={244} x2={x} y2={290} />
                <line x1={x} y1={318} x2={x} y2={348} />
              </g>
            ))}
          </g>

          {/* ---------- utility ---------- */}
          <circle cx={cx} cy={38} r={16} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.2} />
          <text x={cx} y={42} textAnchor="middle" style={{ ...VALUE, fill: "var(--accent)" }}>
            ~
          </text>
          <text x={cx + 26} y={42} style={LABEL}>
            Utility service
          </text>

          {/* ---------- meter ---------- */}
          <circle cx={cx} cy={108} r={16} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.2} />
          <text x={cx} y={112} textAnchor="middle" style={{ ...VALUE, fill: "var(--accent)" }}>
            M
          </text>
          <text x={cx + 26} y={112} style={LABEL}>
            Meter
          </text>

          {/* ---------- main breaker ---------- */}
          <g>
            <line x1={cx} y1={160} x2={cx} y2={168} stroke="var(--accent)" strokeWidth={1.2} />
            {/* the open-switch stroke that says "breaker" */}
            <line x1={cx} y1={168} x2={cx + 16} y2={188} stroke="var(--accent)" strokeWidth={1.6} />
            <line x1={cx} y1={196} x2={cx} y2={188} stroke="var(--accent)" strokeWidth={1.2} />
            <circle cx={cx} cy={168} r={2.2} fill="var(--accent)" />
            <circle cx={cx} cy={188} r={2.2} fill="var(--accent)" />
            <text x={cx + 32} y={182} style={LABEL}>
              Main
            </text>
          </g>

          {/* ---------- bus ---------- */}
          <text x={busX0} y={234} style={LABEL}>
            Distribution bus
          </text>
          <text x={busX1} y={234} textAnchor="end" style={{ ...LABEL, fill: "var(--ink-3)" }}>
            {FLEET.nodesWord} feeders
          </text>

          {/* ---------- feeder breakers + loads ---------- */}
          {feeders.map((x, i) => (
            <g key={x}>
              <rect
                x={x - 10}
                y={290}
                width={20}
                height={28}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth={1.2}
              />
              <line x1={x - 5} y1={313} x2={x + 5} y2={295} stroke="var(--accent)" strokeWidth={1.3} />

              {/* the load: one frame per node, one bar per device */}
              <rect
                x={x - 26}
                y={348}
                width={52}
                height={58}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth={1.2}
              />
              {Array.from({ length: FLEET.gpusPerNode }, (_, d) => (
                <rect
                  key={d}
                  x={x - 20}
                  y={354 + d * 6.5}
                  width={40}
                  height={3.4}
                  fill="none"
                  stroke="var(--accent)"
                  strokeOpacity={0.55}
                  strokeWidth={0.8}
                />
              ))}
              <text x={x} y={420} textAnchor="middle" style={VALUE}>
                {String.fromCharCode(65 + i)}
              </text>
            </g>
          ))}

          <text x={cx} y={438} textAnchor="middle" style={{ ...LABEL, fill: "var(--ink-3)" }}>
            {FLEET.nodes} nodes · {FLEET.gpusPerNode} × B300 each
          </text>
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
