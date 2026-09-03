import { SITE } from "@/config/site";
import {
  HERO,
  SECTIONS,
  FORM_COPY,
  PRICE_POSITION,
  FLEET,
  formatAsOf,
  RATE,
} from "@/content";
import { Cite } from "./Cite";
import { D2Cta } from "./Cta";

/**
 * The cover. Server component: the headline is text in the initial HTML with a
 * pure-CSS setting animation, so it is painted on the first frame and is a
 * legitimate LCP candidate.
 *
 * The move that makes this direction work is the contents list. A landing page
 * asks you to scroll and trust; a document tells you what is in it and how
 * long it will take. For a buyer who is deciding whether we are serious, being
 * handed a table of contents is itself the argument.
 */

const CONTENTS = [
  { n: SECTIONS.pricing.index, label: SECTIONS.pricing.heading, href: "#pricing", note: "Sourced, dated" },
  { n: SECTIONS.specs.index, label: SECTIONS.specs.heading, href: "#specs", note: "Per-GPU figures" },
  { n: SECTIONS.reserve.index, label: FORM_COPY.heading, href: "#reserve", note: "Order card" },
  { n: SECTIONS.operator.index, label: SECTIONS.operator.heading, href: "#operator", note: "Plainly" },
];

export function Cover() {
  return (
    <section className="d2-shell pt-10 md:pt-16" aria-labelledby="cover-heading">
      <div className="d2-page">
        {/* --- marginal column ------------------------------------------- */}
        <div className="hidden lg:block">
          <p className="d2-figure d2-ink text-[0.6875rem] leading-[1.7] text-[var(--ink-3)]">
            No. 01
            <br />
            {formatAsOf(SITE.pricingAsOf)}
            <br />
            <span className="d2-caps text-[0.5625rem]">{SITE.location.region}</span>
          </p>
          <div aria-hidden className="d2-draw mt-4 h-px w-full bg-[var(--rule-strong)]" />
        </div>

        {/* --- main ------------------------------------------------------ */}
        <div>
          <p className="d2-caps d2-ink text-[var(--accent)]" style={{ animationDelay: "40ms" }}>
            {HERO.eyebrow}
          </p>

          {/* Headline. "in days" is the pivot, so it takes the italic — the one
              piece of emphasis a single-weight display face can make. */}
          <h1 id="cover-heading" className="mt-5 md:mt-7">
            <span className="sr-only">{HERO.headline}</span>
            <span aria-hidden className="d2-display block text-[clamp(2.75rem,9.5vw,8rem)]">
              <span className="block overflow-hidden">
                <span className="d2-set-line block" style={{ animationDelay: "0ms" }}>
                  {HERO.headlineLines[0]}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span
                  className="d2-set-line d2-em block text-[var(--accent)]"
                  style={{ animationDelay: "100ms" }}
                >
                  {HERO.headlineLines[1]}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span className="d2-set-line block" style={{ animationDelay: "200ms" }}>
                  {HERO.headlineLines[2]}
                </span>
              </span>
            </span>
          </h1>

          <div className="mt-9 grid gap-x-12 gap-y-9 md:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <div>
              <p
                className="d2-standfirst d2-ink d2-measure-wide text-[clamp(1.0625rem,1.9vw,1.375rem)] text-pretty"
                style={{ animationDelay: "260ms" }}
              >
                {HERO.standfirst}
                <Cite sourceId="facility" />
              </p>

              <div
                className="d2-ink mt-8 flex flex-wrap items-center gap-x-4 gap-y-3"
                style={{ animationDelay: "340ms" }}
              >
                <D2Cta href="#reserve" location="cover">
                  {HERO.ctaPrimary}
                </D2Cta>
                <D2Cta href="#pricing" location="cover-secondary" variant="outline">
                  {HERO.ctaSecondary}
                </D2Cta>
                <p className="d2-caps text-[0.5625rem] text-[var(--ink-3)]">{HERO.ctaNote}</p>
              </div>

              {/* The lead-time contrast, set as a printed aside with a rule. */}
              <div
                className="d2-ink mt-10 border-l-2 border-[var(--accent)] pl-5"
                style={{ animationDelay: "400ms" }}
              >
                <p className="d2-caps text-[var(--ink-3)]">
                  Time to capacity
                </p>
                <p className="d2-display mt-2 text-[clamp(1.5rem,3.4vw,2.5rem)]">
                  {PRICE_POSITION.leadClaim.ours} here.{" "}
                  <span className="text-[var(--ink-3)]">
                    {PRICE_POSITION.leadClaim.theirs.toLowerCase()} there.
                  </span>
                </p>
                <p className="d2-prose mt-2 max-w-[46ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                  {PRICE_POSITION.leadClaim.theirsQualifier}
                </p>
              </div>
            </div>

            {/* --- contents ---------------------------------------------- */}
            <nav
              aria-label="Contents"
              className="d2-ink border-t border-[var(--ink)] pt-4"
              style={{ animationDelay: "300ms" }}
            >
              <p className="d2-caps text-[var(--ink-3)]">Contents</p>
              <ol className="mt-4 space-y-0">
                {CONTENTS.map((item) => (
                  <li key={item.href} className="border-b border-[var(--rule)] py-2.5 last:border-0">
                    <a href={item.href} className="group block">
                      <span className="d2-leader">
                        <span className="d2-figure shrink-0 text-[0.625rem] text-[var(--accent)]">
                          {item.n}
                        </span>
                        <span className="d2-prose shrink-0 text-[0.9375rem] transition-colors group-hover:text-[var(--accent)]">
                          {item.label}
                        </span>
                        <span className="d2-caps shrink-0 text-[0.5rem] text-[var(--ink-3)]">
                          {item.note}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* --- figures band --------------------------------------------------
          Four facts, set as a ruled run of figures. Each one is checkable
          further down this same document, which is the whole conceit.
      ------------------------------------------------------------------- */}
      <dl
        className="d2-ink mt-14 grid border-y border-[var(--ink)] sm:grid-cols-2 lg:grid-cols-4"
        style={{ animationDelay: "460ms" }}
      >
        {HERO.facts.map((fact) => (
          <div
            key={fact.label}
            className="border-b border-[var(--rule)] px-0 py-5 sm:border-b-0 sm:px-5 sm:first:pl-0 lg:border-r lg:border-[var(--rule)] lg:last:border-r-0"
          >
            <dt className="d2-caps text-[var(--ink-3)]">{fact.label}</dt>
            <dd className="d2-figure mt-2.5 text-[clamp(1.5rem,2.6vw,2rem)] leading-none">
              {fact.value}
            </dd>
            <dd className="d2-prose mt-2 text-[0.8125rem] leading-snug text-[var(--ink-2)]">
              {fact.detail}
              <Cite sourceId={fact.sourceId} />
            </dd>
          </div>
        ))}
      </dl>

      <p className="d2-prose mt-4 max-w-[74ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty">
        {FLEET.shape} On-demand at {RATE.full}. Every figure in this document carries a superscript
        that resolves to its source at the foot of the section, with the date we read it.
      </p>
    </section>
  );
}
