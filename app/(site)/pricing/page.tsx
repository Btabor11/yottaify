import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import {
  META,
  PRICE_POSITION,
  RATE,
  row,
  formatAsOf,
  formatAsOfShort,
  FLEET,
  CONTRACT,
  FORM_COPY,
  TITLEBLOCK,
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

/**
 * The pricing route is a document, so the whole of it is paper. Nothing to
 * feel here; everything to check.
 */
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

      <main id="main" className="d3-paper relative">
        {/* --- header ----------------------------------------------------- */}
        <header className="relative overflow-hidden border-b border-[var(--rule-strong)]">
          <div aria-hidden className="d3-contours pointer-events-none absolute inset-0 opacity-70" />

          <div className="d3-shell relative pb-14 pt-28 md:pb-20 md:pt-36">
            <dl className="d3-titleblock d3-rise" style={{ ["--cols" as string]: 4 }}>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.sheet}</dt>
                <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink)] md:text-[1.125rem] md:leading-none">P-01</dd>
              </div>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.title}</dt>
                <dd className="d3-display mt-1 text-[1rem] leading-[1.05] text-[var(--accent)] md:text-[1.125rem] md:leading-none" style={{ ["--wght" as string]: 700 }}>
                  Rate schedule
                </dd>
              </div>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.checked}</dt>
                <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink)] md:text-[1.125rem] md:leading-none">
                  {formatAsOfShort(SITE.pricingAsOf)}
                </dd>
              </div>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">Basis</dt>
                <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink-2)] md:text-[1.125rem] md:leading-none">{RATE.unit}</dd>
              </div>
            </dl>

            <h1
              className="d3-display d3-charge mt-10 max-w-[8.7em] text-[clamp(2.75rem,8vw,7rem)] text-balance"
              style={{ animationDelay: "80ms" }}
            >
              {META.pricing.h1}
            </h1>

            <p
              className="d3-body d3-rise mt-7 max-w-[58ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty md:text-[1.0625rem]"
              style={{ animationDelay: "180ms" }}
            >
              {META.pricing.standfirst}
            </p>

            {/* The three numbers, up front. */}
            <dl
              className="d3-rise mt-11 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-3"
              style={{ animationDelay: "240ms" }}
            >
              {[
                { label: "Our on-demand rate", value: RATE.display, tone: "var(--accent)" },
                { label: "Lowest verified in stock", value: verified.display, tone: "var(--ink)" },
                { label: "Median across tracked providers", value: median.display, tone: "var(--ink)" },
              ].map((cell) => (
                <div key={cell.label} className="bg-[var(--surface)] px-5 py-5">
                  <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{cell.label}</dt>
                  <dd className="d3-figure mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] leading-none" style={{ color: cell.tone }}>
                    {cell.value}
                  </dd>
                  <dd className="d3-tag mt-2.5 text-[0.4375rem] text-[var(--ink-3)]">{RATE.unit}</dd>
                </div>
              ))}
            </dl>

            <div className="d3-rise mt-6 border-l-2 border-[var(--caution)] pl-4" style={{ animationDelay: "300ms" }}>
              <p className="d3-tag text-[var(--caution)]">We are not claiming to be the cheapest</p>
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
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">P-01.1 — Chart</p>
          <h2 id="chart-heading" className="d3-display mt-5 text-[clamp(1.75rem,4vw,3rem)]" data-load data-load-from="300">
            Published rates, on one scale
          </h2>
          <div className="mt-7">
            <LoadProfile />
          </div>
        </section>

        {/* --- table ------------------------------------------------------ */}
        <section aria-labelledby="table-heading" className="d3-shell border-t border-[var(--rule)] py-14 md:py-20">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">P-01.2 — Schedule</p>
          <h2 id="table-heading" className="d3-display mt-5 text-[clamp(1.75rem,4vw,3rem)]" data-load data-load-from="300">
            The table, in full
          </h2>
          <div className="mt-8">
            <RateTable />
          </div>
        </section>

        {/* --- position --------------------------------------------------- */}
        <section className="relative border-y border-[var(--rule-strong)] bg-[var(--surface)]">
          <div aria-hidden className="d3-ledger pointer-events-none absolute inset-0 opacity-60" />
          <div className="d3-shell relative grid gap-x-14 gap-y-8 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
            <h2 className="d3-display max-w-[7.7em] text-[clamp(2rem,5vw,4rem)] text-balance" data-load data-load-from="300">
              {PRICE_POSITION.heading}
            </h2>
            <div className="space-y-5" data-r-group>
              <p className="d3-voice text-[1.5rem] leading-[1.15] text-[var(--ink)] text-pretty md:text-[1.75rem]">
                {PRICE_POSITION.body}
              </p>
              <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">{PRICE_POSITION.body2}</p>
              <p className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">{CONTRACT.body}</p>
            </div>
          </div>
        </section>

        {/* --- calculator ------------------------------------------------- */}
        <div className="d3-shell py-14 md:py-20">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">P-01.3 — Load calculation</p>
          <div className="mt-6">
            <LoadCalc />
          </div>
        </div>

        {/* --- methodology ------------------------------------------------ */}
        <div className="d3-shell border-t border-[var(--rule)] py-14 md:py-20">
          <Methodology />
        </div>

        {/* --- conversion ------------------------------------------------- */}
        <section className="border-t border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="d3-shell flex flex-wrap items-end justify-between gap-x-10 gap-y-10 py-14 md:gap-y-8 md:py-20">
            <div>
              <p className="d3-tag leading-relaxed text-[var(--ink-3)] text-pretty">
                {FLEET.shape} {CONTRACT.model}, {CONTRACT.termYears}. Updated {formatAsOf(SITE.pricingAsOf)}.
              </p>
              <p className="d3-display mt-5 max-w-[6.75em] text-[clamp(2.25rem,6.5vw,5rem)] text-balance md:mt-4" data-load data-load-from="300">
                {SITE.tagline}
              </p>
            </div>
            <Link href="/#reserve" className="d3-btn w-full sm:w-auto">
              {FORM_COPY.eyebrow}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <D3Footer reserveHref="/#reserve" />
    </>
  );
}
