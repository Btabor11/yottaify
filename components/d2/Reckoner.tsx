"use client";

/**
 * D2's cost estimator, set as a reckoning slip — the tear-off sheet at the
 * back of a statement where you do the arithmetic yourself.
 *
 * Same shared `estimate()` as every other direction, so no direction can
 * present different totals. Everything here is markup, plus one range input.
 */

import { useState } from "react";
import { ESTIMATOR, PRICE_ROWS, RATE, row } from "@/content";
import { estimate, usd } from "@/lib/estimate";
import { Cite } from "./Cite";

const GPU_STEPS = [1, 2, 4, 8, 16];
const HOUR_PRESETS = [
  { value: 168, label: "1 week" },
  { value: 730, label: "1 month" },
  { value: 2190, label: "3 months" },
  { value: 8760, label: "1 year" },
];

/** Rows worth putting beside ours in a cost comparison. */
const COMPARE_IDS = ["verified-low", "median", "oracle", "aws"];

export function Reckoner() {
  const [gpus, setGpus] = useState<number>(ESTIMATOR.defaultGpus);
  const [hours, setHours] = useState<number>(ESTIMATOR.defaultHours);

  const { rows, ours } = estimate(gpus, hours);
  const compare = COMPARE_IDS.map((id) => rows.find((r) => r.row.id === id)!);
  const committed = rows.find((r) => r.row.id === "committed")!;

  return (
    <section aria-labelledby="reckoner-heading" className="border border-[var(--ink)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ink)] px-5 py-3 md:px-7">
        <h2 id="reckoner-heading" className="d2-caps text-[var(--ink)]">
          {ESTIMATOR.heading}
        </h2>
        <p className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
          Rate × GPUs × hours · nothing else
        </p>
      </div>

      <div className="grid gap-x-10 gap-y-9 px-5 py-7 md:px-7 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* --- inputs ----------------------------------------------------- */}
        <div>
          <p className="d2-prose max-w-[38ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
            {ESTIMATOR.body}
          </p>

          <fieldset className="mt-7">
            <legend className="d2-caps text-[var(--ink-3)]">GPUs</legend>
            <div className="mt-2 flex flex-wrap gap-x-1 gap-y-2">
              {GPU_STEPS.map((n) => {
                const active = gpus === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGpus(n)}
                    aria-pressed={active}
                    className="d2-figure border px-3 py-1.5 text-[0.875rem] transition-colors"
                    style={{
                      borderColor: active ? "var(--accent)" : "var(--edge)",
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "var(--accent-ink)" : "var(--ink-2)",
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-7">
            <label htmlFor="reckoner-hours" className="d2-caps text-[var(--ink-3)]">
              Hours
            </label>
            <div className="mt-2 flex items-baseline gap-3">
              <input
                id="reckoner-hours"
                type="number"
                min={1}
                max={8760}
                step={1}
                value={hours}
                onChange={(e) => setHours(Math.max(1, Math.min(8760, Number(e.target.value) || 1)))}
                className="d2-input d2-figure max-w-[8rem]"
              />
              <span className="d2-prose text-[0.8125rem] text-[var(--ink-3)]">
                {ESTIMATOR.hoursNote}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {HOUR_PRESETS.map((p) => {
                const active = hours === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setHours(p.value)}
                    aria-pressed={active}
                    className="d2-caps border-b pb-0.5 transition-colors"
                    style={{
                      color: active ? "var(--accent)" : "var(--ink-2)",
                      borderColor: active ? "var(--accent)" : "var(--rule-strong)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* the working, written out */}
          <p className="d2-figure mt-8 border-t border-[var(--rule-strong)] pt-3 text-[0.75rem] text-[var(--ink-3)]">
            {RATE.display} × {gpus} × {hours.toLocaleString("en-US")} h
          </p>
          <p className="d2-display mt-1 text-[clamp(1.75rem,4vw,2.5rem)] leading-none text-[var(--accent)]">
            {usd(ours.low)}
          </p>
          <p className="d2-caps mt-1.5 text-[0.5rem] text-[var(--ink-3)]">
            At our on-demand rate
            <Cite sourceId="ours" />
          </p>
        </div>

        {/* --- the same job, elsewhere ------------------------------------ */}
        <div>
          <p className="d2-caps border-b border-[var(--ink)] pb-2 text-[var(--ink-3)]">
            The same {gpus === 1 ? "GPU" : `${gpus} GPUs`} for {hours.toLocaleString("en-US")} hours,
            elsewhere
          </p>

          <dl className="mt-1">
            {compare.map((r) => {
              const delta = r.deltaVsOurs;
              return (
                <div
                  key={r.row.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 border-b border-[var(--rule)] py-3"
                >
                  <dt>
                    <span className="d2-prose block text-[0.9375rem] leading-snug text-[var(--ink)]">
                      {r.row.provider}
                      <Cite sourceId={r.row.sourceId} />
                    </span>
                    <span className="d2-caps mt-0.5 block text-[0.5rem] text-[var(--ink-3)]">
                      {r.row.display} {RATE.unitShort}
                    </span>
                  </dt>
                  <dd className="text-right">
                    <span className="d2-figure block text-[1rem] text-[var(--ink)]">
                      {usd(r.low)}
                    </span>
                    <span
                      className="d2-figure mt-0.5 block text-[0.6875rem]"
                      style={{ color: delta > 0 ? "var(--accent-2)" : "var(--ink-3)" }}
                    >
                      {delta > 0 ? `+${usd(delta)}` : usd(delta)}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>

          {/* Committed range shown as a range, and labelled market — not ours. */}
          <div className="mt-5 border-l-2 border-[var(--caution)] pl-4">
            <p className="d2-caps text-[var(--caution)]">Market committed range</p>
            <p className="d2-figure mt-1.5 text-[1rem] text-[var(--ink)]">
              {usd(committed.low)}
              {committed.high !== null && <> – {usd(committed.high)}</>}
            </p>
            <p className="d2-prose mt-1.5 max-w-[46ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty">
              {row("committed").note}
              <Cite sourceId={row("committed").sourceId} />
            </p>
          </div>

          <p className="d2-prose mt-6 max-w-[54ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty">
            {ESTIMATOR.disclaimer} Rates are the {PRICE_ROWS.length} published figures in the table
            above, unchanged.
          </p>
        </div>
      </div>
    </section>
  );
}
