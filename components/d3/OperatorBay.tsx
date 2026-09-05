import { SITE } from "@/config/site";
import { SECTIONS, FACILITY, POWER, FLEET, ACCESS, CONTRACT, TIMELINE, CANDOUR, ABOUT, TEAM, NAME_ORIGIN, formatAsOf } from "@/content";
import { Bay } from "./Bay";
import { OneLine } from "./OneLine";

/**
 * Sheet 03 — the operator, and the honest section.
 *
 * The candour block is set in the voice face at the largest size the italic
 * appears anywhere on the page. Saying "we are new and it is priced in" in
 * the first person, at full volume, reads as confidence; the same sentence
 * set small reads as a disclaimer someone was made to include.
 */
export function OperatorBay() {
  return (
    <section id="operator" className="relative scroll-mt-24 border-t border-[var(--rule-strong)] py-16 md:py-24">
      <div aria-hidden className="d3-contours pointer-events-none absolute inset-0 opacity-60" />
      <div className="d3-shell relative">
        <Bay
          index={SECTIONS.operator.index}
          eyebrow={SECTIONS.operator.eyebrow}
          heading={SECTIONS.operator.heading}
          standfirst={SECTIONS.operator.standfirst}
          headingId="operator-heading"
        />

        {/* --- facility ------------------------------------------------- */}
        <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div data-r>
            <OneLine />
          </div>

          <div>
            <h3
              className="d3-display max-w-[7.7em] text-[clamp(2rem,5vw,4rem)] text-balance"
              data-load
              data-load-from="300"
            >
              {FACILITY.advantage}. {FACILITY.ownership}.
            </h3>
            <p className="d3-body mt-5 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
              {FACILITY.advantageDetail}
            </p>

            <dl className="mt-9 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-2" data-r-group>
              {[
                ["Fleet", FLEET.shape],
                ["Power", POWER.summary],
                ["Access", `${ACCESS.model} — ${ACCESS.interface}`],
                ["Contract", `${CONTRACT.model}, ${CONTRACT.termYears}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-[var(--surface)] px-5 py-4">
                  <dt className="d3-tag text-[0.4375rem] text-[var(--accent)]">{k}</dt>
                  <dd className="d3-body mt-2 text-[0.8125rem] leading-snug text-[var(--ink-2)] text-pretty">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* --- who we are ------------------------------------------------ */}
        <div className="mt-16 md:mt-24">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
            {SECTIONS.operator.index}.1 — {ABOUT.eyebrow}
          </p>
          <div className="mt-6 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h3 className="d3-display max-w-[8.5em] text-[clamp(1.75rem,4.2vw,3.25rem)] text-balance md:max-w-[6.75em]" data-load data-load-from="300">
                {ABOUT.heading}
              </h3>
              <p className="d3-body mt-4 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                {ABOUT.body}
              </p>
            </div>
            <ol className="grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-2" data-r-group>
              {ABOUT.principles.map((p, i) => (
                <li key={p.label} className="bg-[var(--surface)] p-5">
                  <p className="d3-figure text-[0.625rem] text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</p>
                  <p className="d3-display mt-2 text-[1.25rem]" style={{ ["--wght" as string]: 720 }}>
                    {p.label}
                  </p>
                  <p className="d3-body mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
          {TEAM.length > 0 && (
            <div className="mt-10">
              <p className="d3-tag text-[var(--ink-3)]">{ABOUT.teamHeading}</p>
              <ul className="mt-4 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] md:grid-cols-3">
                {TEAM.map((m) => (
                  <li key={m.name} className="bg-[var(--surface)] p-5">
                    <p className="d3-body text-[0.9375rem] font-medium text-[var(--ink)]">{m.name}</p>
                    <p className="d3-tag mt-1 text-[0.5rem] text-[var(--accent)]">{m.role}</p>
                    <p className="d3-body mt-3 text-[0.8125rem] text-[var(--ink-2)] text-pretty">{m.bio}</p>
                    {m.linkedin && (
                      <a href={m.linkedin} className="d3-link d3-tag mt-3 inline-block text-[0.5rem]" rel="noopener noreferrer" target="_blank">
                        LinkedIn ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* --- the name -------------------------------------------------- */}
        <div id="name" className="mt-16 scroll-mt-24 md:mt-24">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
            {SECTIONS.operator.index}.2 — {NAME_ORIGIN.eyebrow}
          </p>
          <div className="mt-6 max-w-[54ch]">
            <h3
              id="name-heading"
              className="d3-display max-w-[6.75em] text-[clamp(1.75rem,4.2vw,3.25rem)] text-balance"
              data-load
              data-load-from="300"
            >
              {NAME_ORIGIN.heading}
            </h3>
            <div className="mt-4 space-y-4">
              {NAME_ORIGIN.paragraphs.map((p) =>
                typeof p === "string" ? (
                  <p key={p} className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                    {p}
                  </p>
                ) : (
                  <p key={p.after} className="d3-body text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                    {p.before}
                    {p.base}
                    <sup>{p.exp}</sup>
                    {p.after}
                  </p>
                ),
              )}
            </div>
          </div>
        </div>

        {/* --- schedule -------------------------------------------------- */}
        <div className="mt-16 md:mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--rule-strong)] pb-2">
            <p className="d3-tag text-[var(--ink-3)]">{SECTIONS.operator.index}.3 — Schedule</p>
            <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">
              Target <span className="d3-figure text-[var(--accent)]">{TIMELINE.target}</span>
            </p>
          </div>

          <ol className="mt-4 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] md:grid-cols-4" data-r-group>
            {TIMELINE.phases.map((phase, i) => {
              const done = i < 2;
              return (
                <li key={phase.id} className="relative bg-[var(--surface)] p-5">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: done ? "var(--accent)" : "var(--rule-strong)" }}
                  />
                  <p className="d3-pip text-[0.4375rem]" style={{ color: done ? "var(--accent)" : "var(--ink-3)" }}>
                    {String(i + 1).padStart(2, "0")} · {phase.label}
                  </p>
                  <p
                    className="d3-display mt-3 text-[1.625rem]"
                    style={{ ["--wght" as string]: 720, color: done ? "var(--ink)" : "var(--ink-2)" }}
                  >
                    {phase.status}
                  </p>
                  <p className="d3-body mt-2 text-[0.75rem] leading-snug text-[var(--ink-3)] text-pretty">{phase.detail}</p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* --- the honest section ---------------------------------------- */}
        <div className="mt-16 border-t border-[var(--rule-strong)] pt-14 md:mt-24 md:pt-20">
          <p className="d3-mark d3-tag text-[var(--caution)]">{CANDOUR.eyebrow}</p>
          <h3
            className="d3-voice mt-6 max-w-[18ch] text-[clamp(2.75rem,8vw,7.5rem)] text-[var(--ink)] text-balance"
            data-r
          >
            {CANDOUR.heading}
          </h3>

          <div className="mt-10 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div className="space-y-5" data-r-group>
              {CANDOUR.paragraphs.map((p) => (
                <p key={p} className="d3-body max-w-[60ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty md:text-[1.0625rem]">
                  {p}
                </p>
              ))}
            </div>

            <div className="flex flex-col gap-7">
              <div>
                <p className="d3-tag border-b border-[var(--accent)] pb-2 text-[var(--accent)]">What is real</p>
                <dl className="mt-3">
                  {CANDOUR.real.map((item) => (
                    <div key={item.label} className="border-b border-[var(--rule)] py-2.5 last:border-0">
                      <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">{item.label}</dt>
                      <dd className="d3-body mt-1 text-[0.8125rem] leading-snug text-[var(--ink-2)] text-pretty">
                        {item.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">What we do not have</p>
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-3 md:mt-3 md:gap-x-3 md:gap-y-2">
                  {CANDOUR.notReal.map((item) => (
                    <li key={item} className="d3-tag text-[0.5rem] text-[var(--ink-3)] line-through decoration-[var(--caution)]">
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="d3-body mt-3 text-[0.75rem] text-[var(--ink-3)] text-pretty">
                  Named rather than omitted, so none of it turns up as a surprise in a procurement review.
                </p>
              </div>
            </div>
          </div>

          <p className="d3-tag mt-9 text-[0.4375rem] text-[var(--ink-3)]">
            {SITE.name} · {SITE.location.region} · Stated {formatAsOf(SITE.pricingAsOf)}
          </p>
        </div>
      </div>
    </section>
  );
}
