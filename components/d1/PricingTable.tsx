import {
  PRICE_ROWS,
  verificationLabel,
  verificationKind,
  multipleOfOurRate,
  source,
  formatAsOfShort,
  METHODOLOGY,
  RATE,
} from "@/content";
import { SITE } from "@/config/site";
import { formatAsOf } from "@/content";

/**
 * The full sourced table. This is the highest-leverage content on the site: it
 * ranks for what our buyers search, it earns links, and the verification
 * column is the transparency position made operational rather than claimed.
 *
 * Every row carries a source and a date. A row we cannot source does not exist.
 */

const STATUS_TONE: Record<string, string> = {
  "first-party": "var(--accent)",
  "rate-card": "var(--ink-2)",
  "verified-in-stock": "var(--accent-2)",
  "unverified-listing": "var(--caution)",
  aggregate: "var(--ink-3)",
  "vendor-spec": "var(--ink-3)",
};

export function PricingTable() {
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
              ["Provider", "w-[24%]"],
              ["USD / GPU-hour", "w-[13%]"],
              ["vs. ours", "w-[8%]"],
              ["Term", "w-[12%]"],
              ["Status", "w-[17%]"],
              ["Source", "w-[16%]"],
              ["Checked", "w-[10%]"],
            ].map(([label, w]) => (
              <th
                key={label}
                scope="col"
                className={`d1-label border-y border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-3 text-[var(--ink-3)] ${w}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody data-reveal-group data-reveal-y="12">
          {PRICE_ROWS.map((r) => {
            const src = source(r.sourceId);
            const kind = verificationKind(r.sourceId);
            const tone = STATUS_TONE[kind] ?? "var(--ink-2)";

            return (
              <tr
                key={r.id}
                className="block border-b border-[var(--rule)] py-4 lg:table-row lg:py-0"
                style={
                  r.isUs
                    ? { background: "color-mix(in oklab, var(--accent) 5%, transparent)" }
                    : undefined
                }
              >
                <th
                  scope="row"
                  className="block px-0 text-left align-top lg:table-cell lg:px-3 lg:py-4"
                >
                  <span
                    className="block text-[0.9375rem] font-medium leading-tight"
                    style={{ color: r.isUs ? "var(--accent)" : "var(--ink)" }}
                  >
                    {r.provider}
                  </span>
                  {r.qualifier && (
                    <span className="d1-label mt-1 block normal-case tracking-[0.03em] text-[var(--ink-3)]">
                      {r.qualifier}
                    </span>
                  )}
                  {r.note && (
                    <span className="d1-body mt-2 block max-w-[64ch] text-[0.75rem] leading-[1.6] text-[var(--ink-3)] lg:hidden">
                      {r.note}
                    </span>
                  )}
                </th>

                <td className="mt-3 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d1-label mr-2 text-[var(--ink-3)] lg:hidden">Rate</span>
                  <span
                    className="d1-figure text-[1.0625rem] leading-none"
                    style={{ color: r.isUs ? "var(--accent)" : "var(--ink)" }}
                  >
                    {r.display}
                  </span>
                </td>

                <td className="mt-1.5 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d1-label mr-2 text-[var(--ink-3)] lg:hidden">vs. ours</span>
                  <span className="d1-figure text-[0.8125rem] text-[var(--ink-2)]">
                    {r.isUs ? "—" : multipleOfOurRate(r.low)}
                  </span>
                </td>

                <td className="mt-1.5 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d1-label mr-2 text-[var(--ink-3)] lg:hidden">Term</span>
                  <span className="d1-label normal-case tracking-[0.03em] text-[var(--ink-2)]">
                    {r.term}
                  </span>
                </td>

                <td className="mt-3 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span
                    className="d1-label inline-block border px-1.5 py-1"
                    style={{ color: tone, borderColor: tone }}
                  >
                    {verificationLabel(r.sourceId)}
                  </span>
                </td>

                <td className="mt-2 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d1-label mr-2 text-[var(--ink-3)] lg:hidden">Source</span>
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="d1-link d1-label normal-case tracking-[0.03em]"
                    >
                      {src.label} ↗
                    </a>
                  ) : (
                    <span className="d1-label normal-case tracking-[0.03em] text-[var(--ink-3)]">
                      {src.label}
                    </span>
                  )}
                </td>

                <td className="mt-1.5 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                  <span className="d1-label mr-2 text-[var(--ink-3)] lg:hidden">Checked</span>
                  <span className="d1-figure whitespace-nowrap text-[0.75rem] text-[var(--ink-2)]">
                    {formatAsOfShort(src.accessed)}
                  </span>
                </td>

                {/* Desktop-only note row: the caveat belongs directly under the
                    number it qualifies, not in a footnote block. */}
                {r.note && (
                  <td colSpan={7} className="hidden lg:table-cell lg:px-3 lg:pb-4">
                    <span className="d1-body block max-w-[92ch] text-[0.75rem] leading-[1.6] text-[var(--ink-3)]">
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

      <p className="d1-label mt-5 max-w-[92ch] normal-case tracking-[0.03em] text-[var(--ink-3)]">
        Multiples in the &ldquo;vs. ours&rdquo; column are the published rate divided by{" "}
        {RATE.display}, computed at render. Where a row is a range, the multiple uses the low end,
        which is the comparison least favourable to us.
      </p>
    </div>
  );
}

export function Methodology() {
  return (
    <div>
      <div className="d1-sechead">
        <span className="d1-figure text-[0.625rem] text-[var(--accent)]">M</span>
        <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
        <span className="d1-label text-[var(--ink-3)]">Methodology</span>
      </div>

      <h2 data-reveal className="d1-display-loose mt-8 text-[clamp(1.5rem,3.4vw,2.5rem)]">
        {METHODOLOGY.heading}
      </h2>

      <dl data-reveal-group className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-3">
        {METHODOLOGY.points.map((p, i) => (
          <div key={p.label} className="bg-[var(--bg)] p-5 md:p-6">
            <dt className="d1-label flex items-baseline gap-2 text-[var(--ink)]">
              <span className="d1-figure text-[0.5625rem] text-[var(--accent)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {p.label}
            </dt>
            <dd className="d1-body mt-3 text-[0.8125rem] text-[var(--ink-2)] text-pretty">
              {p.body}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
