import Link from "next/link";
import { SITE } from "@/config/site";
import {
  SECTIONS,
  PRICE_ROWS,
  PRICE_POSITION,
  RATE,
  row,
  multipleOfOurRate,
  verificationShort,
  verificationKind,
  source,
  formatAsOf,
  formatAsOfShort,
  CONTRACT,
} from "@/content";
import { Chapter } from "./Chapter";
import { Cite } from "./Cite";
import { RateScale } from "./RateScale";
import { Footnotes } from "./Footnotes";
import { Set, Ink, Rule, stagger } from "./Reveal";

/**
 * Chapter 01 — the statement of published rates.
 *
 * Set as a financial statement: ruled columns, figures right-aligned in the
 * mono, a rubber-stamped verification column, and a numbered apparatus at the
 * foot. The unflattering row — a published price below ours — is in the table
 * at full weight, because a statement that omits an unfavourable line is not a
 * statement.
 */

const STAMP_TONE: Record<string, string> = {
  "first-party": "var(--accent)",
  "rate-card": "var(--ink-2)",
  "verified-in-stock": "var(--accent-2)",
  "unverified-listing": "var(--caution)",
  aggregate: "var(--ink-3)",
  "vendor-spec": "var(--ink-3)",
};

export function LedgerTable({ compact = false }: { compact?: boolean }) {
  return (
    <table className="d2-table">
      <caption className="sr-only">
        Published NVIDIA B300 rates per GPU-hour with term, verification status, source footnote,
        and the date each figure was read. Last checked {formatAsOf(SITE.pricingAsOf)}.
      </caption>
      <thead>
        <tr>
          <th scope="col" className="d2-caps text-[var(--ink-3)]">
            Provider
          </th>
          <th scope="col" className="d2-caps d2-num text-[var(--ink-3)]">
            USD / GPU-hr
          </th>
          <th scope="col" className="d2-caps d2-num text-[var(--ink-3)]">
            vs. ours
          </th>
          <th scope="col" className="d2-caps hidden text-[var(--ink-3)] sm:table-cell">
            Term
          </th>
          <th scope="col" className="d2-caps text-[var(--ink-3)]">
            Status
          </th>
          <th scope="col" className="d2-caps hidden text-right text-[var(--ink-3)] md:table-cell">
            Read
          </th>
        </tr>
      </thead>
      <tbody>
        {PRICE_ROWS.map((r) => {
          const kind = verificationKind(r.sourceId);
          const src = source(r.sourceId);
          return (
            <tr key={r.id} className={r.isUs ? "d2-row-ours" : undefined}>
              <th scope="row" className="font-normal">
                <span
                  className="d2-prose block text-[1rem] leading-snug"
                  style={{ color: r.isUs ? "var(--accent)" : "var(--ink)" }}
                >
                  {r.provider}
                  <Cite sourceId={r.sourceId} />
                </span>
                {r.qualifier && (
                  <span className="d2-caps mt-1 block text-[0.5rem] text-[var(--ink-3)]">
                    {r.qualifier}
                  </span>
                )}
                {r.note && !compact && (
                  <span className="d2-prose mt-1.5 block max-w-[62ch] text-[0.8125rem] leading-[1.5] text-[var(--ink-3)] text-pretty">
                    {r.note}
                  </span>
                )}
              </th>
              <td
                data-label="Rate"
                className="d2-num text-[1.0625rem]"
                style={{ color: r.isUs ? "var(--accent)" : "var(--ink)" }}
              >
                {r.display}
              </td>
              <td data-label="vs. ours" className="d2-num text-[0.875rem] text-[var(--ink-2)]">
                {r.isUs ? "—" : multipleOfOurRate(r.low)}
              </td>
              <td
                data-label="Term"
                className="d2-caps d2-col-wide hidden text-[0.5625rem] text-[var(--ink-2)] sm:table-cell"
              >
                {r.term}
              </td>
              <td data-label="Status">
                <span className="d2-stamp" style={{ color: STAMP_TONE[kind] }}>
                  {verificationShort(r.sourceId)}
                </span>
              </td>
              <td
                data-label="Read"
                className="d2-num d2-col-wide hidden whitespace-nowrap text-[0.75rem] text-[var(--ink-3)] md:table-cell"
              >
                {formatAsOfShort(src.accessed)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function Ledger() {
  const unverified = row("neocloud-low");
  const verified = row("verified-low");
  const committed = row("committed");

  return (
    <section id="pricing" className="d2-shell scroll-mt-28 py-16 md:py-24">
      <Chapter
        index={SECTIONS.pricing.index}
        eyebrow={SECTIONS.pricing.eyebrow}
        heading={
          <>
            What the market <em>actually</em> charges
          </>
        }
        standfirst={
          <>
            {SECTIONS.pricing.standfirst}
            <Cite sourceId="surveyMedian" />
          </>
        }
        headingId="pricing-heading"
        aside={
          <Set className="border-t border-[var(--accent)] pt-3">
            <p className="d2-caps text-[var(--accent)]">{PRICE_POSITION.eyebrow}</p>
            <p className="d2-prose mt-2 max-w-[44ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
              We are not the cheapest number on the internet. {unverified.display} listings exist.
              The cheapest one we could confirm as in stock was {verified.display}.
            </p>
          </Set>
        }
      />

      <div className="d2-page">
        <div />
        <div>
          <Set>
            <RateScale />
          </Set>

          <div className="mt-12 md:mt-16">
            <Set>
              <LedgerTable />
            </Set>
          </div>

          {/* --- the position, as a pull-quote ------------------------- */}
          <div className="mt-16 md:mt-20">
            <Rule className="d2-rule-heavy" />
            <Set className="mt-8">
              <p className="d2-display max-w-[26ch] text-[clamp(1.5rem,4vw,3rem)] text-balance">
                {PRICE_POSITION.heading}
              </p>
            </Set>
            <div className="d2-columns mt-8">
              <p className="d2-prose text-[1rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body}
                <Cite sourceId="surveyVerified" />
              </p>
              <p className="d2-prose text-[1rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body2}
              </p>
            </div>
          </div>

          {/* --- committed + link ------------------------------------- */}
          <div className="mt-14 grid gap-x-12 gap-y-8 border-t border-[var(--ink)] pt-8 md:mt-16 lg:grid-cols-2">
            <Set>
              <p className="d2-caps text-[var(--ink-3)]">Committed terms</p>
              <p className="d2-display mt-3 text-[clamp(1.375rem,2.6vw,2rem)]">
                <Ink>Lower than {RATE.display}</Ink>
              </p>
              <p className="d2-prose mt-3 max-w-[46ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                Market range for {committed.term} commitments is{" "}
                <span className="d2-figure">{committed.display}</span>
                <Cite sourceId={committed.sourceId} />. {CONTRACT.body}
              </p>
            </Set>

            <Set delay={0.08}>
              <p className="d2-caps text-[var(--ink-3)]">The full table</p>
              <p className="d2-prose mt-3 max-w-[44ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                Every rate, its verification status, the source, and the date we read it — with the
                methodology written out. Last checked {formatAsOf(SITE.pricingAsOf)}.
              </p>
              <Link href="/d2/pricing" className="d2-btn d2-btn-outline mt-5">
                Open the pricing page
                <span aria-hidden>→</span>
              </Link>
            </Set>
          </div>
        </div>
      </div>

      {/* --- apparatus ---------------------------------------------------- */}
      <div className="mt-16 md:mt-20">
        <Footnotes />
      </div>
    </section>
  );
}

export { stagger };
