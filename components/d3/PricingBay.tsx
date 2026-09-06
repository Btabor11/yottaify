import Link from "next/link";
import { SITE } from "@/config/site";
import { SECTIONS, PRICE_POSITION, QUOTE, row, CONTRACT, formatAsOf } from "@/content";
import { Bay } from "./Bay";
import { LoadProfile } from "./LoadProfile";

/**
 * Sheet 01 — price. Chart first, then the paragraph that keeps it honest.
 *
 * The unflattering fact (a cheaper published listing exists) is put in the
 * aside of the sheet header, above the chart, rather than in a footnote under
 * it. A skeptical reader who finds the caveat themselves stops trusting the
 * page; one who is handed it keeps reading.
 */
export function PricingBay() {
  const unverified = row("neocloud-low");
  const verified = row("verified-low");
  const committed = row("committed");

  return (
    <section id="pricing" className="d3-shell scroll-mt-24 py-16 md:py-24">
      <Bay
        index={SECTIONS.pricing.index}
        eyebrow={SECTIONS.pricing.eyebrow}
        heading={SECTIONS.pricing.heading}
        standfirst={SECTIONS.pricing.standfirst}
        headingId="pricing-heading"
        aside={
          <div className="border-l-2 border-[var(--caution)] pl-4" data-r>
            <p className="d3-tag text-[var(--caution)]">{PRICE_POSITION.eyebrow}</p>
            <p className="d3-body mt-2 max-w-[44ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
              We are not the smallest number on the internet. {unverified.display} listings exist.
              The cheapest one we could confirm as in stock was {verified.display}, and that is the
              line we quote under.
            </p>
          </div>
        }
      />

      <LoadProfile />

      {/* --- the position -------------------------------------------------- */}
      <div className="mt-16 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] md:mt-24">
        <h3
          className="d3-display max-w-[7.7em] text-[clamp(2rem,5vw,4rem)] text-balance"
          data-load
          data-load-from="300"
        >
          {PRICE_POSITION.heading}
        </h3>
        <div className="space-y-6 md:space-y-5" data-r-group>
          <p className="d3-voice text-[1.375rem] leading-[1.15] text-[var(--ink)] text-pretty md:text-[1.75rem]">
            {PRICE_POSITION.body}
          </p>
          <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">{PRICE_POSITION.body2}</p>
        </div>
      </div>

      {/* --- our position + committed + the full table --------------------- */}
      <div className="mt-14 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] md:mt-20 lg:grid-cols-3">
        <div className="bg-[var(--surface)] p-6 md:p-8">
          <p className="d3-tag text-[var(--accent)]">Our on-demand quote</p>
          <p
            className="d3-display mt-3 max-w-[8em] text-[clamp(1.75rem,3.4vw,2.75rem)] text-balance"
            data-load
            data-load-from="300"
          >
            {QUOTE.positionShort}
          </p>
          <p className="d3-body mt-3 max-w-[46ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
            {QUOTE.why}
          </p>
        </div>

        <div className="bg-[var(--surface)] p-6 md:p-8">
          <p className="d3-tag text-[var(--ink-3)]">{CONTRACT.inquiry.cardEyebrow}</p>
          <p className="d3-display mt-3 text-[clamp(1.75rem,3.4vw,2.75rem)]" data-load data-load-from="300">
            {CONTRACT.inquiry.cardHeadline}
          </p>
          <p className="d3-body mt-3 max-w-[46ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
            Market range for {committed.term} commitments is{" "}
            <span className="d3-figure text-[var(--ink)]">{committed.display}</span>. {CONTRACT.inquiry.cardBody}
          </p>
          <a href="#leases" className="d3-link d3-tag mt-5 inline-block text-[0.5rem]">
            {CONTRACT.inquiry.eyebrow} — {CONTRACT.termYears}
            <span aria-hidden> →</span>
          </a>
        </div>

        <div className="bg-[var(--surface)] p-6 md:p-8">
          <p className="d3-tag text-[var(--ink-3)]">The full table</p>
          <p className="d3-body mt-3 max-w-[44ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
            Every rate, its verification status, the source URL, and the date we read it — with the
            methodology written out. Last checked {formatAsOf(SITE.pricingAsOf)}.
          </p>
          <Link href="/pricing" className="d3-btn d3-btn-ghost mt-6">
            Open pricing
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

        {/* --- leases ------------------------------------------------------- */}
        <div id="leases" className="mt-16 scroll-mt-24 md:mt-24">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
            {SECTIONS.pricing.index}.2 — {CONTRACT.inquiry.eyebrow}
          </p>
          <div className="mt-6 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h3
                className="d3-display max-w-[9em] text-[clamp(1.75rem,4.2vw,3.25rem)] text-balance"
                data-load
                data-load-from="300"
              >
                {CONTRACT.inquiry.heading}
              </h3>
              <p className="d3-body mt-4 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                {CONTRACT.inquiry.body}
              </p>
              <p className="d3-body mt-4 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                {CONTRACT.inquiry.open}
              </p>
              <p
                className="d3-body mt-5 max-w-[54ch] border-l-2 border-[var(--caution)] pl-4 text-[0.8125rem] text-[var(--ink-3)] text-pretty"
                data-r
              >
                {CONTRACT.inquiry.caveat}
              </p>
              <a href="#reserve" className="d3-btn d3-btn-ghost mt-7">
                {CONTRACT.inquiry.cta}
                <span aria-hidden>→</span>
              </a>
            </div>

            <ul className="grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-1" data-r-group>
              {CONTRACT.inquiry.bands.map((b, i) => (
                <li key={b.label} className="bg-[var(--surface)] p-5 md:p-6">
                  <p className="d3-figure text-[0.625rem] text-[var(--accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="d3-display mt-2 text-[1.5rem]" style={{ ["--wght" as string]: 720 }}>
                    {b.label}
                  </p>
                  <p className="d3-body mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">{b.detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
    </section>
  );
}
