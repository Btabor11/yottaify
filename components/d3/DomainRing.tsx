import { FLEET, NODE, HBM_PER_GPU, NVLINK } from "@/content";

/**
 * The memory domain, drawn in plan: eight devices on a ring, every pair joined,
 * with the total in the middle.
 *
 * The point of the drawing is the chords. Twenty-eight of them for eight
 * devices is what "all-to-all" actually looks like, and it is the reason the
 * 2,304 GB figure behaves as one pool instead of eight.
 *
 * Server-rendered, and the complete static state for reduced motion and
 * no-WebGL sessions.
 */
export function DomainRing({ className }: { className?: string }) {
  const n = FLEET.gpusPerNode;
  const cx = 260;
  const cy = 260;
  const r = 176;

  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, a };
  });

  // Every unique pair. n(n-1)/2 = 28 for eight devices.
  const chords: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) chords.push([i, j]);

  return (
    <svg
      viewBox="0 0 520 520"
      className={className}
      role="img"
      aria-label={`Plan view of one ${n}-GPU node: ${n} devices of ${HBM_PER_GPU.display} each, fully connected by ${NVLINK.generation}, totalling ${NODE.hbmGbFormatted} GB in one coherent domain.`}
    >
      {/* chords first, so devices sit on top */}
      <g stroke="var(--accent)" strokeWidth={0.7} strokeOpacity={0.28} fill="none">
        {chords.map(([i, j]) => (
          <line key={`${i}-${j}`} x1={pts[i].x} y1={pts[i].y} x2={pts[j].x} y2={pts[j].y} />
        ))}
      </g>

      {/* the ring itself */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--rule-strong)" strokeWidth={1} />

      {/* devices */}
      {pts.map((p, i) => (
        <g key={i}>
          <rect
            x={p.x - 21}
            y={p.y - 15}
            width={42}
            height={30}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth={1.1}
          />
          {/* three HBM stacks per side, drawn as plates */}
          {[-9, 0, 9].map((dy) => (
            <line
              key={dy}
              x1={p.x - 14}
              y1={p.y + dy}
              x2={p.x + 14}
              y2={p.y + dy}
              stroke="var(--accent)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ))}
          <text
            x={p.x + Math.cos(p.a) * 44}
            y={p.y + Math.sin(p.a) * 44 + 3}
            textAnchor="middle"
            style={{
              font: `500 9px var(--font-mono)`,
              letterSpacing: "-0.02em",
              fill: "var(--ink-3)",
            }}
          >
            {HBM_PER_GPU.display}
          </text>
        </g>
      ))}

      {/* the total, in the middle where the domain is */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        style={{
          font: `700 44px var(--font-mono)`,
          letterSpacing: "-0.05em",
          fill: "var(--accent)",
        }}
      >
        {NODE.hbmGbFormatted}
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        style={{
          font: `500 10px var(--font-mono)`,
          letterSpacing: "0.16em",
          fill: "var(--ink-3)",
        }}
      >
        GB HBM3E
      </text>
      <text
        x={cx}
        y={cy + 40}
        textAnchor="middle"
        style={{
          font: `500 9px var(--font-mono)`,
          letterSpacing: "0.12em",
          fill: "var(--ink-3)",
        }}
      >
        {chords.length} LINKED PAIRS
      </text>
    </svg>
  );
}
