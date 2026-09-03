import { SITE } from "@/config/site";
import { SECTIONS, FACILITY, POWER, TIMELINE, CANDOUR, CONTRACT, FLEET } from "@/content";
import { SectionHead } from "./SectionHead";
import { FacilityPlan } from "./FacilityPlan";

/**
 * Where a competitor puts social proof, this puts specificity: the drawing of
 * the building, the load at the meter, the four things that are real and the
 * five things that are not.
 */
export function OperatorSection() {
  return (
    <section id="operator" className="d1-shell scroll-mt-16 py-20 md:py-28">
      <SectionHead
        index={SECTIONS.operator.index}
        eyebrow={SECTIONS.operator.eyebrow}
        heading={SECTIONS.operator.heading}
        standfirst={SECTIONS.operator.standfirst}
        id="operator-heading"
      />

      {/* --- FACILITY ----------------------------------------------------- */}
      <div className="grid gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <div>
          <p className="d1-label text-[var(--accent)]">The cost advantage, stated plainly</p>
          <h3
            data-reveal
            className="d1-display-loose mt-4 max-w-[22ch] text-[clamp(1.5rem,3.4vw,2.5rem)] text-balance"
          >
            {FACILITY.advantage}. The building is ours.
          </h3>
          <p data-reveal className="d1-body mt-5 max-w-[52ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
            {FACILITY.advantageDetail}
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-px border border-[var(--rule-strong)] bg-[var(--rule)]">
            {[
              ["Site", FACILITY.kind],
              ["Region", `${FACILITY.region}, ${SITE.location.country}`],
              ["Ownership", FACILITY.ownership],
              ["Cooling", FLEET.cooling],
              ["Facility load", `~${POWER.loadKw} kW`],
              ["Service", POWER.service],
            ].map(([k, v]) => (
              <div key={k} className="bg-[var(--bg)] px-4 py-3.5">
                <dt className="d1-label text-[var(--ink-3)]">{k}</dt>
                <dd className="d1-figure mt-1.5 text-[0.8125rem] leading-snug text-[var(--ink)]">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure data-reveal className="d1-ticked border border-[var(--rule-strong)] bg-[var(--surface)]/40">
          <div className="flex items-baseline justify-between gap-3 border-b border-[var(--rule)] px-4 py-2.5">
            <figcaption className="d1-label text-[var(--ink-2)]">Facility — plan</figcaption>
            <span className="d1-label text-[var(--ink-3)]">Drawn, not photographed</span>
          </div>
          <FacilityPlan className="h-auto w-full" />
          <p className="d1-label border-t border-[var(--rule)] px-4 py-3 normal-case tracking-[0.03em] text-[var(--ink-3)]">
            There is no photograph of the building on this page because we do not have one worth
            publishing yet, and a stock photograph of someone else&rsquo;s hall would be borrowing
            credibility we have not earned.
          </p>
        </figure>
      </div>

      {/* --- TIMELINE ----------------------------------------------------- */}
      <div className="mt-20 md:mt-24">
        <div className="d1-sechead">
          <span className="d1-figure text-[0.625rem] text-[var(--ink-3)]">04.1</span>
          <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
          <span className="d1-label text-[var(--ink-3)]">Timeline to {SITE.availability}</span>
        </div>

        <ol data-reveal-group className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
          {TIMELINE.phases.map((phase, i) => {
            const last = i === TIMELINE.phases.length - 1;
            return (
              <li key={phase.id} className="bg-[var(--bg)] p-5 md:p-6">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: last ? "var(--accent)" : "var(--ink-3)" }}
                  />
                  <span className="d1-label text-[var(--ink-3)]">{phase.label}</span>
                </div>
                <p
                  className="d1-figure mt-3 text-[1.0625rem] leading-tight"
                  style={{ color: last ? "var(--accent)" : "var(--ink)" }}
                >
                  {phase.status}
                </p>
                <p className="d1-body mt-3 text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                  {phase.detail}
                </p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* --- CONTRACT ----------------------------------------------------- */}
      <div className="mt-20 md:mt-24">
        <div className="d1-sechead">
          <span className="d1-figure text-[0.625rem] text-[var(--ink-3)]">04.2</span>
          <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
          <span className="d1-label text-[var(--ink-3)]">Contract model</span>
        </div>
        <div className="mt-6 grid gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          <h3 data-reveal className="d1-display-loose text-[clamp(1.375rem,3vw,2rem)] text-balance">
            {CONTRACT.headline}
          </h3>
          <p data-reveal className="d1-body max-w-[58ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
            {CONTRACT.body}
          </p>
        </div>
      </div>

      {/* --- CANDOUR ------------------------------------------------------ */}
      <div
        data-reveal
        className="d1-ticked mt-20 border border-[var(--rule-strong)] md:mt-24"
        style={{ background: "color-mix(in oklab, var(--caution) 3%, var(--surface))" }}
      >
        <div className="border-b border-[var(--rule-strong)] px-6 py-3 md:px-10">
          <p className="d1-label" style={{ color: "var(--caution)" }}>
            {CANDOUR.eyebrow}
          </p>
        </div>

        <div className="grid gap-x-14 gap-y-10 px-6 py-10 md:px-10 md:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div>
            <h3 className="d1-display max-w-[22ch] text-[clamp(1.75rem,5vw,3.25rem)] text-balance">
              {CANDOUR.heading}
            </h3>
            <div className="mt-7 max-w-[58ch] space-y-5">
              {CANDOUR.paragraphs.map((p) => (
                <p key={p} className="d1-body text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                  {p}
                </p>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <p className="d1-label border-b border-[var(--rule-strong)] pb-2.5 text-[var(--accent)]">
                What is real
              </p>
              <dl className="mt-4 space-y-3.5">
                {CANDOUR.real.map((item) => (
                  <div key={item.label}>
                    <dt className="d1-label flex items-center gap-2 text-[var(--ink)]">
                      <span aria-hidden style={{ color: "var(--accent)" }}>
                        ✓
                      </span>
                      {item.label}
                    </dt>
                    <dd className="d1-body mt-1 pl-5 text-[0.8125rem] text-[var(--ink-2)]">
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="d1-label border-b border-[var(--rule-strong)] pb-2.5 text-[var(--ink-3)]">
                What we do not have
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {CANDOUR.notReal.map((item) => (
                  <li
                    key={item}
                    className="d1-label border border-[var(--rule-strong)] px-2 py-1 text-[var(--ink-3)] line-through decoration-[var(--rule-strong)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
