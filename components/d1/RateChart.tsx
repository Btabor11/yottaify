import {
  CHART_ROWS,
  OUR_RATE,
  RATE,
  multipleOfOurRate,
  verificationShort,
  verificationKind,
  source,
  formatAsOfShort,
  type PriceRow,
} from "@/content";

/**
 * The rate chart, drawn as an instrument.
 *
 * Design decisions that carry the argument:
 *
 *  · A dashed datum line sits at our rate in EVERY row, so each bar is read
 *    against $6.75 without the user doing arithmetic.
 *  · Ranges are drawn as a solid bar to the low value plus a hatched extension
 *    to the high value. "At least this, possibly this."
 *  · The sub-$7 neocloud band is on the chart, amber and hatched, tagged
 *    UNVERIFIED. Hiding it would be the dishonest choice and a technical buyer
 *    would find it in ten minutes anyway. Showing it and explaining it is the
 *    entire position.
 *
 * Server component. Bar growth is handled by the shared RevealRoot via
 * data-reveal-bar, so this ships no JavaScript of its own.
 */

const AXIS_MAX = 18; // covers the $17.80 top of range with a round axis
const TICKS = [0, 5, 10, 15];

const TONE: Record<PriceRow["category"], { bar: string; text: string }> = {
  ours: { bar: "var(--accent)", text: "var(--accent)" },
  verified: { bar: "var(--accent-2)", text: "var(--accent-2)" },
  median: { bar: "var(--ink-3)", text: "var(--ink-2)" },
  unverified: { bar: "var(--caution)", text: "var(--caution)" },
  hyperscaler: { bar: "var(--hot)", text: "var(--hot)" },
  committed: { bar: "var(--ink-3)", text: "var(--ink-2)" },
};

function pct(value: number) {
  return `${(value / AXIS_MAX) * 100}%`;
}

export function RateChart() {
  return (
    <figure data-reveal-bars className="d1-ticked border border-[var(--rule-strong)]">
      {/* --- axis ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 border-b border-[var(--rule-strong)] bg-[var(--surface)] md:grid-cols-[13rem_1fr] lg:grid-cols-[16rem_1fr]">
        <div className="hidden items-baseline justify-between gap-2 px-4 py-2.5 md:flex">
          <span className="d1-label text-[var(--ink-3)]">Provider</span>
          <span className="d1-label text-[var(--ink-3)]">USD/hr</span>
        </div>
        <div className="relative h-9 border-l-0 md:border-l md:border-[var(--rule-strong)]">
          {TICKS.map((t) => (
            <div
              key={t}
              className="absolute bottom-0 top-0 flex items-center"
              style={{ left: pct(t) }}
            >
              <span aria-hidden className="absolute bottom-0 top-0 w-px bg-[var(--rule-strong)]" />
              <span className="d1-figure absolute bottom-1.5 left-1.5 whitespace-nowrap text-[0.5625rem] text-[var(--ink-3)]">
                ${t}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- rows ---------------------------------------------------------- */}
      <ul>
        {CHART_ROWS.map((r) => {
          const tone = TONE[r.category];
          const src = source(r.sourceId);
          const isRange = typeof r.high === "number";
          const kind = verificationKind(r.sourceId);
          const doubtful = kind === "unverified-listing";

          return (
            <li
              key={r.id}
              className="grid grid-cols-1 border-b border-[var(--rule)] last:border-b-0 md:grid-cols-[13rem_1fr] lg:grid-cols-[16rem_1fr]"
              style={r.isUs ? { background: "color-mix(in oklab, var(--accent) 4%, transparent)" } : undefined}
            >
              {/* label column */}
              <div className="flex flex-col justify-center gap-1 px-4 pb-2 pt-3.5 md:py-3.5">
                <span
                  className="text-[0.875rem] font-medium leading-tight"
                  style={{ color: r.isUs ? "var(--accent)" : "var(--ink)" }}
                >
                  {r.provider}
                </span>
                <span className="d1-label normal-case tracking-[0.04em] text-[var(--ink-3)]">
                  {r.qualifier} · {r.term}
                </span>
              </div>

              {/* bar column */}
              <div className="relative flex items-center gap-3 px-4 pb-4 pt-1 md:border-l md:border-[var(--rule-strong)] md:py-3.5 md:pl-0">
                {/* Axis ticks continued through every row, so a bar can be read
                    against the scale without travelling back up to the header. */}
                {TICKS.filter((t) => t > 0).map((t) => (
                  <span
                    key={t}
                    aria-hidden
                    className="absolute bottom-0 top-0 hidden w-px bg-[var(--rule)] md:block"
                    style={{ left: pct(t) }}
                  />
                ))}

                {/* Datum line at our rate, repeated per row so it reads as one
                    continuous reference across the whole chart. */}
                <span
                  aria-hidden
                  className="absolute bottom-0 top-0 hidden w-px md:block"
                  style={{
                    left: pct(OUR_RATE),
                    background: r.isUs ? "var(--accent)" : "transparent",
                    borderLeft: r.isUs
                      ? "none"
                      : "1px dashed color-mix(in oklab, var(--accent) 48%, transparent)",
                  }}
                />

                <div className="relative min-w-0 flex-1">
                  <div className="flex h-6 items-stretch">
                    <div
                      data-reveal-bar
                      className="flex items-stretch"
                      style={{ width: pct(r.high ?? r.low) }}
                    >
                      {doubtful ? (
                        /* A rate we could not confirm is hatched end to end —
                           the whole figure is provisional, not just its upper
                           bound. Cheaper than us and still on the chart. */
                        <div
                          className="d1-hatch h-full w-full border border-[var(--caution)]"
                          style={{ ["--hatch" as string]: "var(--caution)" }}
                        />
                      ) : (
                        <>
                          <div
                            className="h-full"
                            style={{
                              width: isRange ? `${(r.low / (r.high as number)) * 100}%` : "100%",
                              background: tone.bar,
                            }}
                          />
                          {isRange && (
                            <div
                              className="d1-hatch h-full"
                              style={{
                                width: `${(((r.high as number) - r.low) / (r.high as number)) * 100}%`,
                                ["--hatch" as string]: tone.bar,
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* rate + verification */}
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span
                    className="d1-figure whitespace-nowrap text-[0.9375rem] leading-none"
                    style={{ color: tone.text }}
                  >
                    {r.display}
                  </span>
                  <span
                    className="d1-label whitespace-nowrap"
                    style={{ color: doubtful ? "var(--caution)" : "var(--ink-3)" }}
                  >
                    {verificationShort(r.sourceId)}
                    {!r.isUs && (
                      <>
                        <span aria-hidden className="mx-1.5 text-[var(--rule-strong)]">
                          ·
                        </span>
                        <span className="d1-figure tracking-normal">
                          {multipleOfOurRate(r.low)}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* per-row note + source, full width beneath */}
              {(r.note || src.url) && (
                <div className="col-span-full border-t border-[var(--rule)] px-4 py-2.5 md:pl-4">
                  <p className="d1-label flex flex-wrap items-baseline gap-x-2 gap-y-1 normal-case tracking-[0.03em] text-[var(--ink-3)]">
                    {r.note && <span className="max-w-[68ch]">{r.note}</span>}
                    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
                      <span aria-hidden className="text-[var(--rule-strong)]">↳</span>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="d1-link"
                        >
                          {src.label}
                        </a>
                      ) : (
                        <span>{src.label}</span>
                      )}
                      <span className="text-[var(--rule-strong)]">·</span>
                      <span className="d1-figure tracking-normal">
                        {formatAsOfShort(src.accessed)}
                      </span>
                    </span>
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* --- legend -------------------------------------------------------- */}
      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--rule-strong)] bg-[var(--surface)] px-4 py-3">
        <span className="d1-label flex items-center gap-2 text-[var(--ink-3)]">
          <span aria-hidden className="h-2.5 w-5" style={{ background: "var(--accent)" }} />
          Our rate
        </span>
        <span className="d1-label flex items-center gap-2 text-[var(--ink-3)]">
          <span
            aria-hidden
            className="d1-hatch h-2.5 w-5 border border-[var(--caution)]"
            style={{ ["--hatch" as string]: "var(--caution)" }}
          />
          Hatched = could not confirm
        </span>
        <span className="d1-label flex items-center gap-2 text-[var(--ink-3)]">
          <span
            aria-hidden
            className="h-2.5 w-5 border-l border-dashed"
            style={{ borderColor: "var(--accent)" }}
          />
          Datum at {RATE.display}
        </span>
        <span className="d1-label ml-auto normal-case tracking-[0.03em] text-[var(--ink-3)]">
          Multiples are arithmetic on the published rates.
        </span>
      </figcaption>
    </figure>
  );
}
