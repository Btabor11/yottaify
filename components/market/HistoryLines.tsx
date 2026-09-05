"use client";

import { useId, useState } from "react";
import type { Snapshot } from "@/lib/market/types";
import { dayLabel, usd } from "./format";

/**
 * Two single-series line charts, not one dual-axis chart. Legibility (0–100)
 * and median published on-demand (USD) are different scales; they get
 * different plots stacked, sharing the x axis and the crosshair.
 */
export function HistoryLines({ days, index, onChange }: { days: Snapshot[]; index: number; onChange: (i: number) => void }) {
  const id = useId();
  const [hx, setHx] = useState<number | null>(null);
  const W = 720, H = 120, L = 44, R = 16, T = 14, B = 22;
  const n = days.length;
  const x = (i: number) => (n === 1 ? L + (W - L - R) / 2 : L + (i / (n - 1)) * (W - L - R));
  const active = hx ?? index;

  const series = [
    { key: "legibility", label: "Legibility index", get: (s: Snapshot) => s.legibility.index, domain: [0, 100] as [number, number], fmt: (v: number) => String(Math.round(v)) },
    { key: "median", label: "Median published on-demand", get: (s: Snapshot) => s.medianOnDemand ?? NaN, domain: null, fmt: (v: number) => usd(v) },
  ];

  return (
    <div className="grid gap-6">
      {series.map((sr) => {
        const vals = days.map(sr.get);
        const finite = vals.filter(Number.isFinite);
        const [d0, d1] = sr.domain ?? [Math.floor(Math.min(...finite) - 0.5), Math.ceil(Math.max(...finite) + 0.5)];
        const y = (v: number) => T + (1 - (v - d0) / (d1 - d0 || 1)) * (H - T - B);
        const path = vals.map((v, i) => (Number.isFinite(v) ? `${i === 0 || !Number.isFinite(vals[i - 1]) ? "M" : "L"}${x(i)},${y(v)}` : "")).join(" ");
        const cur = vals[active];
        return (
          <figure key={sr.key}>
            <figcaption className="flex items-baseline justify-between gap-4">
              <span className="d3-tag text-[var(--ink-3)]">{sr.label}</span>
              <span className="d3-figure text-[0.9375rem] text-[var(--ink)]">
                {Number.isFinite(cur) ? sr.fmt(cur) : "—"} <span className="text-[var(--ink-3)]">· {days[active] ? dayLabel(days[active].day) : ""}</span>
              </span>
            </figcaption>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mt-2 w-full touch-none"
              role="img"
              aria-labelledby={`${id}-${sr.key}`}
              style={{ fontFamily: "var(--fm)" }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const px = ((e.clientX - r.left) / r.width) * W;
                const i = n === 1 ? 0 : Math.round(((px - L) / (W - L - R)) * (n - 1));
                setHx(Math.max(0, Math.min(n - 1, i)));
              }}
              onMouseLeave={() => setHx(null)}
              onClick={() => hx != null && onChange(hx)}
            >
              <title id={`${id}-${sr.key}`}>{`${sr.label} over recorded days`}</title>
              {[d0, (d0 + d1) / 2, d1].map((t) => (
                <g key={t}>
                  <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
                  <text x={L - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-3)">{sr.fmt(t)}</text>
                </g>
              ))}
              {n > 1 && <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
              {days.map((_, i) => Number.isFinite(vals[i]) && (
                <circle key={i} cx={x(i)} cy={y(vals[i])} r={i === active ? 5 : n <= 12 ? 3.5 : 0} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
              ))}
              {/* crosshair */}
              <line x1={x(active)} x2={x(active)} y1={T - 6} y2={H - B + 4} stroke="var(--ink-2)" strokeWidth={1} opacity={0.6} />
              {/* x labels: first, last, active */}
              {[0, n - 1].filter((i, k, a) => a.indexOf(i) === k).map((i) => (
                <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : "end"} fontSize={10} fill="var(--ink-3)">{days[i] ? dayLabel(days[i].day) : ""}</text>
              ))}
            </svg>
          </figure>
        );
      })}
    </div>
  );
}
