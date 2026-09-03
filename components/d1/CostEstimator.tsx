"use client";

import { useId, useState } from "react";
import { ESTIMATOR, FLEET, verificationKind, formatAsOfShort, source } from "@/content";
import { estimate, usd } from "@/lib/estimate";

/**
 * The arithmetic, exposed rather than asserted.
 *
 * A skeptical buyer's first instinct on any pricing page is "what does that
 * actually cost me". Making them open a calculator is a drop-off. Doing the
 * multiplication for them, on rates they can see the sources for, with inputs
 * they control, is the transparent version of the same move.
 */
export function CostEstimator() {
  const [gpus, setGpus] = useState(ESTIMATOR.defaultGpus);
  const [hours, setHours] = useState(ESTIMATOR.defaultHours);
  const gpuId = useId();
  const hourId = useId();

  const { rows, ours } = estimate(gpus, hours);
  const max = Math.max(...rows.map((r) => r.high ?? r.low)) || 1;

  return (
    <section aria-labelledby="estimator-heading">
      <div className="d1-sechead">
        <span className="d1-figure text-[0.625rem] text-[var(--accent)]">E</span>
        <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
        <span className="d1-label text-[var(--ink-3)]">Estimator</span>
      </div>

      <div className="mt-8 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div>
          <h2 id="estimator-heading" className="d1-display-loose text-[clamp(1.375rem,3vw,2rem)]">
            {ESTIMATOR.heading}
          </h2>
          <p className="d1-body mt-4 max-w-[40ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
            {ESTIMATOR.body}
          </p>

          <div className="mt-8 grid gap-5">
            <div>
              <label htmlFor={gpuId} className="d1-label text-[var(--ink-2)]">
                GPUs
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id={gpuId}
                  type="range"
                  min={1}
                  max={FLEET.total}
                  step={1}
                  value={gpus}
                  onChange={(e) => setGpus(Number(e.target.value))}
                  className="h-1 flex-1 appearance-none bg-[var(--rule-strong)] accent-[var(--accent)]"
                  style={{ accentColor: "var(--accent)" }}
                />
                <output
                  htmlFor={gpuId}
                  className="d1-figure w-14 shrink-0 text-right text-[1.125rem] text-[var(--accent)]"
                >
                  {gpus}
                </output>
              </div>
              <p className="d1-label mt-2 normal-case tracking-[0.03em] text-[var(--ink-3)]">
                Capped at {FLEET.total} because that is the fleet.
              </p>
            </div>

            <div>
              <label htmlFor={hourId} className="d1-label text-[var(--ink-2)]">
                Hours
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id={hourId}
                  type="number"
                  min={1}
                  max={8760}
                  step={1}
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
                  className="d1-field d1-figure w-32"
                />
                <span className="d1-label normal-case tracking-[0.03em] text-[var(--ink-3)]">
                  {ESTIMATOR.hoursNote}
                </span>
              </div>
            </div>
          </div>

          <p className="d1-label mt-8 max-w-[44ch] border-t border-[var(--rule)] pt-4 normal-case tracking-[0.03em] text-[var(--ink-3)]">
            {ESTIMATOR.disclaimer}
          </p>
        </div>

        {/* --- results ---------------------------------------------------- */}
        <ul className="border-t border-[var(--rule-strong)]" aria-live="polite">
          {rows.map((r) => {
            const doubtful = verificationKind(r.row.sourceId) === "unverified-listing";
            const src = source(r.row.sourceId);
            const isUs = Boolean(r.row.isUs);
            return (
              <li
                key={r.row.id}
                className="border-b border-[var(--rule)] py-3.5"
                style={isUs ? { background: "color-mix(in oklab, var(--accent) 5%, transparent)" } : undefined}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3">
                  <span
                    className="text-[0.875rem] font-medium"
                    style={{ color: isUs ? "var(--accent)" : "var(--ink)" }}
                  >
                    {r.row.provider}
                  </span>
                  <span className="flex items-baseline gap-3">
                    <span
                      className="d1-figure text-[1rem] leading-none"
                      style={{ color: isUs ? "var(--accent)" : "var(--ink)" }}
                    >
                      {usd(r.low)}
                      {r.high !== null && r.high !== r.low && (
                        <span className="text-[var(--ink-3)]">–{usd(r.high)}</span>
                      )}
                    </span>
                    {!isUs && (
                      <span
                        className="d1-figure w-24 shrink-0 text-right text-[0.6875rem]"
                        style={{ color: r.deltaVsOurs > 0 ? "var(--hot)" : "var(--accent-2)" }}
                      >
                        {r.deltaVsOurs > 0 ? "+" : ""}
                        {usd(r.deltaVsOurs)}
                      </span>
                    )}
                  </span>
                </div>

                <div className="mt-2 px-3">
                  <div className="h-1.5 w-full bg-[var(--surface-2)]">
                    <div
                      className="h-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${((r.high ?? r.low) / max) * 100}%`,
                        background: isUs
                          ? "var(--accent)"
                          : doubtful
                            ? "var(--caution)"
                            : "var(--rule-strong)",
                        opacity: doubtful ? 0.5 : 1,
                      }}
                    />
                  </div>
                  <p className="d1-label mt-1.5 normal-case tracking-[0.03em] text-[var(--ink-3)]">
                    {r.row.display} {r.row.term.toLowerCase()} · {src.label} ·{" "}
                    {formatAsOfShort(src.accessed)}
                  </p>
                </div>
              </li>
            );
          })}
          <li className="px-3 py-3.5">
            <p className="d1-label normal-case tracking-[0.03em] text-[var(--ink-3)]">
              Baseline for the difference column is our own {usd(ours.low)}.
            </p>
          </li>
        </ul>
      </div>
    </section>
  );
}
