import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import {
  META,
  PRICE_POSITION,
  RATE,
  row,
  formatAsOf,
  FLEET,
  CONTRACT,
  FORM_COPY,
} from "@/content";
import { D1Nav } from "@/components/d1/Chrome";
import { D1Footer } from "@/components/d1/Footer";
import { PricingTable, Methodology } from "@/components/d1/PricingTable";
import { CostEstimator } from "@/components/d1/CostEstimator";
import { pricingJsonLd } from "@/components/shared/pricingSchema";

export const metadata: Metadata = {
  title: META.pricing.title,
  description: META.pricing.description,
  alternates: { canonical: "/d1/pricing" },
  openGraph: {
    title: META.pricing.title,
    description: META.pricing.description,
    type: "article",
  },
};

export default function D1PricingPage() {
  const verified = row("verified-low");
  const unverified = row("neocloud-low");
  const median = row("median");

  return (
    <>
      <script
        type="application/ld+json"
        // Only describes figures that are visible on this page.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd()) }}
      />

      <D1Nav onPricingPage />

      <main id="main">
        {/* --- header --------------------------------------------------- */}
        <header className="relative overflow-hidden border-b border-[var(--rule-strong)]">
          <div aria-hidden className="d1-grid-bg pointer-events-none absolute inset-0 opacity-60" />
          <div className="d1-shell relative py-16 md:py-24">
            <p className="d1-label d1-fade-up text-[var(--ink-3)]">
              Updated {formatAsOf(SITE.pricingAsOf)} · every row sourced
            </p>

            <h1 className="d1-display d1-line-in mt-6 max-w-[22ch] text-[clamp(2.25rem,7vw,5.5rem)]">
              {META.pricing.h1}
            </h1>

            <p
              className="d1-body d1-fade-up mt-8 max-w-[56ch] text-[1rem] text-[var(--ink-2)] text-pretty md:text-[1.0625rem]"
              style={{ animationDelay: "120ms" }}
            >
              {META.pricing.standfirst}
            </p>

            {/* The three numbers that matter, up front. */}
            <dl
              className="d1-fade-up mt-12 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-3"
              style={{ animationDelay: "180ms" }}
            >
              {[
                { label: "Our on-demand rate", value: RATE.display, tone: "var(--accent)" },
                { label: "Lowest verified in stock", value: verified.display, tone: "var(--accent-2)" },
                { label: "Median across tracked providers", value: median.display, tone: "var(--ink)" },
              ].map((cell) => (
                <div key={cell.label} className="bg-[var(--bg)] px-5 py-5">
                  <dt className="d1-label text-[var(--ink-3)]">{cell.label}</dt>
                  <dd
                    className="d1-figure mt-2.5 text-[clamp(1.5rem,3.2vw,2.25rem)] leading-none"
                    style={{ color: cell.tone }}
                  >
                    {cell.value}
                  </dd>
                  <dd className="d1-label mt-2 normal-case tracking-[0.03em] text-[var(--ink-3)]">
                    {RATE.unit}
                  </dd>
                </div>
              ))}
            </dl>

            {/* The disclaimer that makes the rest credible, stated before the
                table rather than after it. */}
            <div
              className="d1-fade-up mt-6 border-l-2 border-[var(--caution)] pl-4"
              style={{ animationDelay: "220ms" }}
            >
              <p className="d1-label text-[var(--caution)]">
                We are not claiming to be the cheapest
              </p>
              <p className="d1-body mt-2 max-w-[68ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
                Listings at {unverified.display} exist and are in the table below. We could not book
                capacity at any of them. {verified.display} is the lowest rate we could confirm as
                actually orderable, and that is the comparison we think is honest.
              </p>
            </div>
          </div>
        </header>

        {/* --- table ---------------------------------------------------- */}
        <section aria-labelledby="table-heading" className="d1-shell py-16 md:py-20">
          <div className="d1-sechead">
            <span className="d1-figure text-[0.625rem] text-[var(--accent)]">01</span>
            <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
            <span className="d1-label text-[var(--ink-3)]">Published rates</span>
          </div>
          <h2 id="table-heading" className="sr-only">
            Published rates
          </h2>
          <div className="mt-8">
            <PricingTable />
          </div>
        </section>

        {/* --- position ------------------------------------------------- */}
        <section className="border-y border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="d1-shell grid gap-x-14 gap-y-8 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
            <h2 data-reveal className="d1-display-loose max-w-[24ch] text-[clamp(1.5rem,3.6vw,2.75rem)] text-balance">
              {PRICE_POSITION.heading}
            </h2>
            <div className="space-y-5">
              <p data-reveal className="d1-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body}
              </p>
              <p data-reveal className="d1-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body2}
              </p>
              <p data-reveal className="d1-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {CONTRACT.body}
              </p>
            </div>
          </div>
        </section>

        {/* --- estimator ------------------------------------------------ */}
        <div className="d1-shell py-16 md:py-20">
          <CostEstimator />
        </div>

        {/* --- methodology ---------------------------------------------- */}
        <div className="d1-shell border-t border-[var(--rule)] py-16 md:py-20">
          <Methodology />
        </div>

        {/* --- conversion ----------------------------------------------- */}
        <section className="border-t border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="d1-shell flex flex-wrap items-end justify-between gap-8 py-16 md:py-20">
            <div>
              <p className="d1-label text-[var(--ink-3)]">
                {FLEET.shape} {CONTRACT.model}, {CONTRACT.termYears}.
              </p>
              <p data-reveal className="d1-display mt-4 max-w-[20ch] text-[clamp(1.875rem,5.5vw,4rem)] text-balance">
                {SITE.tagline}
              </p>
            </div>
            <Link href="/d1#reserve" className="d1-btn">
              {FORM_COPY.eyebrow}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <D1Footer reserveHref="/d1#reserve" />
    </>
  );
}
