import Link from "next/link";
import { SITE } from "@/config/site";
import { SECTIONS, PRICE_POSITION, RATE, row, formatAsOf } from "@/content";
import { SectionHead } from "./SectionHead";
import { RateChart } from "./RateChart";

/**
 * The lead-time contrast sits above the chart on purpose. Availability is the
 * argument; price is the second argument. Putting the price chart first would
 * invert the pitch and invite a comparison we do not win outright.
 */
export function LeadTimeBand() {
  return (
    <section aria-label="Lead time" className="border-y border-[var(--rule-strong)] bg-[var(--surface)]">
      <div className="d1-shell grid gap-0 md:grid-cols-2">
        <div className="border-b border-[var(--rule)] py-10 pr-0 md:border-b-0 md:border-r md:py-14 md:pr-12">
          <p className="d1-label text-[var(--accent)]">Time to capacity — here</p>
          <p
            data-reveal
            className="d1-display mt-4 text-[clamp(3rem,9vw,7rem)]"
            style={{ color: "var(--accent)" }}
          >
            {PRICE_POSITION.leadClaim.ours}
          </p>
          <p className="d1-body mt-4 max-w-[36ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
            Nothing to procure, no regional capacity committee, and no queue ahead of you but the
            other reservations. Target availability {SITE.availability}.
          </p>
        </div>

        <div className="py-10 md:py-14 md:pl-12">
          <p className="d1-label text-[var(--caution)]">Time to capacity — hyperscaler</p>
          <p
            data-reveal
            className="d1-display mt-4 text-[clamp(3rem,9vw,7rem)]"
            style={{ color: "var(--ink-3)" }}
          >
            4–10 wk
          </p>
          <p className="d1-body mt-4 max-w-[36ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
            {PRICE_POSITION.leadClaim.theirsQualifier} That gap is the whole reason this fleet has a
            reason to exist.
          </p>
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const committed = row("committed");
  const unverified = row("neocloud-low");
  const verified = row("verified-low");

  return (
    <section id="pricing" className="d1-shell scroll-mt-16 py-20 md:py-28">
      <SectionHead
        index={SECTIONS.pricing.index}
        eyebrow={SECTIONS.pricing.eyebrow}
        heading={SECTIONS.pricing.heading}
        standfirst={SECTIONS.pricing.standfirst}
        id="pricing-heading"
        aside={
          <div data-reveal className="border-l-2 border-[var(--caution)] pl-4">
            <p className="d1-label text-[var(--caution)]">{PRICE_POSITION.eyebrow}</p>
            <p className="d1-body mt-2 max-w-[42ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
              We are not the cheapest number on the internet. {unverified.display} listings exist.
              The cheapest one we could confirm as in stock was {verified.display}.
            </p>
          </div>
        }
      />

      <RateChart />

      {/* --- the honest version ------------------------------------------- */}
      <div className="mt-6 grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div data-reveal className="d1-ticked border border-[var(--rule-strong)] p-6 md:p-8">
          <h3 className="d1-display-loose max-w-[26ch] text-[clamp(1.25rem,2.4vw,1.75rem)] text-balance">
            {PRICE_POSITION.heading}
          </h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2 md:gap-8">
            <p className="d1-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
              {PRICE_POSITION.body}
            </p>
            <p className="d1-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
              {PRICE_POSITION.body2}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Committed pricing: stated as lower, without publishing a card. */}
          <div data-reveal className="border-t border-[var(--rule-strong)] pt-5">
            <p className="d1-label text-[var(--ink-3)]">Committed terms</p>
            <p className="d1-figure mt-3 text-[1.75rem] leading-none">
              Lower than {RATE.display}
            </p>
            <p className="d1-body mt-3 text-[0.875rem] text-[var(--ink-2)] text-pretty">
              {committed.note} The market range for {committed.term} commitments is{" "}
              <span className="d1-figure text-[var(--ink)]">{committed.display}</span>. Ours is set
              on the call, because it depends on term and volume — publishing a single number would
              be a fiction.
            </p>
          </div>

          <div data-reveal className="border-t border-[var(--rule-strong)] pt-5">
            <p className="d1-label text-[var(--ink-3)]">Full sourced table</p>
            <p className="d1-body mt-3 text-[0.875rem] text-[var(--ink-2)] text-pretty">
              Every rate, its source, its verification status, and the date we read it. Last checked{" "}
              {formatAsOf(SITE.pricingAsOf)}.
            </p>
            <Link
              href="/d1/pricing"
              className="d1-btn d1-btn-ghost mt-5 w-full"
            >
              Open the pricing page
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
