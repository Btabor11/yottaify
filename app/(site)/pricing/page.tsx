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
import { D3Nav } from "@/components/d3/Chrome";
import { D3Footer } from "@/components/d3/Footer";
import { LoadProfile } from "@/components/d3/LoadProfile";
import { RateTable, Methodology } from "@/components/d3/RateTable";
import { LoadCalc } from "@/components/d3/LoadCalc";
import { pricingJsonLd } from "@/components/shared/pricingSchema";

export const metadata: Metadata = {
  title: META.pricing.title,
  description: META.pricing.description,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: META.pricing.title,
    description: META.pricing.description,
    type: "article",
  },
};

export default function D3PricingPage() {
  const verified = row("verified-low");
  const unverified = row("neocloud-low");
  const median = row("median");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd()) }}
      />

      <D3Nav onPricingPage />

      <main id="main">
        {/* --- header ----------------------------------------------------- */}
        <header className="relative overflow-hidden border-b border-[var(--rule-strong)]">
          <div aria-hidden className="d3-grid pointer-events-none absolute inset-0 opacity-70" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 60% at 85% 0%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 65%)",
            }}
          />

          <div className="d3-shell relative pb-14 pt-28 md:pb-20 md:pt-36">
            <p className="d3-tag d3-rise text-[var(--ink-3)]">
              Updated {formatAsOf(SITE.pricingAsOf)} · every row sourced
            </p>

            <h1 className="d3-display d3-charge mt-6 max-w-[24ch] text-[clamp(2rem,6.5vw,5rem)] text-balance">
              {META.pricing.h1}
            </h1>

            <p
              className="d3-body d3-rise mt-7 max-w-[58ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty md:text-[1.0625rem]"
              style={{ animationDelay: "140ms" }}
            >
              {META.pricing.standfirst}
            </p>

            {/* The three numbers, up front. */}
            <dl
              className="d3-rise mt-11 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-3"
              style={{ animationDelay: "200ms" }}
            >
              {[
                { label: "Our on-demand rate", value: RATE.display, tone: "var(--accent)" },
                { label: "Lowest verified in stock", value: verified.display, tone: "var(--ink)" },
                {
                  label: "Median across tracked providers",
                  value: median.display,
                  tone: "var(--ink)",
                },
              ].map((cell) => (
                <div key={cell.label} className="bg-[var(--surface)] px-5 py-5">
                  <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{cell.label}</dt>
                  <dd
                    className="d3-figure mt-3 text-[clamp(1.5rem,3.2vw,2.25rem)] leading-none"
                    style={{ color: cell.tone }}
                  >
                    {cell.value}
                  </dd>
                  <dd className="d3-tag mt-2.5 text-[0.4375rem] text-[var(--ink-3)]">
                    {RATE.unit}
                  </dd>
                </div>
              ))}
            </dl>

            <div
              className="d3-rise mt-6 border-l-2 border-[var(--caution)] pl-4"
              style={{ animationDelay: "240ms" }}
            >
              <p className="d3-tag text-[var(--caution)]">
                We are not claiming to be the cheapest
              </p>
              <p className="d3-body mt-2 max-w-[70ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
                Listings at {unverified.display} exist and are in the table below. We could not book
                capacity at any of them. {verified.display} is the lowest rate we could confirm as
                actually orderable, and that is the comparison we think is honest.
              </p>
            </div>
          </div>
        </header>

        {/* --- chart ------------------------------------------------------ */}
        <section aria-labelledby="chart-heading" className="d3-shell py-14 md:py-20">
          <h2
            id="chart-heading"
            className="d3-display text-[clamp(1.375rem,3vw,2.25rem)]"
            data-load
            data-load-from="78"
          >
            Published rates, on one scale
          </h2>
          <div className="mt-7">
            <LoadProfile />
          </div>
        </section>

        {/* --- table ------------------------------------------------------ */}
        <section
          aria-labelledby="table-heading"
          className="d3-shell border-t border-[var(--rule)] py-14 md:py-20"
        >
          <h2
            id="table-heading"
            className="d3-display text-[clamp(1.375rem,3vw,2.25rem)]"
            data-load
            data-load-from="78"
          >
            The table, in full
          </h2>
          <div className="mt-8">
            <RateTable />
          </div>
        </section>

        {/* --- position --------------------------------------------------- */}
        <section className="border-y border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="d3-shell grid gap-x-14 gap-y-8 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
            <h2
              className="d3-display max-w-[22ch] text-[clamp(1.5rem,3.6vw,2.75rem)] text-balance"
              data-load
              data-load-from="74"
            >
              {PRICE_POSITION.heading}
            </h2>
            <div className="space-y-5" data-r-group>
              <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body}
              </p>
              <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {PRICE_POSITION.body2}
              </p>
              <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                {CONTRACT.body}
              </p>
            </div>
          </div>
        </section>

        {/* --- calculator ------------------------------------------------- */}
        <div className="d3-shell py-14 md:py-20">
          <LoadCalc />
        </div>

        {/* --- methodology ------------------------------------------------ */}
        <div className="d3-shell border-t border-[var(--rule)] py-14 md:py-20">
          <Methodology />
        </div>

        {/* --- conversion ------------------------------------------------- */}
        <section className="border-t border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="d3-shell flex flex-wrap items-end justify-between gap-x-10 gap-y-8 py-14 md:py-20">
            <div>
              <p className="d3-tag text-[var(--ink-3)]">
                {FLEET.shape} {CONTRACT.model}, {CONTRACT.termYears}.
              </p>
              <p
                className="d3-display mt-4 max-w-[17ch] text-[clamp(1.875rem,5.5vw,4rem)] text-balance"
                data-load
                data-load-from="70"
              >
                {SITE.tagline}
              </p>
            </div>
            <Link href="/d3#reserve" className="d3-btn">
              {FORM_COPY.eyebrow}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <D3Footer reserveHref="/d3#reserve" />
    </>
  );
}
