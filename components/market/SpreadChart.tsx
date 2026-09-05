"use client";

import { useId, useMemo, useState } from "react";
import type { ProviderDigest, Snapshot } from "@/lib/market/types";
import { MARKET } from "@/content/market";
import { STOCK_GLYPH, STOCK_TOKEN, pct, usd } from "./format";

/**
 * Dumbbell-per-seller. Horizontal so twenty names fit. For each seller: a
 * thin bar from their lowest to highest figure (the spread), a filled disc at
 * the seller's own published rate, hollow discs at each tracker's report. Our
 * rate is a vertical hairline across every row — the one reference.
 *
 * Colour does two jobs only: source (filled accent = published, hollow ink
 * = reported) and stock (a glyph + status colour in the label column, never
 * colour alone). Identity is the row label. Nothing is coloured by rank.
 *
 * Every mark has a hit target much larger than itself (the whole row), and
 * the table view lives in ProviderDetail and the sources ledger, so hover is
 * never the only way to read a value.
 */
export function SpreadChart({ snap, hover, onHover, onPin }: { snap: Snapshot; hover: string | null; onHover: (id: string | null) => void; onPin: (id: string) => void }) {
  const id = useId();
  const rows = useMemo(() => snap.providers.filter((p) => p.low != null), [snap]);
  const [tip, setTip] = useState<{ p: ProviderDigest; x: number; y: number } | null>(null);

  if (!rows.length) return <p className="d3-body text-[var(--ink-2)]">{MARKET.spread.empty}</p>;

  const allFig = rows.flatMap((p) => [p.low!, p.high!]).concat(snap.ourRate);
  const min = Math.floor(Math.min(...allFig) - 0.5);
  const max = Math.ceil(Math.max(...allFig) + 0.5);
  const W = 720, LABEL = 148, RIGHT = 92, ROW = 30, TOP = 26, BOTTOM = 30;
  const plotW = W - LABEL - RIGHT;
  const H = TOP + rows.length * ROW + BOTTOM;
  const x = (v: number) => LABEL + ((v - min) / (max - min)) * plotW;
  const ticks = niceTicks(min, max, 6);

  return (
    <figure className="relative min-w-0">
      <figcaption className="sr-only">Published and reported B300 on-demand rates per seller, USD per GPU-hour, for {snap.day}.</figcaption>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[40rem]" role="img" aria-labelledby={`${id}-t`} style={{ fontFamily: "var(--fm)" }}>
          <title id={`${id}-t`}>Spread per seller</title>

          {/* grid: recessive, solid, behind */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={TOP - 8} y2={H - BOTTOM + 4} stroke="var(--rule)" strokeWidth={1} />
              <text x={x(t)} y={H - 10} textAnchor="middle" fontSize={10} fill="var(--ink-3)">${t}</text>
            </g>
          ))}

          {/* our rail — the emphasis */}
          <line x1={x(snap.ourRate)} x2={x(snap.ourRate)} y1={TOP - 14} y2={H - BOTTOM + 4} stroke="var(--accent)" strokeWidth={1.5} />
          <text x={x(snap.ourRate)} y={TOP - 18} textAnchor="middle" fontSize={10} fill="var(--accent)" letterSpacing="0.08em">OURS {usd(snap.ourRate)}</text>

          {rows.map((p, i) => {
            const cy = TOP + i * ROW + ROW / 2;
            const on = hover === p.provider;
            const dim = hover != null && !on;
            return (
              <g
                key={p.provider}
                opacity={dim ? 0.38 : 1}
                style={{ transition: "opacity 160ms var(--ease-mech)" }}
                onMouseEnter={(e) => { onHover(p.provider); setTip({ p, x: e.clientX, y: e.clientY }); }}
                onMouseMove={(e) => setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
                onMouseLeave={() => { onHover(null); setTip(null); }}
                onClick={() => onPin(p.provider)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onFocus={() => onHover(p.provider)}
                onBlur={() => onHover(null)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPin(p.provider); } }}
                aria-label={`${p.label}: ${p.published ? `published ${usd(p.published.usdPerGpuHour)}` : MARKET.states[p.publishedState]}, ${p.reported.length} tracker reports, spread ${pct(p.spread, 1)}, ${MARKET.stock[p.stock]}`}
              >
                {/* hit target */}
                <rect x={0} y={cy - ROW / 2} width={W} height={ROW} fill={on ? "color-mix(in oklab, var(--ink) 4%, transparent)" : "transparent"} />

                {/* label + stock glyph */}
                <text x={LABEL - 12} y={cy + 3.5} textAnchor="end" fontSize={11.5} fill={on ? "var(--ink)" : "var(--ink-2)"}>{p.label}</text>
                <text x={LABEL - 4} y={cy + 3.5} textAnchor="middle" fontSize={11} fill={STOCK_TOKEN[p.stock]} aria-hidden>{STOCK_GLYPH[p.stock]}</text>

                {/* spread bar */}
                {p.low != null && p.high != null && p.high > p.low && (
                  <rect x={x(p.low)} y={cy - 2} width={Math.max(2, x(p.high) - x(p.low))} height={4} rx={2} fill={on ? "var(--ink-2)" : "var(--rule-strong)"} opacity={on ? 0.7 : 1} />
                )}

                {/* reported: hollow */}
                {p.reported.map((r, k) => (
                  <circle key={k} cx={x(r.usdPerGpuHour)} cy={cy} r={4.5} fill="var(--bg)" stroke={on ? "var(--ink)" : "var(--ink-2)"} strokeWidth={1.5} />
                ))}

                {/* published: filled */}
                {p.published && <circle cx={x(p.published.usdPerGpuHour)} cy={cy} r={5.5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />}

                {/* right column: the spread when there is one, otherwise why there is no published figure */}
                {p.spread != null && p.spread > 0.005 ? (
                  <text x={W - 8} y={cy + 3.5} textAnchor="end" fontSize={10.5} fill={p.spread > 0.1 ? "var(--caution)" : "var(--ink-3)"}>{pct(p.spread, 1)}</text>
                ) : !p.published ? (
                  <text x={W - 8} y={cy + 3.5} textAnchor="end" fontSize={8.5} fill="var(--ink-3)" letterSpacing="0.08em">{MARKET.states[p.publishedState].toUpperCase()}</text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* legend — always present, ≥ 2 encodings */}
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 d3-tag text-[var(--ink-3)]">
        <li className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />{MARKET.floor.legend.published}</li>
        <li className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-[var(--ink-2)]" />{MARKET.floor.legend.reported}</li>
        <li className="flex items-center gap-2"><span className="inline-block h-1 w-5 rounded bg-[var(--rule-strong)]" />{MARKET.floor.legend.band}</li>
        <li className="flex items-center gap-2"><span className="inline-block h-3 w-px bg-[var(--accent)]" />{MARKET.floor.legend.rail}</li>
        <li className="flex items-center gap-2"><span style={{ color: STOCK_TOKEN["in-stock"] }}>{STOCK_GLYPH["in-stock"]}</span>{MARKET.stock["in-stock"]}</li>
        <li className="flex items-center gap-2"><span style={{ color: STOCK_TOKEN.limited }}>{STOCK_GLYPH.limited}</span>{MARKET.stock.limited}</li>
        <li className="flex items-center gap-2"><span style={{ color: STOCK_TOKEN["out-of-stock"] }}>{STOCK_GLYPH["out-of-stock"]}</span>{MARKET.stock["out-of-stock"]}</li>
        <li className="flex items-center gap-2"><span className="text-[var(--ink-3)]">{STOCK_GLYPH["not-reported"]}</span>{MARKET.stock["not-reported"]}</li>
      </ul>

      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-50 max-w-xs border border-[var(--edge)] bg-[var(--surface)] p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]"
          style={{ left: tip.x + 14, top: tip.y + 14 }}
        >
          <p className="d3-body text-[0.875rem] text-[var(--ink)]">{tip.p.label}</p>
          <dl className="d3-figure mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.75rem]">
            <dt className="text-[var(--ink-3)]">Published</dt><dd className="text-[var(--accent)]">{tip.p.published ? usd(tip.p.published.usdPerGpuHour) : MARKET.states[tip.p.publishedState]}</dd>
            {tip.p.reported.map((r, i) => (<><dt key={`k${i}`} className="text-[var(--ink-3)]">{r.sourceId}</dt><dd key={`v${i}`} className="text-[var(--ink)]">{usd(r.usdPerGpuHour)}</dd></>))}
            <dt className="text-[var(--ink-3)]">Spread</dt><dd className="text-[var(--ink)]">{pct(tip.p.spread, 1)}</dd>
            <dt className="text-[var(--ink-3)]">Stock</dt><dd style={{ color: STOCK_TOKEN[tip.p.stock] }}>{STOCK_GLYPH[tip.p.stock]} {MARKET.stock[tip.p.stock]}</dd>
          </dl>
          <p className="d3-tag mt-2 text-[var(--ink-3)]">click to pin</p>
        </div>
      )}
    </figure>
  );
}

function niceTicks(min: number, max: number, n: number): number[] {
  const span = max - min;
  const step = [1, 2, 2.5, 5, 10].map((s) => s * 10 ** Math.floor(Math.log10(span / n))).find((s) => span / s <= n) ?? 1;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}
