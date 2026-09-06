import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import {
  FACILITY_SHEET,
  ASSURANCE,
  FORM_COPY,
  TITLEBLOCK,
  formatAsOfShort,
  source,
} from "@/content";
import { D3Nav } from "@/components/d3/Chrome";
import { D3Footer } from "@/components/d3/Footer";
import { OneLine } from "@/components/d3/OneLine";
import { SourceLink } from "@/components/shared/SourceLink";

export const metadata: Metadata = {
  title: FACILITY_SHEET.meta.title,
  description: FACILITY_SHEET.meta.description,
  alternates: { canonical: "/facility" },
  openGraph: {
    title: FACILITY_SHEET.meta.title,
    description: FACILITY_SHEET.meta.description,
    type: "article",
  },
};

/**
 * F-01 — the facility sheet.
 *
 * Everything electrical is here and nowhere else. It is a document, like
 * /pricing, so the whole route is paper: nothing to feel, everything to check.
 *
 * This page exists because the electrical detail is honest and worth
 * publishing but is not the argument. A reader deciding where to run a model
 * does not open with a question about service voltage, and a landing page that
 * did read as an electrical contractor's. One click away is the right distance
 * — close enough for the engineer who wants it, out of the way of everyone else.
 */
export default function FacilityPage() {
  const src = source(FACILITY_SHEET.service.sourceId);

  return (
    <>
      <D3Nav onPricingPage />

      <main id="main" className="d3-paper relative">
        {/* --- header ----------------------------------------------------- */}
        <header className="relative overflow-hidden border-b border-[var(--rule-strong)]">
          <div aria-hidden className="d3-contours pointer-events-none absolute inset-0 opacity-70" />

          <div className="d3-shell relative pb-14 pt-28 md:pb-20 md:pt-36">
            <dl className="d3-titleblock d3-rise" style={{ ["--cols" as string]: 4 }}>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.sheet}</dt>
                <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink)] md:text-[1.125rem] md:leading-none">
                  {FACILITY_SHEET.index}
                </dd>
              </div>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.title}</dt>
                <dd
                  className="d3-display mt-1 text-[1rem] leading-[1.05] text-[var(--accent)] md:text-[1.125rem] md:leading-none"
                  style={{ ["--wght" as string]: 700 }}
                >
                  {FACILITY_SHEET.eyebrow}
                </dd>
              </div>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.checked}</dt>
                <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink)] md:text-[1.125rem] md:leading-none">
                  {formatAsOfShort(SITE.pricingAsOf)}
                </dd>
              </div>
              <div>
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.scale}</dt>
                <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink-2)] md:text-[1.125rem] md:leading-none">
                  {TITLEBLOCK.scaleValue}
                </dd>
              </div>
            </dl>

            <h1
              className="d3-display d3-charge mt-10 max-w-[8.7em] text-[clamp(2.75rem,8vw,7rem)] text-balance"
              style={{ animationDelay: "80ms" }}
            >
              {FACILITY_SHEET.h1}
            </h1>

            <p
              className="d3-body d3-rise mt-7 max-w-[58ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty md:text-[1.0625rem]"
              style={{ animationDelay: "180ms" }}
            >
              {FACILITY_SHEET.standfirst}
            </p>
          </div>
        </header>

        {/* --- the building ------------------------------------------------ */}
        <section aria-labelledby="building-heading" className="d3-shell py-14 md:py-20">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
            {FACILITY_SHEET.index}.1 — {FACILITY_SHEET.building.eyebrow}
          </p>

          <div className="mt-6 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h2
                id="building-heading"
                className="d3-display max-w-[7em] text-[clamp(1.75rem,4vw,3rem)] text-balance"
                data-load
                data-load-from="300"
              >
                {FACILITY_SHEET.building.heading}
              </h2>
              <p className="d3-body mt-5 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                {FACILITY_SHEET.building.body}
              </p>
            </div>

            <dl className="grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-2" data-r-group>
              {FACILITY_SHEET.building.facts.map((f) => (
                <div key={f.label} className="bg-[var(--surface)] px-5 py-4">
                  <dt className="d3-tag text-[0.4375rem] text-[var(--accent)]">{f.label}</dt>
                  <dd className="d3-body mt-2 text-[0.8125rem] leading-snug text-[var(--ink-2)] text-pretty">
                    {f.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* --- the electrical service --------------------------------------- */}
        <section
          aria-labelledby="service-heading"
          className="relative border-y border-[var(--rule-strong)] bg-[var(--surface)]"
        >
          <div aria-hidden className="d3-ledger pointer-events-none absolute inset-0 opacity-60" />
          <div className="d3-shell relative py-14 md:py-20">
            <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
              {FACILITY_SHEET.index}.2 — {FACILITY_SHEET.service.eyebrow}
            </p>

            <div className="mt-6 grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              <div data-r>
                <OneLine />
              </div>

              <div>
                <h2
                  id="service-heading"
                  className="d3-display max-w-[7em] text-[clamp(1.75rem,4vw,3rem)] text-balance"
                  data-load
                  data-load-from="300"
                >
                  {FACILITY_SHEET.service.heading}
                </h2>
                <p className="d3-body mt-5 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                  {FACILITY_SHEET.service.body}
                </p>

                <dl
                  className="mt-8 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-2"
                  data-r-group
                >
                  {FACILITY_SHEET.service.readout.map((r) => (
                    <div key={r.label} className="bg-[var(--bg)] px-5 py-4">
                      <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">{r.label}</dt>
                      <dd className="d3-figure mt-2 text-[1.125rem] text-[var(--accent)]">{r.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="d3-body mt-6 max-w-[60ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty" data-r>
                  {FACILITY_SHEET.service.figureNote}
                </p>
                <p
                  className="d3-body mt-4 max-w-[60ch] border-l-2 border-[var(--caution)] pl-4 text-[0.8125rem] text-[var(--ink-3)] text-pretty"
                  data-r
                >
                  {FACILITY_SHEET.service.caveat}
                </p>
                <p className="d3-tag mt-5 text-[0.4375rem] text-[var(--ink-3)]">
                  Source:{" "}
                  {src.url ? (
                    <SourceLink href={src.url} sourceId={src.id} className="d3-link">
                      {src.label} ↗
                    </SourceLink>
                  ) : (
                    src.label
                  )}{" "}
                  · {formatAsOfShort(src.accessed)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- physical posture --------------------------------------------- */}
        <section aria-labelledby="posture-heading" className="d3-shell py-14 md:py-20">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
            {FACILITY_SHEET.index}.3 — {ASSURANCE.physical.eyebrow}
          </p>

          <h2
            id="posture-heading"
            className="d3-display mt-6 max-w-[7em] text-[clamp(1.75rem,4vw,3rem)] text-balance"
            data-load
            data-load-from="300"
          >
            {ASSURANCE.physical.heading}
          </h2>

          <ul className="mt-8 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] md:grid-cols-2 lg:grid-cols-4" data-r-group>
            {ASSURANCE.physical.points.map((p, i) => (
              <li key={p.label} className="bg-[var(--surface)] p-5">
                <p className="d3-figure text-[0.625rem] text-[var(--accent)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <p className="d3-display mt-2 text-[1.125rem]" style={{ ["--wght" as string]: 720 }}>
                  {p.label}
                </p>
                <p className="d3-body mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">{p.detail}</p>
              </li>
            ))}
          </ul>

          <p className="d3-body mt-6 max-w-[80ch] border-l-2 border-[var(--caution)] pl-4 text-[0.8125rem] text-[var(--ink-3)] text-pretty">
            {ASSURANCE.physical.caveat}{" "}
            <Link href="/#assurance" className="d3-link">
              The certification roadmap is on the overview
            </Link>
            .
          </p>

          <p className="d3-tag mt-9 text-[0.4375rem] text-[var(--ink-3)]">{FACILITY_SHEET.checked}</p>
        </section>

        {/* --- conversion ---------------------------------------------------- */}
        <section className="border-t border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="d3-shell flex flex-wrap items-end justify-between gap-x-10 gap-y-10 py-14 md:gap-y-8 md:py-20">
            <p className="d3-display max-w-[6.75em] text-[clamp(2.25rem,6.5vw,5rem)] text-balance" data-load data-load-from="300">
              {SITE.tagline}
            </p>
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
