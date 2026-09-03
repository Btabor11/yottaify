import Link from "next/link";
import { SITE } from "@/config/site";
import {
  SECTIONS,
  PRICE_POSITION,
  RATE,
  row,
  CONTRACT,
  formatAsOf,
} from "@/content";
import { Bay } from "./Bay";
import { LoadProfile } from "./LoadProfile";

/**
 * Bay 01 — price. Chart first, then the paragraph that keeps it honest.
 *
 * The unflattering fact (a cheaper published listing exists) is put in the
 * aside of the section header, above the chart, rather than in a footnote
 * under it. A skeptical reader who finds the caveat themselves stops trusting
 * the page; one who is handed it keeps reading.
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
              We are not the cheapest number on the internet. {unverified.display} listings exist.
              The cheapest one we could confirm as in stock was {verified.display}.
            </p>
          </div>
        }
      />

      <div className="d3-bus">
        <div />
        <div>
          <LoadProfile />

          {/* --- the position ------------------------------------------ */}
          <div className="mt-14 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] md:mt-20">
            <h3
              className="d3-display max-w-[20ch] text-[clamp(1.5rem,3.6vw,2.75rem)] text-balance"
              data-load
              data-load-from="78"
            >
              {PRICE_POSITION.heading}
            </h3>
            <div className="space-y-5" data-r-group>
              <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body}
              </p>
              <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body2}
              </p>
            </div>
          </div>

          {/* --- committed + the full table ---------------------------- */}
          <div className="mt-14 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] md:mt-16 lg:grid-cols-2">
            <div className="bg-[var(--surface)] p-6 md:p-8">
              <p className="d3-tag text-[var(--ink-3)]">Committed terms</p>
              <p
                className="d3-display mt-3 text-[clamp(1.25rem,2.4vw,1.875rem)]"
                data-load
                data-load-from="80"
              >
                Below {RATE.display}
              </p>
              <p className="d3-body mt-3 max-w-[46ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
                Market range for {committed.term} commitments is{" "}
                <span className="d3-figure text-[var(--ink)]">{committed.display}</span>.{" "}
                {CONTRACT.body}
              </p>
            </div>

            <div className="bg-[var(--surface)] p-6 md:p-8">
              <p className="d3-tag text-[var(--ink-3)]">The full table</p>
              <p className="d3-body mt-3 max-w-[44ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
                Every rate, its verification status, the source URL, and the date we read it — with
                the methodology written out. Last checked {formatAsOf(SITE.pricingAsOf)}.
              </p>
              <Link href="/d3/pricing" className="d3-btn d3-btn-ghost mt-6">
                Open pricing
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
