import { SITE } from "@/config/site";
import { HERO, FLEET, PRICE_POSITION, formatAsOf } from "@/content";
import { D1Cta } from "./Cta";
import { FleetStrip } from "./FleetStrip";

/**
 * Server component. The headline is plain text in the initial HTML with a
 * pure-CSS entrance, so it paints on the first frame and is a legitimate LCP
 * candidate. No JavaScript participates in making the value proposition
 * readable.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Graph-paper ground, masked out toward the bottom so it never competes
          with the text. Decorative, CSS-only, no repaint on scroll. */}
      <div aria-hidden className="d1-grid-bg pointer-events-none absolute inset-0 opacity-70" />

      {/* Cold pool of light behind the headline. Gives the black some depth
          without becoming a "gradient hero". */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-[-10%] h-[40rem] w-[55rem] opacity-[0.16]"
        style={{
          background: "radial-gradient(ellipse at center, var(--accent) 0%, transparent 62%)",
          filter: "blur(40px)",
        }}
      />

      <div className="d1-shell relative pt-14 pb-0 md:pt-20">
        {/* --- eyebrow ---------------------------------------------------- */}
        {/* The dot holds the first line and the label wraps beside it. Letting
            the two be wrap siblings orphaned the dot onto a line of its own as
            soon as the label needed two lines. */}
        <div className="d1-fade-up flex items-start gap-x-3" style={{ animationDelay: "60ms" }}>
          <span aria-hidden className="relative mt-[0.45em] flex h-1.5 w-1.5 shrink-0">
            <span className="d1-live absolute inset-0 rounded-full" />
          </span>
          <p className="d1-label min-w-0 text-[var(--ink-2)]">{HERO.eyebrow}</p>
        </div>

        {/* --- headline ---------------------------------------------------
            Three lines, three treatments. Line 2 is the pivot — it carries the
            actual promise, so it gets the accent, a wider cut, and lowercase.
        ------------------------------------------------------------------- */}
        <h1 id="hero-heading" className="mt-7 md:mt-9">
          <span className="sr-only">{HERO.headline}</span>

          <span aria-hidden className="block">
            <span className="block overflow-hidden">
              <span
                className="d1-display d1-line-in block text-[clamp(3.25rem,12.5vw,11.5rem)]"
                style={{ animationDelay: "0ms" }}
              >
                {HERO.headlineLines[0]}
              </span>
            </span>

            <span className="mt-[0.06em] block overflow-hidden md:flex md:items-end md:gap-8">
              <span
                className="d1-line-in block shrink-0 text-[clamp(3.25rem,12.5vw,11.5rem)] lowercase"
                style={{
                  animationDelay: "90ms",
                  fontFamily: "var(--fd)",
                  fontVariationSettings: '"wdth" 88, "wght" 300',
                  letterSpacing: "-0.035em",
                  lineHeight: 0.86,
                  color: "var(--accent)",
                }}
              >
                {HERO.headlineLines[1]}
              </span>

              {/* Instrument callout: the comparison set as a margin annotation
                  on the headline itself, with a leader rule back to the type,
                  rather than a bullet point four screens further down. */}
              <span
                className="d1-fade-up mb-[0.28em] hidden w-[15rem] shrink-0 md:block"
                style={{ animationDelay: "420ms" }}
              >
                <span aria-hidden className="mb-2.5 flex items-center gap-1.5">
                  <span className="h-1 w-1 shrink-0 bg-[var(--caution)]" />
                  <span className="h-px flex-1 bg-[var(--rule-strong)]" />
                </span>
                <span className="d1-label block text-[var(--ink-3)]">
                  Hyperscaler lead time to
                  <br />
                  provision reserved capacity
                </span>
                <span className="d1-figure mt-1.5 block text-[0.9375rem] leading-none text-[var(--caution)]">
                  {PRICE_POSITION.leadClaim.theirs}
                </span>
              </span>
            </span>

            <span className="mt-[0.06em] block overflow-hidden">
              <span
                className="d1-display d1-line-in block text-[clamp(3.25rem,12.5vw,11.5rem)]"
                style={{ animationDelay: "180ms" }}
              >
                {HERO.headlineLines[2]}
              </span>
            </span>
          </span>
        </h1>

        {/* --- standfirst + CTA ------------------------------------------- */}
        <div className="mt-10 grid gap-x-16 gap-y-8 md:mt-14 lg:grid-cols-[minmax(0,32rem)_1fr]">
          <div>
            <p
              className="d1-body d1-fade-up max-w-[34rem] text-[1rem] text-[var(--ink-2)] text-pretty md:text-[1.0625rem]"
              style={{ animationDelay: "260ms" }}
            >
              {HERO.standfirst}
            </p>

            <div
              className="d1-fade-up mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "340ms" }}
            >
              <D1Cta href="#reserve" location="hero">
                {HERO.ctaPrimary}
              </D1Cta>
              <D1Cta href="#pricing" location="hero-secondary" variant="ghost">
                {HERO.ctaSecondary}
              </D1Cta>
            </div>

            <p
              className="d1-label d1-fade-up mt-4 text-[var(--ink-3)]"
              style={{ animationDelay: "400ms" }}
            >
              {HERO.ctaNote}
            </p>
          </div>

          {/* --- the four facts ------------------------------------------
              Set as instrument channels. Every one of them is verifiable
              further down this same page, which is the point.
          --------------------------------------------------------------- */}
          <dl
            className="d1-fade-up grid grid-cols-2 border-t border-[var(--rule-strong)] sm:grid-cols-4 lg:mt-1"
            style={{ animationDelay: "300ms" }}
          >
            {HERO.facts.map((fact, i) => (
              <div
                key={fact.label}
                className="border-b border-[var(--rule)] px-0 py-4 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0"
              >
                <dt className="d1-label flex items-baseline gap-1.5 text-[var(--ink-3)]">
                  <span className="d1-figure text-[0.5625rem] text-[var(--ink-3)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {fact.label}
                </dt>
                <dd className="d1-figure mt-2 text-[1.375rem] leading-none text-[var(--ink)]">
                  {fact.value}
                </dd>
                <dd className="d1-label mt-1.5 normal-case tracking-[0.04em] text-[var(--ink-3)]">
                  {fact.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* --- the fleet, drawn ------------------------------------------- */}
        <div className="d1-fade-up mt-16 md:mt-20" style={{ animationDelay: "460ms" }}>
          <FleetStrip />
        </div>

        {/* --- footnote + scroll cue -------------------------------------- */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 pb-12 md:pb-16">
          <p className="d1-label max-w-[30rem] normal-case tracking-[0.04em] text-[var(--ink-3)]">
            {FLEET.total} units, {FLEET.nodes} nodes, one building we own. Specifications and market
            rates on this page were checked {formatAsOf(SITE.pricingAsOf)} and each carries its
            source.
          </p>
          <a
            href="#pricing"
            className="d1-label group flex items-center gap-2 text-[var(--ink-3)] transition-colors hover:text-[var(--accent)]"
          >
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-y-0.5"
            >
              ↓
            </span>
            Continue
          </a>
        </div>
      </div>
    </section>
  );
}
