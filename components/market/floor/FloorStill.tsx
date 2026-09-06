import type { Snapshot } from "@/lib/market/types";
import { MARKET } from "@/content/market";
import { STOCK_GLYPH, STOCK_TOKEN, railRate, usd } from "../format";

/**
 * The floor as a drawing. Server-rendered SVG: what everyone without WebGL,
 * with reduced motion, on a weak device, or before the canvas mounts sees.
 * It is not a placeholder — it is the same picture, flat: lanes, a module at
 * the published altitude, rings at the reported ones, a band between, and
 * the rail across. The canvas cross-fades in over it when it is ready.
 */
export function FloorStill({ snap, hover }: { snap: Snapshot; hover: string | null }) {
  const lanes = snap.providers.filter((p) => p.low != null);
  const rail = railRate(snap);
  const maxP = Math.max(rail ?? 0, ...lanes.map((p) => p.high!)) + 1;
  const W = 1200, H = 520, L = 90, R = 40, T = 40, B = 70;
  const laneW = (W - L - R) / Math.max(1, lanes.length);
  const y = (v: number) => T + (1 - v / maxP) * (H - T - B);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`The market floor: each seller's published and reported B300 prices as altitudes, with ${MARKET.railLabel.toLowerCase()} drawn across as a rail.`} style={{ fontFamily: "var(--fm)" }}>
      <defs>
        <linearGradient id="floor-ground" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--surface)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--surface)" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect x="0" y={H - B - 30} width={W} height={B + 30} fill="url(#floor-ground)" />
      {[2, 4, 6, 8, 10, 12, 14, 16, 18].filter((v) => v < maxP).map((v) => (
        <g key={v}>
          <line x1={L - 20} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--rule)" />
          <text x={L - 26} y={y(v) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-3)">${v}</text>
        </g>
      ))}
      {/* rail: the lowest rate anyone confirmed as buyable today */}
      {rail != null && (
        <>
          <line x1={L - 30} x2={W - R} y1={y(rail)} y2={y(rail)} stroke="var(--accent)" strokeWidth={2} />
          <text x={W - R} y={y(rail) - 8} textAnchor="end" fontSize={10} fill="var(--accent)" letterSpacing="0.08em">
            {MARKET.railShort} {usd(rail)}
          </text>
        </>
      )}

      {lanes.map((p, i) => {
        const cx = L + i * laneW + laneW / 2;
        const anchor = p.published?.usdPerGpuHour ?? p.low!;
        const on = hover === p.provider;
        const dim = hover != null && !on;
        return (
          <g key={p.provider} opacity={dim ? 0.4 : 1}>
            <line x1={cx} x2={cx} y1={y(anchor)} y2={H - B} stroke="var(--rule-strong)" />
            {p.high! - p.low! > 0.005 && <rect x={cx - laneW * 0.28} y={y(p.high!)} width={laneW * 0.56} height={Math.max(2, y(p.low!) - y(p.high!))} fill="var(--ink-2)" opacity={on ? 0.3 : 0.14} />}
            {p.reported.map((r, k) => <ellipse key={k} cx={cx} cy={y(r.usdPerGpuHour)} rx={laneW * 0.3} ry={4} fill="none" stroke="var(--ink-2)" strokeWidth={1.2} />)}
            <rect x={cx - laneW * 0.32} y={y(anchor) - 5} width={laneW * 0.64} height={10} rx={1} fill={p.published ? "var(--ink)" : "none"} stroke={p.published ? "none" : "var(--ink-3)"} strokeDasharray={p.published ? undefined : "3 2"} />
            <rect x={cx - laneW * 0.3} y={y(anchor) + 3} width={laneW * 0.6} height={2} fill={STOCK_TOKEN[p.stock]} />
            <text x={cx} y={y(anchor) - 12} textAnchor="middle" fontSize={10} fill={p.published ? "var(--ink)" : "var(--ink-3)"}>{p.published ? usd(p.published.usdPerGpuHour) : `≈${usd(p.low!)}`}</text>
            {/* Names alternate baselines when lanes are narrow so twenty of them do not collide. */}
            <text x={cx} y={H - B + (laneW < 64 && i % 2 ? 30 : 18)} textAnchor="middle" fontSize={9.5} fill="var(--ink-2)">{p.label.length > 11 ? p.label.slice(0, 10) + "…" : p.label}</text>
            <text x={cx} y={H - B + 44} textAnchor="middle" fontSize={10} fill={STOCK_TOKEN[p.stock]} aria-label={MARKET.stock[p.stock]}>{STOCK_GLYPH[p.stock]}{laneW >= 96 ? ` ${MARKET.stock[p.stock]}` : ""}</text>
          </g>
        );
      })}
    </svg>
  );
}
