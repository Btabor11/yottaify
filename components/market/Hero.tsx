"use client";

import type { Snapshot } from "@/lib/market/types";
import { MARKET } from "@/content/market";
import { dayLong, pct, usd } from "./format";
import { PROVIDER_LABEL } from "@/lib/market/catalog";

/**
 * The hero is one number and its four parts. The number is set in the body
 * sans with proportional figures — a large standalone figure is not a table
 * cell, and the mono would make "57" as wide as "100".
 */
export function Hero({ snap, dayCount }: { snap: Snapshot; dayCount: number }) {
  const L = snap.legibility;
  const parts = [
    { key: "agreement", value: L.agreement, weight: 40, note: `${L.comparedProviders} sellers with ≥ 2 figures` },
    { key: "coverage", value: L.coverage, weight: 25, note: `${snap.providers.filter((p) => p.published).length} read first-hand` },
    { key: "visibility", value: L.visibility, weight: 15, note: `${snap.providers.filter((p) => p.stock !== "not-reported").length} of ${snap.providers.length} sellers` },
    { key: "bookable", value: L.bookable, weight: 20, note: snap.inStock ? `${snap.inStock.count} of ${snap.inStock.total} configs` : "not counted today" },
  ] as const;

  return (
    <section aria-labelledby="market-h1" className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-20">
      <div>
        <p className="d3-tag text-[var(--ink-3)]">{MARKET.eyebrow} · {dayLong(snap.day)}{(snap as Snapshot & { synthetic?: boolean }).synthetic ? " · synthetic" : ""}</p>
        <h1 id="market-h1" className="d3-display mt-5 text-[clamp(2.25rem,5.2vw,4.25rem)] text-balance" data-r>
          {MARKET.h1}
        </h1>
        <p className="d3-body mt-7 max-w-[54ch] text-[1.0625rem] text-[var(--ink-2)] text-pretty" data-r>
          {MARKET.standfirst}
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-px border border-[var(--rule-strong)] bg-[var(--rule-strong)] sm:grid-cols-4" data-r>
          <Stat label="Median published on-demand" value={usd(snap.medianOnDemand)} sub={`${snap.providers.filter((p) => p.low != null).length} sellers`} />
          <Stat label="Lowest listed" value={usd(snap.lowestListed?.usdPerGpuHour)} sub={snap.lowestListed ? `${PROVIDER_LABEL[snap.lowestListed.provider]} via ${snap.lowestListed.sourceId}` : "—"} />
          <Stat label="Lowest bookable" value={usd(snap.lowestBookable?.usdPerGpuHour)} sub={snap.lowestBookable ? `${PROVIDER_LABEL[snap.lowestBookable.provider]} via ${snap.lowestBookable.sourceId}` : "none confirmed"} />
          <Stat label={MARKET.ourRail} value={usd(snap.ourRate)} sub={MARKET.ourRailNote} accent />
        </dl>
      </div>

      <div className="d3-panel d3-ticks relative flex flex-col p-6 md:p-8" data-r>
        <p className="d3-tag text-[var(--ink-3)]">{MARKET.hero.label}</p>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="d3-body text-[clamp(4rem,9vw,6.5rem)] font-semibold leading-none tracking-[-0.04em] text-[var(--ink)] [font-variant-numeric:lining-nums_proportional-nums]">
            {L.index}
          </span>
          <span className="d3-figure text-[0.875rem] text-[var(--ink-3)]">/ 100</span>
        </div>
        <p className="d3-body mt-4 text-[0.875rem] text-[var(--ink-2)]">{MARKET.hero.explain}</p>

        <Meter value={L.index / 100} className="mt-6" />

        <ul className="mt-6 grid gap-3">
          {parts.map((p) => {
            const c = MARKET.hero.components[p.key];
            return (
              <li key={p.key} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-t border-[var(--rule)] pt-3">
                <span className="d3-body text-[0.875rem] text-[var(--ink)]">{c.label} <span className="d3-figure text-[0.625rem] text-[var(--ink-3)]">×{p.weight}%</span></span>
                <span className="d3-figure text-[0.9375rem] text-[var(--ink)]">{pct(p.value)}</span>
                <span className="col-span-2 d3-body text-[0.8125rem] text-[var(--ink-3)]">{c.explain} <span className="text-[var(--ink-2)]">{p.note}.</span></span>
              </li>
            );
          })}
        </ul>
        <p className="d3-tag mt-6 text-[var(--ink-3)]">{dayCount === 1 ? "first day of record" : `${dayCount} days of record`}</p>
      </div>
    </section>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 bg-[var(--surface)] p-4">
      <dt className="d3-tag text-[var(--ink-3)]">{label}</dt>
      <dd className={`d3-figure text-[1.375rem] ${accent ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>{value}</dd>
      <dd className="d3-body text-[0.75rem] text-[var(--ink-3)]">{sub}</dd>
    </div>
  );
}

/** Same-hue track: the fill is the accent, the track is the accent at low alpha. */
export function Meter({ value, className = "", label }: { value: number; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={className} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label ?? "meter"}>
      <div className="h-1.5 w-full overflow-hidden bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]">
        <div className="h-full bg-[var(--accent)] transition-[width] duration-700 [transition-timing-function:var(--ease-out-expo)]" style={{ width: `${v * 100}%` }} />
      </div>
    </div>
  );
}
