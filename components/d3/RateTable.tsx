import {
  PRICE_ROWS,
  verificationLabel,
  verificationKind,
  multipleOfBenchmark,
  source,
  formatAsOf,
  formatAsOfShort,
  METHODOLOGY,
  BENCHMARK,
  QUOTE,
} from "@/content";
import { SITE } from "@/config/site";
import { SourceLink } from "@/components/shared/SourceLink";

/**
 * The full sourced table, D3's version.
 *
 * Read as a switchgear schedule: status as a lit pip, the rate as the widest
 * thing in the row, and the benchmark row — the lowest rate anyone could
 * confirm as in stock — tinted with the live accent.
 *
 * There is no row for us. We do not publish a rate, so a row with a number in
 * it would be a lie and a row with a dash in it would be furniture. Where we
 * sit is stated once, under the table, against the benchmark that is in it.
 *
 * Below `lg` the table reflows to stacked records. A seven-column table on a
 * 375px screen is not a table, it is a horizontal scroll nobody performs.
 */

const TONE: Record<string, string> = {
  "first-party": "var(--accent)",
  "rate-card": "var(--ink-2)",
  "verified-in-stock": "var(--ink)",
  "unverified-listing": "var(--caution)",
  aggregate: "var(--ink-3)",
  "vendor-spec": "var(--ink-3)",
};

export function RateTable() {
  return (
    <div>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Published NVIDIA B300 rental rates per GPU-hour, with the term, verification status,
          source, and the date each figure was read. Last checked {formatAsOf(SITE.pricingAsOf)}.
        </caption>

        <thead>
          <tr className="hidden lg:table-row">
            {[
              ["Provider", "w-[25%]"],
              ["USD / GPU-hour", "w-[13%]"],
              ["vs. datum", "w-[9%]"],
              ["Term", "w-[12%]"],
              ["Status", "w-[16%]"],
              ["Source", "w-[16%]"],
              ["Checked", "w-[10%]"],
            ].map(([label, w]) => (
              <th
                key={label}
                scope="col"
                className={`d3-tag border-y border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-3 text-[0.5rem] text-[var(--ink-3)] ${w}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody data-r-group>
          {PRICE_ROWS.map((r) => {
            const src = source(r.sourceId);
            const tone = TONE[verificationKind(r.sourceId)] ?? "var(--ink-2)";

            return (
              <tr
                key={r.id}
                className="block border-b border-[var(--rule)] py-4 lg:table-row lg:py-0"
                style={
                  r.isBenchmark
                    ? { background: "color-mix(in oklab, var(--accent) 7%, transparent)" }
                    : undefined
                }
              >
                <th scope="row" className="block px-0 text-left align-top lg:table-cell lg:px-3 lg:py-4">
                  <span
                    className="d3-body block text-[0.9375rem] font-medium leading-tight"
                    style={{ color: r.isBenchmark ? "var(--accent)" : "var(--ink)" }}
                  >
                    {r.provider}
                  </span>
                  {r.qualifier && (
                    <span className="d3-tag mt-1.5 block text-[0.4375rem] text-[var(--ink-3)]">
                      {r.qualifier}
                    </span>
                  )}
                  {r.note && (
                    <span className="d3-body mt-2 block max-w-[64ch] text-[0.75rem] leading-relaxed text-[var(--ink-3)] lg:hidden">
                      {r.note}
                    </span>
                  )}
                </th>

                <td className="mt-3 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d3-tag mr-2 text-[0.4375rem] text-[var(--ink-3)] lg:hidden">
                    Rate
                  </span>
                  <span
                    className="d3-figure text-[1.0625rem] leading-none"
                    style={{ color: r.isBenchmark ? "var(--accent)" : "var(--ink)" }}
                  >
                    {r.display}
                  </span>
                </td>

                <td className="mt-1.5 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d3-tag mr-2 text-[0.4375rem] text-[var(--ink-3)] lg:hidden">
                    vs. datum
                  </span>
                  <span className="d3-figure text-[0.8125rem] text-[var(--ink-2)]">
                    {r.isBenchmark ? "—" : multipleOfBenchmark(r.low)}
                  </span>
                </td>

                <td className="mt-1.5 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d3-tag mr-2 text-[0.4375rem] text-[var(--ink-3)] lg:hidden">
                    Term
                  </span>
                  <span className="d3-tag text-[0.5rem] text-[var(--ink-2)]">{r.term}</span>
                </td>

                <td className="mt-3 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d3-pip text-[0.4375rem]" style={{ color: tone }}>
                    {verificationLabel(r.sourceId)}
                  </span>
                </td>

                <td className="mt-2 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d3-tag mr-2 text-[0.4375rem] text-[var(--ink-3)] lg:hidden">
                    Source
                  </span>
                  {src.url ? (
                    <SourceLink href={src.url} sourceId={src.id} className="d3-link d3-tag text-[0.5rem]">
                      {src.label} ↗
                    </SourceLink>
                  ) : (
                    <span className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{src.label}</span>
                  )}
                </td>

                <td className="mt-1.5 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d3-tag mr-2 text-[0.4375rem] text-[var(--ink-3)] lg:hidden">
                    Checked
                  </span>
                  <span className="d3-figure whitespace-nowrap text-[0.75rem] text-[var(--ink-2)]">
                    {formatAsOfShort(src.accessed)}
                  </span>
                </td>

                {/* The caveat belongs directly under the number it qualifies. */}
                {r.note && (
                  <td colSpan={7} className="hidden lg:table-cell lg:px-3 lg:pb-4">
                    <span className="d3-body block max-w-[92ch] text-[0.75rem] leading-relaxed text-[var(--ink-3)]">
                      <span aria-hidden className="mr-1.5 text-[var(--rule-strong)]">
                        ↳
                      </span>
                      {r.note}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-6 border-l-2 border-[var(--accent)] pl-4">
        <p className="d3-tag text-[var(--accent)]">Where we sit</p>
        <p className="d3-body mt-2 max-w-[80ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
          {QUOTE.why}
        </p>
      </div>

      <p className="d3-body mt-5 max-w-[92ch] text-[0.75rem] text-[var(--ink-3)] text-pretty">
        Multiples in the &ldquo;vs. datum&rdquo; column are the published rate divided by{" "}
        {BENCHMARK.display} — the lowest rate in this table we could confirm as in stock — computed
        at render. Where a row is a range, the multiple uses the low end, which is the comparison
        least favourable to the datum.
      </p>
    </div>
  );
}

export function Methodology() {
  return (
    <div>
      <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
        Methodology
      </p>
      <h2
        className="d3-display mt-6 text-[clamp(1.5rem,3.4vw,2.5rem)]"
        data-load
        data-load-from="300"
      >
        {METHODOLOGY.heading}
      </h2>

      <dl className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3" data-r-group>
        {METHODOLOGY.points.map((p, i) => (
          <div key={p.label} className="bg-[var(--surface)] p-5 md:p-6">
            <dt className="d3-tag flex items-baseline gap-2 text-[0.5rem] text-[var(--ink)]">
              <span className="d3-figure text-[0.5625rem] text-[var(--accent)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.label}
            </dt>
            <dd className="d3-body mt-3 text-[0.8125rem] text-[var(--ink-2)] text-pretty">
              {p.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
