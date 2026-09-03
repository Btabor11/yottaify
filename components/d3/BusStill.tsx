import { FLEET } from "@/content";

/**
 * The hero's static resting state: a one-line diagram of the fleet drawn as an
 * energised bus with sixteen taps.
 *
 * This is not a placeholder. It is server-rendered, it is what every
 * reduced-motion and no-WebGL visitor sees for the whole session, and it is
 * complete on its own — the shader fades in over it as an enhancement.
 */
export function BusStill() {
  const taps = Array.from({ length: FLEET.total }, (_, i) => i);
  const perRow = FLEET.gpusPerNode;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Ground glow, tinted by the live accent. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 118%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 62%)",
        }}
      />
      <div className="d3-grid absolute inset-0 opacity-70" />

      <svg
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[62%] w-full"
      >
        <defs>
          <linearGradient id="d3-bus-fade" x1="0" x2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="0.18" stopColor="var(--accent)" stopOpacity="0.75" />
            <stop offset="0.82" stopColor="var(--accent)" stopOpacity="0.75" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Two nodes, two feeders. */}
        {[0, 1].map((node) => {
          const y = 210 + node * 96;
          return (
            <g key={node}>
              <line x1={0} y1={y} x2={1200} y2={y} stroke="url(#d3-bus-fade)" strokeWidth={1.5} />
              {taps.slice(node * perRow, node * perRow + perRow).map((t, i) => {
                const x = 210 + i * 111;
                return (
                  <g key={t}>
                    <line
                      x1={x}
                      y1={y}
                      x2={x}
                      y2={y - 34}
                      stroke="var(--accent)"
                      strokeOpacity={0.5}
                      strokeWidth={1}
                    />
                    <rect
                      x={x - 13}
                      y={y - 50}
                      width={26}
                      height={16}
                      fill="none"
                      stroke="var(--accent)"
                      strokeOpacity={0.7}
                      strokeWidth={1}
                    />
                    <circle cx={x} cy={y} r={2.4} fill="var(--accent)" />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Scanlines last, over everything, at low strength. */}
      <div className="d3-scan absolute inset-0 opacity-50" />
    </div>
  );
}
