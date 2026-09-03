import { SITE } from "@/config/site";
import { HERO, FLEET, POWER, PRICE_POSITION, RATE, NODE } from "@/content";
import { BusMount } from "./BusMount";
import { D3Cta } from "./Cta";

/**
 * Hero.
 *
 * The headline is real text in the server HTML — the only thing animating on
 * load is each line's variable width axis, which starts narrow and opens out.
 * That means LCP is a text paint with no dependency on the canvas, the fonts
 * are the only blocking asset, and a failed WebGL context costs the page
 * nothing but its background.
 *
 * The one-line strip under the CTAs is the direction's argument in miniature:
 * four facts wired together as a circuit rather than dropped in four cards.
 */
export function Hero() {
  return (
    <section className="relative isolate flex min-h-[92svh] flex-col justify-end overflow-hidden">
      <BusMount />

      {/* Scrim. The shader is an enhancement and its output is not fully
          predictable, so contrast under the headline is guaranteed here in CSS
          rather than trusted to the fragment shader. */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(100deg, var(--bg) 0%, color-mix(in oklab, var(--bg) 88%, transparent) 34%, color-mix(in oklab, var(--bg) 30%, transparent) 62%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-[1] h-1/2"
        style={{ background: "linear-gradient(to top, var(--bg) 4%, transparent 100%)" }}
      />

      <div className="d3-shell relative z-10 pb-14 pt-32 md:pb-20">
        {/* --- eyebrow ---------------------------------------------------- */}
        <p className="d3-tag d3-rise flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--ink-2)]">
          <span className="d3-pip text-[var(--accent)]">Pre-launch</span>
          <span aria-hidden className="text-[var(--rule-strong)]">/</span>
          <span>{HERO.eyebrow}</span>
        </p>

        {/* --- headline ---------------------------------------------------
            Sized so that no line breaks at any viewport: the three-line stack
            is the composition, and a rogue fourth line ruins it. */}
        <h1 className="mt-7">
          {HERO.headlineLines.map((line, i) => (
            <span
              key={line}
              className="d3-display d3-charge block text-[clamp(2.125rem,8vw,7.25rem)]"
              style={{
                animationDelay: `${i * 110}ms`,
                color: i === 1 ? "var(--accent)" : undefined,
              }}
            >
              {line}
            </span>
          ))}
        </h1>

        {/* --- standfirst + CTAs ------------------------------------------ */}
        <div className="mt-9 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:items-end">
          <div>
            <p
              className="d3-body d3-rise max-w-[46ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty md:text-[1.0625rem]"
              style={{ animationDelay: "420ms" }}
            >
              {HERO.standfirst}
            </p>

            <div
              className="d3-rise mt-7 flex flex-wrap items-center gap-x-4 gap-y-3"
              style={{ animationDelay: "520ms" }}
            >
              <D3Cta href="#reserve" location="hero-primary">
                {HERO.ctaPrimary}
              </D3Cta>
              <D3Cta href="#pricing" location="hero-secondary" variant="ghost">
                {HERO.ctaSecondary}
              </D3Cta>
              <p className="d3-tag text-[0.5625rem] text-[var(--ink-3)]">{HERO.ctaNote}</p>
            </div>
          </div>

          {/* --- lead time, as two loads on one scale ---------------------- */}
          <div
            className="d3-rise max-w-[26rem] border-l border-[var(--rule-strong)] pl-5"
            style={{ animationDelay: "600ms" }}
          >
            <p className="d3-tag text-[var(--ink-3)]">Time to capacity</p>
            <div className="mt-3 space-y-3">
              {[
                { label: PRICE_POSITION.leadClaim.ours, w: "16%", tone: "var(--accent)", who: "Here" },
                {
                  label: PRICE_POSITION.leadClaim.theirs,
                  w: "100%",
                  tone: "var(--ink-3)",
                  who: "Hyperscaler",
                },
              ].map((b) => (
                <div key={b.who}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="d3-tag text-[0.5625rem] text-[var(--ink-3)]">{b.who}</span>
                    <span
                      className="d3-figure text-[0.8125rem]"
                      style={{ color: b.tone }}
                    >
                      {b.label}
                    </span>
                  </div>
                  <div className="mt-1.5 h-[3px] w-full bg-[var(--rule)]">
                    <div
                      className="d3-draw h-full origin-left"
                      style={{
                        width: b.w,
                        background: b.tone,
                        animationDelay: "700ms",
                        boxShadow: b.tone.includes("accent") ? "0 0 14px -2px var(--accent)" : undefined,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="d3-body mt-3 max-w-[34ch] text-[0.75rem] text-[var(--ink-3)] text-pretty">
              {PRICE_POSITION.leadClaim.theirsQualifier}
            </p>
          </div>
        </div>
      </div>

      {/* --- the one-line strip ------------------------------------------- */}
      <div className="relative z-10 border-y border-[var(--rule-strong)] bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-sm">
        <div className="d3-shell">
          <dl className="grid grid-cols-2 md:grid-cols-4">
            {[
              { k: "Fleet", v: `${FLEET.total}`, u: "× B300", d: `${FLEET.nodes} × ${FLEET.gpusPerNode}-GPU nodes` },
              { k: "Per node", v: NODE.hbmGbFormatted, u: "GB HBM3e", d: NODE.domain },
              { k: "Facility load", v: POWER.loadKw, u: "kW", d: POWER.service },
              { k: "On-demand", v: RATE.display, u: RATE.unitShort, d: `Online ${SITE.availabilityShort}` },
            ].map((cell, i) => (
              <div
                key={cell.k}
                // Rules between cells only: a leading rule on the first cell of
                // a row would read as an edge the container does not have.
                className={`relative border-[var(--rule)] py-5 ${
                  i % 2 === 1 ? "border-l pl-4" : ""
                } ${i > 0 ? "md:border-l md:pl-4" : "md:border-l-0 md:pl-0"}`}
              >
                {/* connector: the tap line joining this cell to the bus above */}
                <span
                  aria-hidden
                  className="absolute -top-px left-0 h-px w-8"
                  style={{ background: "var(--accent)" }}
                />
                <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{cell.k}</dt>
                <dd className="mt-2 flex items-baseline gap-1.5">
                  <span className="d3-figure text-[clamp(1.375rem,3vw,2rem)] leading-none text-[var(--ink)]">
                    {cell.v}
                  </span>
                  <span className="d3-tag text-[0.5625rem] text-[var(--ink-3)]">{cell.u}</span>
                </dd>
                <dd className="d3-body mt-2 text-[0.75rem] leading-snug text-[var(--ink-3)]">
                  {cell.d}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
