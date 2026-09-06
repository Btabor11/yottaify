"use client";

/**
 * The estimator, read as a load calculation rather than a pricing widget: the
 * fleet is a bank of cells you energise, hours are a duty period, and
 * the result is stated at poster scale because a six-figure number is the
 * thing the reader came for.
 *
 * What it prices is the MARKET, not us. The poster figure is the benchmark —
 * the cheapest run a buyer could actually have booked on the day we checked —
 * and every other row is a delta against it. We do not publish a rate, so
 * there is no line here for one; where we land relative to that figure is
 * stated in words underneath, and settled on the call.
 */

import { useEffect, useId, useRef, useState } from "react";
import { trackEstimator } from "@/lib/analytics";
import { track as journey } from "@/lib/journey";
import {
  ESTIMATOR,
  FLEET,
  BENCHMARK,
  QUOTE,
  verificationKind,
  formatAsOfShort,
  source,
} from "@/content";
import { estimate, usd } from "@/lib/estimate";

const HOUR_PRESETS = [
  { value: 168, label: "1 wk" },
  { value: 730, label: "1 mo" },
  { value: 2190, label: "3 mo" },
  { value: 8760, label: "1 yr" },
];

export function LoadCalc() {
  const [gpus, setGpus] = useState<number>(ESTIMATOR.defaultGpus);
  const [hours, setHours] = useState<number>(ESTIMATOR.defaultHours);
  const gpuId = useId();
  const hourId = useId();

  const { rows, benchmark } = estimate(gpus, hours);
  const max = Math.max(...rows.map((r) => r.high ?? r.low)) || 1;

  // Record what the visitor priced, debounced so a drag across the cells
  // lands once. The last values ride along with the reservation, so the
  // person reading the lead knows the job the visitor had in mind.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      journey.estimator(gpus, hours);
      trackEstimator(gpus, hours);
    }, 800);
    return () => clearTimeout(t);
  }, [gpus, hours]);

  return (
    <section aria-labelledby="calc-heading" className="d3-panel d3-ticks">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[var(--rule-strong)] px-5 py-3 md:px-7">
        <h2 id="calc-heading" className="d3-tag text-[var(--ink)]">
          {ESTIMATOR.heading}
        </h2>
        <p className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">
          Rate × GPUs × hours · no other terms
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-9 px-5 py-7 md:px-7 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* --- inputs ----------------------------------------------------- */}
        <div>
          <p className="d3-body max-w-[38ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
            {ESTIMATOR.body}
          </p>

          {/* One cell per device, wrapped one node per row. Clicking cell n
              energises 1..n, which makes the cap on the fleet a visible fact
              rather than a note under a slider. A single row stopped working
              at six nodes: forty-eight cells across a panel this wide are
              two pixels each and cannot be hit. */}
          <div className="mt-7">
            <label htmlFor={gpuId} className="d3-tag text-[0.5rem] text-[var(--ink-2)]">
              GPUs energised
            </label>
            <div className="mt-2.5 flex items-start gap-3">
              <input
                id={gpuId}
                type="range"
                min={1}
                max={FLEET.total}
                step={1}
                value={gpus}
                onChange={(e) => setGpus(Number(e.target.value))}
                className="sr-only"
              />
              <div
                className="grid flex-1 gap-[3px]"
                style={{ gridTemplateColumns: `repeat(${FLEET.gpusPerNode}, minmax(0, 1fr))` }}
                aria-hidden
              >
                {Array.from({ length: FLEET.total }, (_, i) => {
                  const on = i < gpus;
                  return (
                    <button
                      key={i}
                      type="button"
                      tabIndex={-1}
                      onClick={() => setGpus(i + 1)}
                      className="h-5 border transition-all duration-200"
                      style={{
                        borderColor: on ? "var(--accent)" : "var(--rule-strong)",
                        background: on
                          ? "color-mix(in oklab, var(--accent) 32%, transparent)"
                          : "transparent",
                        boxShadow: on ? "0 0 10px -4px var(--accent)" : undefined,
                      }}
                    />
                  );
                })}
              </div>
              <output
                htmlFor={gpuId}
                className="d3-figure w-10 shrink-0 text-right text-[1.125rem] text-[var(--accent)]"
              >
                {gpus}
              </output>
            </div>
            <p className="d3-tag mt-2 text-[0.4375rem] text-[var(--ink-3)]">
              One row per node · capped at {FLEET.total} because that is the fleet
            </p>
          </div>

          <div className="mt-7">
            <label htmlFor={hourId} className="d3-tag text-[0.5rem] text-[var(--ink-2)]">
              Duty hours
            </label>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <input
                id={hourId}
                type="number"
                min={1}
                max={8760}
                step={1}
                value={hours}
                onChange={(e) => setHours(Math.max(1, Math.min(8760, Number(e.target.value) || 1)))}
                className="d3-input d3-figure w-28"
              />
              <div className="flex gap-1.5">
                {HOUR_PRESETS.map((p) => {
                  const active = hours === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setHours(p.value)}
                      aria-pressed={active}
                      className="d3-tag border px-2 py-1.5 text-[0.5rem] transition-colors"
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--edge)",
                        color: active ? "var(--accent)" : "var(--ink-2)",
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="d3-tag mt-2 text-[0.4375rem] text-[var(--ink-3)]">
              {ESTIMATOR.hoursNote}
            </p>
          </div>

          {/* --- the result -------------------------------------------- */}
          <div className="mt-8 border-t border-[var(--rule-strong)] pt-5">
            <p className="d3-figure text-[0.6875rem] text-[var(--ink-3)]">
              {BENCHMARK.display} × {gpus} × {hours.toLocaleString("en-US")} h
            </p>
            <p
              className="d3-display mt-2 text-[clamp(2rem,4.5vw,3rem)] leading-none text-[var(--accent)]"
              style={{ ["--wght" as string]: 800 }}
              aria-live="polite"
            >
              {usd(benchmark.low)}
            </p>
            <p className="d3-tag mt-2 max-w-[34ch] text-[0.4375rem] leading-relaxed text-[var(--ink-3)]">
              {ESTIMATOR.benchmarkNote}
            </p>
          </div>

          <div className="mt-5 border-l-2 border-[var(--accent)] pl-4">
            <p className="d3-tag text-[var(--accent)]">{QUOTE.label}</p>
            <p className="d3-body mt-2 max-w-[40ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
              {ESTIMATOR.ourNote}
            </p>
          </div>

          <p className="d3-body mt-6 max-w-[44ch] text-[0.75rem] text-[var(--ink-3)] text-pretty">
            {ESTIMATOR.disclaimer}
          </p>
        </div>

        {/* --- the same job elsewhere ------------------------------------- */}
        <ul className="border-t border-[var(--rule-strong)]" aria-live="polite">
          {rows.map((r) => {
            const doubtful = verificationKind(r.row.sourceId) === "unverified-listing";
            const src = source(r.row.sourceId);
            const datum = Boolean(r.row.isBenchmark);
            return (
              <li
                key={r.row.id}
                className="border-b border-[var(--rule)] px-3 py-3.5"
                style={
                  datum ? { background: "color-mix(in oklab, var(--accent) 7%, transparent)" } : undefined
                }
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span
                    className="d3-body text-[0.875rem] font-medium"
                    style={{ color: datum ? "var(--accent)" : "var(--ink)" }}
                  >
                    {r.row.provider}
                  </span>
                  <span className="flex items-baseline gap-3">
                    <span
                      className="d3-figure text-[1rem] leading-none"
                      style={{ color: datum ? "var(--accent)" : "var(--ink)" }}
                    >
                      {usd(r.low)}
                      {r.high !== null && r.high !== r.low && (
                        <span className="text-[var(--ink-3)]">–{usd(r.high)}</span>
                      )}
                    </span>
                    {!datum && (
                      <span
                        className="d3-figure w-24 shrink-0 text-right text-[0.6875rem]"
                        style={{ color: r.deltaVsBenchmark > 0 ? "var(--ink-2)" : "var(--caution)" }}
                      >
                        {r.deltaVsBenchmark > 0 ? "+" : ""}
                        {usd(r.deltaVsBenchmark)}
                      </span>
                    )}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="h-1.5 w-full bg-[var(--surface-2)]">
                    <div
                      className="h-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${((r.high ?? r.low) / max) * 100}%`,
                        background: datum
                          ? "var(--accent)"
                          : doubtful
                            ? "var(--caution)"
                            : "var(--rule-strong)",
                        opacity: doubtful ? 0.55 : 1,
                        boxShadow: datum ? "0 0 12px -3px var(--accent)" : undefined,
                      }}
                    />
                  </div>
                  <p className="d3-tag mt-1.5 text-[0.4375rem] text-[var(--ink-3)]">
                    {r.row.display} {r.row.term.toLowerCase()} · {src.label} ·{" "}
                    {formatAsOfShort(src.accessed)}
                  </p>
                </div>
              </li>
            );
          })}
          <li className="px-3 py-3.5">
            <p className="d3-tag text-[0.4375rem] leading-relaxed text-[var(--ink-3)]">
              Baseline for the difference column is {usd(benchmark.low)} — the same job at the
              lowest rate anyone could confirm as in stock
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
