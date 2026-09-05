import {
  CHART_ROWS,
  CHART_MAX,
  RATE,
  multipleOfOurRate,
  verificationShort,
  verificationKind,
  source,
  formatAsOfShort,
} from "@/content";

/**
 * The rate comparison, drawn as vertical columns rather than the horizontal
 * bars D1 uses. Two reasons, both about this direction's argument:
 *
 *  · Height is the register D3 works in. A hyperscaler column that towers
 *    four screens' worth over ours makes the point before any label is read.
 *  · Our own rate becomes a datum line drawn across every column, so "how far
 *    above us is this" is a distance you can see rather than a number you
 *    have to compute.
 *
 * The one column cheaper than ours sits BELOW the datum and is drawn hollow
 * with a dashed cap, because it is a published price with no confirmed stock
 * behind it. The chart is not allowed to hide it and it is not allowed to
 * pretend it is equivalent either.
 */

const CAP_COLOR: Record<string, string> = {
  "first-party": "var(--accent)",
  "unverified-listing": "var(--caution)",
  "verified-in-stock": "var(--ink)",
  aggregate: "var(--ink-2)",
  "rate-card": "var(--ink-2)",
  "vendor-spec": "var(--ink-2)",
};

/** Round the axis up to a whole dollar so the gridlines are readable. */
const AXIS_MAX = Math.ceil(CHART_MAX / 3) * 3;
const TICKS = Array.from({ length: AXIS_MAX / 3 + 1 }, (_, i) => i * 3);

export function LoadProfile() {
  return (
    <figure className="d3-panel d3-ticks px-4 pb-4 pt-5 md:px-7 md:pb-6 md:pt-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <figcaption className="d3-tag text-[var(--ink-2)]">
          Published rates · USD per GPU-hour
        </figcaption>
        <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">
          Datum = our rate {RATE.display}
        </p>
      </div>

      <div className="mt-7 flex gap-3 md:gap-5">
        {/* --- axis --------------------------------------------------- */}
        <div
          aria-hidden
          className="relative h-[clamp(13rem,26vw,19rem)] w-8 shrink-0 md:w-10"
        >
          {TICKS.map((t) => (
            <span
              key={t}
              className="d3-figure absolute right-0 -translate-y-1/2 text-[0.5625rem] text-[var(--ink-3)]"
              style={{ bottom: `${(t / AXIS_MAX) * 100}%` }}
            >
              ${t}
            </span>
          ))}
        </div>

        {/* --- plot --------------------------------------------------- */}
        <div className="min-w-0 flex-1">
          <div className="relative h-[clamp(13rem,26vw,19rem)]" data-r-cols>
            {/* gridlines */}
            {TICKS.map((t) => (
              <span
                key={t}
                aria-hidden
                className="absolute inset-x-0 h-px bg-[var(--rule)]"
                style={{ bottom: `${(t / AXIS_MAX) * 100}%` }}
              />
            ))}

            {/* datum: our rate, across the whole plot */}
            <span
              aria-hidden
              className="absolute inset-x-0 h-px"
              style={{
                bottom: `${(RATE.value / AXIS_MAX) * 100}%`,
                background: "var(--accent)",
                boxShadow: "0 0 12px -1px var(--accent)",
              }}
            />

            <div className="absolute inset-0 flex items-end gap-2 md:gap-4">
              {CHART_ROWS.map((r) => {
                const kind = verificationKind(r.sourceId);
                const cap = CAP_COLOR[kind] ?? "var(--ink-2)";
                const top = r.high ?? r.low;
                const heightPct = (top / AXIS_MAX) * 100;
                const rangePct = r.high ? ((r.high - r.low) / AXIS_MAX) * 100 : 0;
                const hollow = kind === "unverified-listing";

                return (
                  <div key={r.id} className="relative flex h-full min-w-0 flex-1 items-end">
                    <div
                      data-r-col
                      className="relative w-full"
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* body */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: r.isUs
                            ? "linear-gradient(to top, color-mix(in oklab, var(--accent) 30%, transparent), color-mix(in oklab, var(--accent) 6%, transparent))"
                            : hollow
                              ? "repeating-linear-gradient(135deg, color-mix(in oklab, var(--caution) 22%, transparent) 0 2px, transparent 2px 6px)"
                              : "linear-gradient(to top, color-mix(in oklab, var(--ink) 13%, transparent), color-mix(in oklab, var(--ink) 3%, transparent))",
                          borderLeft: `1px solid ${hollow ? "color-mix(in oklab, var(--caution) 45%, transparent)" : "var(--rule-strong)"}`,
                          borderRight: `1px solid ${hollow ? "color-mix(in oklab, var(--caution) 45%, transparent)" : "var(--rule-strong)"}`,
                        }}
                      />
                      {/* range band, where the row is a range not a point */}
                      {rangePct > 0 && (
                        <div
                          className="absolute inset-x-0"
                          style={{
                            bottom: 0,
                            height: `${(rangePct / heightPct) * 100}%`,
                            top: 0,
                            background: `repeating-linear-gradient(to bottom, color-mix(in oklab, ${cap} 22%, transparent) 0 1px, transparent 1px 4px)`,
                          }}
                        />
                      )}
                      {/* cap */}
                      <div
                        className="absolute inset-x-0 top-0"
                        style={{
                          height: r.isUs ? 3 : 2,
                          background: cap,
                          boxShadow: r.isUs ? "0 0 16px -1px var(--accent)" : `0 0 10px -3px ${cap}`,
                          borderTop: hollow ? `1px dashed ${cap}` : undefined,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- labels under the plot ------------------------------- */}
          {/* Wide: one label stack under each column. */}
          <ul className="mt-3 hidden gap-2 border-t border-[var(--rule-strong)] pt-3 md:flex md:gap-4">
            {CHART_ROWS.map((r) => {
              const kind = verificationKind(r.sourceId);
              const cap = CAP_COLOR[kind] ?? "var(--ink-2)";
              return (
                <li key={r.id} className="min-w-0 flex-1">
                  <p
                    className="d3-figure text-[clamp(0.6875rem,1.4vw,0.9375rem)] leading-none"
                    style={{ color: r.isUs ? "var(--accent)" : "var(--ink)" }}
                  >
                    {r.display}
                  </p>
                  <p className="d3-tag mt-1.5 text-[0.4375rem] leading-tight text-[var(--ink-3)]">
                    {r.provider}
                  </p>
                  <p className="d3-pip mt-1.5 text-[0.4375rem]" style={{ color: cap }}>
                    {verificationShort(r.sourceId)}
                  </p>
                  <p className="d3-figure mt-1 text-[0.5625rem] text-[var(--ink-3)]">
                    {r.isUs ? "datum" : multipleOfOurRate(r.low)}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* Narrow: columns are too thin to carry words, so each one takes an
              index and the words move into a ledger keyed by the same index. */}
          <div aria-hidden className="mt-2 flex gap-2 border-t border-[var(--rule-strong)] pt-2 md:hidden">
            {CHART_ROWS.map((r, i) => {
              const kind = verificationKind(r.sourceId);
              const cap = CAP_COLOR[kind] ?? "var(--ink-2)";
              return (
                <span
                  key={r.id}
                  className="d3-figure min-w-0 flex-1 text-center text-[0.5625rem] leading-none"
                  style={{ color: r.isUs ? "var(--accent)" : cap }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <ol className="mt-5 border-t border-[var(--rule-strong)] md:hidden">
        {CHART_ROWS.map((r, i) => {
          const kind = verificationKind(r.sourceId);
          const cap = CAP_COLOR[kind] ?? "var(--ink-2)";
          return (
            <li
              key={r.id}
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-[var(--rule)] py-3 last:border-0"
            >
              <span
                className="d3-figure text-[0.625rem] leading-none"
                style={{ color: r.isUs ? "var(--accent)" : cap }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="d3-tag text-[0.5rem] leading-snug text-[var(--ink-2)]">{r.provider}</p>
                <p className="d3-pip mt-1.5 text-[0.4375rem]" style={{ color: cap }}>
                  {verificationShort(r.sourceId)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="d3-figure text-[0.875rem] leading-none"
                  style={{ color: r.isUs ? "var(--accent)" : "var(--ink)" }}
                >
                  {r.display}
                </p>
                <p className="d3-figure mt-1.5 text-[0.5625rem] text-[var(--ink-3)]">
                  {r.isUs ? "datum" : multipleOfOurRate(r.low)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="d3-body mt-5 max-w-[74ch] text-[0.75rem] leading-relaxed text-[var(--ink-3)] text-pretty">
        Hatched columns are published prices we could not confirm as in stock — including the one
        below our datum, which is cheaper than we are. Ranges are shown at their top value with the
        range hatched beneath. All rates read {formatAsOfShort(source("ours").accessed)}.
      </p>
    </figure>
  );
}
