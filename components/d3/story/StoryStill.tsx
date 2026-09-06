import { FLEET, GPU, STORY_OPENING } from "@/content";

/**
 * The stage's resting state: the whole path of the current on one drawing —
 * a ridgeline, the service drop, the meter, the bus with a tap per device.
 *
 * Not a placeholder. It is server-rendered, it is what every reduced-motion
 * and no-WebGL visitor sees behind every chapter, and it is complete on its
 * own. The particle field fades in over it as an enhancement.
 */
export function StoryStill() {
  /**
   * Two rails, the fleet split across them. Rails are the drawing's structure
   * rather than a fact about the hardware, so they stay at two however many
   * nodes there are — what changes is how many taps hang off each. The pitch
   * is derived so the taps stay separable at 1200 units wide.
   */
  const RAILS = 2;
  const perRail = Math.ceil(FLEET.total / RAILS);
  const taps = Array.from({ length: FLEET.total }, (_, i) => i);
  const pitch = 960 / Math.max(1, perRail);
  const ridge = "M0 300 C 120 250, 200 290, 300 235 S 470 190, 560 230 S 760 300, 880 240 S 1060 200, 1200 262";

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 80% at 70% 105%, color-mix(in oklab, var(--live) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="d3-grid d3-fade-up absolute inset-0 opacity-60" />

      <svg
        viewBox="0 0 1200 520"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[70%] w-full"
      >
        <defs>
          <linearGradient id="d3-still-fade" x1="0" x2="1">
            <stop offset="0" stopColor="var(--live)" stopOpacity="0" />
            <stop offset="0.15" stopColor="var(--live)" stopOpacity="0.7" />
            <stop offset="0.85" stopColor="var(--live)" stopOpacity="0.7" />
            <stop offset="1" stopColor="var(--live)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ridgeline, twice, receding */}
        <path d={ridge} fill="none" stroke="var(--live)" strokeOpacity={0.35} strokeWidth={1} />
        <path
          d={ridge}
          transform="translate(-60 -46) scale(1.1 0.9)"
          fill="none"
          stroke="var(--live)"
          strokeOpacity={0.16}
          strokeWidth={1}
        />

        {/* the service drop */}
        <polyline
          points="120,60 300,150 470,232"
          fill="none"
          stroke="var(--live)"
          strokeOpacity={0.6}
          strokeWidth={1}
        />
        <circle cx={120} cy={60} r={2.4} fill="var(--live)" />
        <circle cx={300} cy={150} r={2.4} fill="var(--live)" />

        {/* the meter */}
        <circle cx={470} cy={232} r={14} fill="var(--bg)" stroke="var(--live)" strokeWidth={1} />
        <line x1={470} y1={232} x2={478} y2={222} stroke="var(--live)" strokeWidth={1.2} />
        <text
          x={492}
          y={228}
          style={{ font: "500 10px var(--font-mono)", letterSpacing: "0.1em", fill: "var(--ink-3)" }}
        >
          {FLEET.total} × {GPU.model.toUpperCase()}
        </text>

        {/* two rails, one tap per device */}
        {Array.from({ length: RAILS }, (_, rail) => {
          const y = 372 + rail * 84;
          const row = taps.slice(rail * perRail, rail * perRail + perRail);
          const w = Math.min(26, pitch * 0.62);
          return (
            <g key={rail}>
              <line x1={0} y1={y} x2={1200} y2={y} stroke="url(#d3-still-fade)" strokeWidth={1.4} />
              {row.map((t, i) => {
                const x = 120 + (i + 0.5) * pitch;
                return (
                  <g key={t}>
                    <line x1={x} y1={y} x2={x} y2={y - 30} stroke="var(--live)" strokeOpacity={0.5} strokeWidth={1} />
                    <rect
                      x={x - w / 2}
                      y={y - 46}
                      width={w}
                      height={16}
                      fill="none"
                      stroke="var(--live)"
                      strokeOpacity={0.7}
                      strokeWidth={1}
                    />
                    <circle cx={x} cy={y} r={2.2} fill="var(--live)" />
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* riser joining the bus to the meter */}
        <line x1={470} y1={246} x2={470} y2={456} stroke="var(--live)" strokeOpacity={0.45} strokeWidth={1} />

        <text
          x={1196}
          y={512}
          textAnchor="end"
          style={{ font: "500 9px var(--font-mono)", letterSpacing: "0.14em", fill: "var(--ink-3)" }}
        >
          {STORY_OPENING.stageLabel.toUpperCase()}
        </text>
      </svg>

      <div className="d3-scan absolute inset-0 opacity-50" />
    </div>
  );
}
