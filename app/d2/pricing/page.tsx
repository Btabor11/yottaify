import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import {
  META,
  METHODOLOGY,
  PRICE_POSITION,
  RATE,
  row,
  formatAsOf,
  FLEET,
  CONTRACT,
  FORM_COPY,
} from "@/content";
import { D2Masthead } from "@/components/d2/Chrome";
import { Footer } from "@/components/d2/Footer";
import { LedgerTable } from "@/components/d2/Ledger";
import { RateScale } from "@/components/d2/RateScale";
import { Footnotes } from "@/components/d2/Footnotes";
import { Reckoner } from "@/components/d2/Reckoner";
import { Set, Rule } from "@/components/d2/Reveal";
import { pricingJsonLd } from "@/components/shared/pricingSchema";

export const metadata: Metadata = {
  title: META.pricing.title,
  description: META.pricing.description,
  alternates: { canonical: "/d2/pricing" },
  openGraph: {
    title: META.pricing.title,
    description: META.pricing.description,
    type: "article",
  },
};

export default function D2PricingPage() {
  const verified = row("verified-low");
  const unverified = row("neocloud-low");
  const median = row("median");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd()) }}
      />

      <D2Masthead onPricingPage />

      <main id="main">
        {/* --- title page ------------------------------------------------ */}
        <header className="d2-shell border-b border-[var(--ink)] py-14 md:py-20">
          <div className="d2-page">
            <div className="lg:pt-3">
              <p className="d2-figure text-[2.25rem] leading-none text-[var(--rule-strong)] lg:text-[3rem]">
                §
              </p>
              <p className="d2-caps mt-2 text-[var(--ink-3)] lg:mt-3">Statement</p>
            </div>

            <div>
              <p className="d2-caps text-[var(--ink-3)]">
                Updated {formatAsOf(SITE.pricingAsOf)} · every row sourced
              </p>

              <h1 className="d2-display d2-set-line mt-5 max-w-[24ch] text-[clamp(2.25rem,7vw,5.25rem)] text-balance">
                {META.pricing.h1}
              </h1>

              <p
                className="d2-standfirst d2-ink d2-measure-wide mt-7 text-[clamp(1.0625rem,2vw,1.375rem)] text-[var(--ink-2)] text-pretty"
                style={{ animationDelay: "120ms" }}
              >
                {META.pricing.standfirst}
              </p>

              {/* The abstract: three figures, set as a printed summary. */}
              <dl className="mt-11 grid border-y border-[var(--ink)] sm:grid-cols-3">
                {[
                  { label: "Our on-demand rate", value: RATE.display, tone: "var(--accent)" },
                  {
                    label: "Lowest verified in stock",
                    value: verified.display,
                    tone: "var(--accent-2)",
                  },
                  { label: "Median across tracked providers", value: median.display, tone: "var(--ink)" },
                ].map((cell, i) => (
                  <div
                    key={cell.label}
                    className="border-[var(--rule-strong)] py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
                    style={{
                      borderTopWidth: i > 0 ? 1 : 0,
                      borderLeftWidth: 0,
                    }}
                  >
                    <dt className="d2-caps text-[0.5625rem] text-[var(--ink-3)]">{cell.label}</dt>
                    <dd
                      className="d2-figure mt-2 text-[clamp(1.625rem,3.4vw,2.375rem)] leading-none"
                      style={{ color: cell.tone }}
                    >
                      {cell.value}
                    </dd>
                    <dd className="d2-caps mt-2 text-[0.5rem] text-[var(--ink-3)]">{RATE.unit}</dd>
                  </div>
                ))}
              </dl>

              {/* Stated before the table, not after it. */}
              <div className="mt-7 border-l-2 border-[var(--caution)] pl-4">
                <p className="d2-caps text-[var(--caution)]">
                  We are not claiming to be the cheapest
                </p>
                <p className="d2-prose d2-measure-wide mt-2 text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                  Listings at {unverified.display} exist and are in the table below. We could not
                  book capacity at any of them. {verified.display} is the lowest rate we could
                  confirm as actually orderable, and that is the comparison we think is honest.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* --- the scale, then the table --------------------------------- */}
        <section aria-labelledby="rates-heading" className="d2-shell py-14 md:py-20">
          <div className="d2-page">
            <div className="lg:pt-1">
              <p className="d2-caps text-[var(--ink-3)]">Fig. 1</p>
            </div>
            <div>
              <h2 id="rates-heading" className="d2-display text-[clamp(1.5rem,3.4vw,2.5rem)]">
                Published rates, on one scale
              </h2>
              <div className="mt-8">
                <Set>
                  <RateScale />
                </Set>
              </div>

              <div className="mt-14 md:mt-20">
                <Rule className="d2-rule-heavy mb-8" />
                <h2 className="d2-display text-[clamp(1.5rem,3.4vw,2.5rem)]">
                  The table, in full
                </h2>
                <div className="mt-7">
                  <Set>
                    <LedgerTable />
                  </Set>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- position -------------------------------------------------- */}
        <section className="border-y border-[var(--ink)] bg-[var(--surface)]">
          <div className="d2-shell py-14 md:py-20">
            <div className="d2-page">
              <div className="lg:pt-2">
                <p className="d2-caps text-[var(--accent)]">{PRICE_POSITION.eyebrow}</p>
              </div>
              <div>
                <h2 className="d2-display max-w-[26ch] text-[clamp(1.625rem,4.2vw,3.25rem)] text-balance">
                  {PRICE_POSITION.heading}
                </h2>
                <div className="d2-columns mt-8">
                  <p className="d2-prose text-[1rem] text-[var(--ink-2)] text-pretty">
                    {PRICE_POSITION.body}
                  </p>
                  <p className="d2-prose text-[1rem] text-[var(--ink-2)] text-pretty">
                    {PRICE_POSITION.body2}
                  </p>
                  <p className="d2-prose text-[1rem] text-[var(--ink-2)] text-pretty">
                    {CONTRACT.body}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- reckoner -------------------------------------------------- */}
        <section className="d2-shell py-14 md:py-20">
          <div className="d2-page">
            <div className="lg:pt-1">
              <p className="d2-caps text-[var(--ink-3)]">Slip</p>
            </div>
            <Reckoner />
          </div>
        </section>

        {/* --- methodology ----------------------------------------------- */}
        <section aria-labelledby="method-heading" className="d2-shell border-t border-[var(--rule-strong)] py-14 md:py-20">
          <div className="d2-page">
            <div className="lg:pt-1">
              <p className="d2-caps text-[var(--ink-3)]">Notes</p>
            </div>
            <div>
              <h2 id="method-heading" className="d2-display text-[clamp(1.5rem,3.4vw,2.5rem)]">
                {METHODOLOGY.heading}
              </h2>
              <dl className="mt-8 border-t border-[var(--ink)]">
                {METHODOLOGY.points.map((p, i) => (
                  <div
                    key={p.label}
                    className="grid gap-x-8 gap-y-2 border-b border-[var(--rule)] py-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]"
                  >
                    <dt className="flex items-baseline gap-3">
                      <span className="d2-figure text-[0.6875rem] text-[var(--accent)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="d2-prose text-[1rem] text-[var(--ink)]">{p.label}</span>
                    </dt>
                    <dd className="d2-prose max-w-[62ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                      {p.body}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-14">
                <Footnotes heading="Sources, in full" />
              </div>
            </div>
          </div>
        </section>

        {/* --- conversion ------------------------------------------------ */}
        <section className="border-t border-[var(--ink)] bg-[var(--surface)]">
          <div className="d2-shell flex flex-wrap items-end justify-between gap-x-12 gap-y-8 py-14 md:py-20">
            <div>
              <p className="d2-caps text-[var(--ink-3)]">
                {FLEET.shape} {CONTRACT.model}, {CONTRACT.termYears}.
              </p>
              <p className="d2-display mt-4 max-w-[19ch] text-[clamp(2rem,6vw,4.25rem)] text-balance">
                {SITE.tagline}
              </p>
            </div>
            <Link href="/d2#reserve" className="d2-btn">
              {FORM_COPY.eyebrow}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer reserveHref="/d2#reserve" />
    </>
  );
}
