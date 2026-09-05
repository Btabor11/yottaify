import type { CSSProperties } from "react";
import { SITE } from "@/config/site";
import { DEVICE_VIEW, HERO, PRICE_POSITION, STORY_OPENING, source, formatAsOfShort } from "@/content";
import { D3Cta } from "./Cta";
import { HeroSequence } from "./hero/HeroSequence";
import { FRAMES, stillPath } from "./hero/sequence";

/**
 * Chapter zero, in two movements.
 *
 * First the device: one B300 module taken apart, every part labelled, closed
 * again by the scroll, lit from inside, and handed to the particle field the
 * rest of the story is drawn with. Then the copy: the headline as real text,
 * each block arriving as the reader reaches it.
 *
 * Everything here is server-rendered and complete without a script. The
 * exploded still is the LCP image with its box reserved by aspect ratio; the
 * labels, the title and the copy are plain text in the document. The frame
 * only pins, and the still only gives way to the canvas, once HeroSequence
 * has decided the reader wants motion. Under reduced motion it never does,
 * and the page reads top to bottom as a figure and a headline.
 *
 * One line of the headline's three is set in the voice face: the promise
 * ("in days,") against the two stencilled facts around it. That contrast is
 * the whole typographic idea of the direction, stated once at full size.
 */
export function Hero() {
  const wide = Math.max(...FRAMES.sizes);
  const narrow = Math.min(...FRAMES.sizes);
  // The leader runs from the part to the label's edge, in permille of the box.
  const labelEdge = (side: "left" | "right") => (side === "left" ? 235 : 765);
  let reveal = 0;
  const next = () => ({ "--i": reveal++ } as CSSProperties);

  return (
    <section
      className="d3-hero"
      data-hero-host
      aria-labelledby="hero-heading"
      style={{ "--ar": FRAMES.aspect } as CSSProperties}
    >
      {/* ================================================================
          I. The device
          ================================================================ */}
      <div className="d3-hero-pin" data-hero-pin>
        <div className="d3-hero-frame">
          <div className="d3-hero-ground" aria-hidden />
          <div className="d3-shell d3-hero-grid">
            <p className="d3-hero-eyebrow d3-tag d3-rise flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[var(--ink-2)]">
              <span className="d3-pip d3-blink text-[var(--live)]">{HERO.status}</span>
              <span aria-hidden className="text-[var(--rule-strong)]">/</span>
              <span className="max-w-[34ch] leading-relaxed sm:max-w-none">{DEVICE_VIEW.eyebrow}</span>
            </p>

            <div className="d3-hero-titles">
              <p className="d3-display d3-hero-title d3-hero-title-apart d3-charge">
                {DEVICE_VIEW.titleApart.map((line) => (
                  <span key={line} className="d3-line">
                    {line}
                  </span>
                ))}
              </p>
              <p className="d3-display d3-hero-title d3-hero-title-load" aria-hidden>
                {DEVICE_VIEW.titleLoad.map((line) => (
                  <span key={line} className="d3-line">
                    {line}
                  </span>
                ))}
              </p>
              <p
                className="d3-body d3-hero-lede d3-rise text-[0.9375rem] leading-[1.6] text-[var(--ink-2)] text-pretty md:text-[1rem]"
                style={{ animationDelay: "320ms" }}
              >
                {DEVICE_VIEW.lede}
              </p>
            </div>

            <figure className="d3-hero-figure">
              <div className="d3-hero-device" data-device-box>
                <div className="d3-hero-glow" aria-hidden />
                {/* The still is the resting state and the LCP image; the canvas
                    paints over it once the sequence is live and has a frame.
                    A plain img: the frames are pre-encoded WebP with alpha at
                    their final sizes, and the optimiser would only re-encode. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="d3-hero-still"
                  src={stillPath("exploded", wide)}
                  srcSet={`${stillPath("exploded", narrow)} ${narrow}w, ${stillPath("exploded", wide)} ${wide}w`}
                  sizes="(min-width: 64rem) 58vw, 100vw"
                  width={wide}
                  height={FRAMES.heights[String(wide)]}
                  alt={DEVICE_VIEW.alt}
                  fetchPriority="high"
                  decoding="async"
                />
                <canvas className="d3-hero-canvas" aria-hidden />

                <svg className="d3-hero-leaders" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
                  {DEVICE_VIEW.callouts.map((c, i) => (
                    <path
                      key={c.id}
                      pathLength={1}
                      d={`M ${c.anchor[0] * 1000} ${c.anchor[1] * 1000} L ${labelEdge(c.side)} ${c.anchor[1] * 1000}`}
                      style={{ "--i": i } as CSSProperties}
                    />
                  ))}
                </svg>
                {DEVICE_VIEW.callouts.map((c, i) => (
                  <span
                    key={c.id}
                    className="d3-hero-dot"
                    aria-hidden
                    style={{ left: `${c.anchor[0] * 100}%`, top: `${c.anchor[1] * 100}%`, "--i": i } as CSSProperties}
                  />
                ))}
                {/* Labels are the accessible names of the parts; on narrow
                    screens the legend below carries them instead, so the same
                    text is never in the document twice for a reader. */}
                <ul className="contents" aria-label={DEVICE_VIEW.legendWord}>
                  {DEVICE_VIEW.callouts.map((c, i) => (
                    <li
                      key={c.id}
                      className="d3-hero-callout"
                      data-side={c.side}
                      style={{ top: `${c.anchor[1] * 100}%`, "--i": i } as CSSProperties}
                    >
                      <span className="d3-tag">{c.label}</span>
                      <span className="d3-hero-callout-detail">{c.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ol className="d3-hero-legend d3-tag" aria-label={DEVICE_VIEW.legendWord}>
                {DEVICE_VIEW.callouts.map((c, i) => (
                  <li key={c.id}>
                    <span className="d3-figure">{String(i + 1).padStart(2, "0")}</span>
                    <span className="d3-hero-legend-part">{c.label}</span>
                    <span className="d3-hero-callout-detail">{c.detail}</span>
                  </li>
                ))}
              </ol>

              <figcaption className="d3-hero-caption d3-tag">{DEVICE_VIEW.caption}</figcaption>
            </figure>

            <div className="d3-hero-foot">
              <p className="d3-hero-hint d3-tag d3-rise" style={{ animationDelay: "900ms" }}>
                <span className="d3-hero-hint-tick" aria-hidden />
                {DEVICE_VIEW.hint}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          II. The copy
          ================================================================ */}
      <div className="d3-chapter d3-hero-copy" data-chapter="00" data-shape={STORY_OPENING.shape}>
        <div className="d3-shell">
          <p className="d3-mark d3-tag text-[var(--live)]" data-hp-reveal style={next()}>
            <span className="text-[var(--ink-2)]">{HERO.eyebrow}</span>
          </p>

          {/* --- headline ------------------------------------------------- */}
          <h1 id="hero-heading" className="mt-8 md:mt-7">
            {HERO.headlineLines.map((line, i) => {
              const voice = i === STORY_OPENING.voiceLineIndex;
              return (
                <span
                  key={line}
                  className={
                    voice
                      ? "d3-voice block text-[clamp(3rem,13.5vw,9rem)] text-[var(--live)]"
                      : "d3-display block text-[clamp(3.25rem,14.5vw,9.75rem)]"
                  }
                  data-hp-reveal
                  data-hp-charge={voice ? undefined : ""}
                  style={next()}
                >
                  {line}
                </span>
              );
            })}
          </h1>

          {/* --- standfirst, CTAs, lead time ------------------------------ */}
          <div className="mt-10 grid gap-x-12 gap-y-12 md:mt-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:items-end">
            <div>
              <p
                className="d3-body max-w-[48ch] text-[0.9375rem] leading-[1.7] text-[var(--ink-2)] text-pretty md:text-[1.0625rem] md:leading-[1.6]"
                data-hp-reveal
                style={next()}
              >
                {HERO.standfirst}
              </p>
              <div
                className="mt-9 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-3 md:mt-7"
                data-hp-reveal
                style={next()}
              >
                <D3Cta href="#reserve" location="hero-primary" className="w-full sm:w-auto">
                  {HERO.ctaPrimary}
                </D3Cta>
                <D3Cta href="#pricing" location="hero-secondary" variant="ghost" className="w-full sm:w-auto">
                  {HERO.ctaSecondary}
                </D3Cta>
                <p className="d3-tag mt-1 text-[0.5625rem] text-[var(--ink-3)] sm:mt-0">{HERO.ctaNote}</p>
              </div>
            </div>

            <div
              className="max-w-[26rem] border-l border-[var(--rule-strong)] pl-5 lg:justify-self-end"
              data-hp-reveal
              style={next()}
            >
              <p className="d3-tag text-[var(--ink-3)]">{PRICE_POSITION.leadClaim.title}</p>
              <div className="mt-4 space-y-4 md:mt-3 md:space-y-3">
                {[
                  { who: PRICE_POSITION.leadClaim.oursLabel, label: PRICE_POSITION.leadClaim.ours, w: "14%", live: true },
                  { who: PRICE_POSITION.leadClaim.theirsLabel, label: PRICE_POSITION.leadClaim.theirs, w: "100%", live: false },
                ].map((b) => (
                  <div key={b.who}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="d3-tag text-[0.5625rem] text-[var(--ink-3)]">{b.who}</span>
                      <span
                        className="d3-figure text-[0.8125rem]"
                        style={{ color: b.live ? "var(--live)" : "var(--ink-3)" }}
                      >
                        {b.label}
                      </span>
                    </div>
                    <div className="mt-1.5 h-[3px] w-full bg-[var(--rule)]">
                      <div
                        className="h-full origin-left"
                        style={{
                          width: b.w,
                          background: b.live ? "var(--live)" : "var(--ink-3)",
                          boxShadow: b.live ? "0 0 14px -2px var(--live)" : undefined,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="d3-body mt-4 max-w-[34ch] text-[0.75rem] leading-relaxed text-[var(--ink-3)] text-pretty md:mt-3">
                {PRICE_POSITION.leadClaim.theirsQualifier}
              </p>
            </div>
          </div>

          {/* --- title block: the four facts ------------------------------- */}
          <dl className="d3-titleblock mt-14 md:mt-10" data-hp-reveal style={next()}>
            {HERO.facts.map((cell) => {
              const src = source(cell.sourceId);
              return (
                <div key={cell.label}>
                  <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{cell.label}</dt>
                  <dd className="d3-figure mt-2 text-[clamp(1.125rem,2.2vw,1.5rem)] leading-none text-[var(--ink)] md:mt-1.5">
                    {cell.value}
                  </dd>
                  <dd className="d3-body mt-2 text-[0.75rem] leading-snug text-[var(--ink-3)] md:mt-1.5">
                    {cell.detail}
                    <span className="d3-tag mt-1.5 block text-[0.5rem] text-[var(--ink-3)] md:ml-2 md:mt-0 md:inline">
                      {formatAsOfShort(src.accessed)}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="d3-tag mt-5 text-[0.5rem] leading-relaxed text-[var(--ink-3)] md:mt-3 md:text-[0.4375rem]">
            {STORY_OPENING.stageLabel} · {SITE.location.region}
          </p>
        </div>
      </div>

      <HeroSequence />
    </section>
  );
}
