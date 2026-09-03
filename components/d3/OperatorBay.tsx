import { SITE } from "@/config/site";
import {
  SECTIONS,
  FACILITY,
  POWER,
  FLEET,
  ACCESS,
  CONTRACT,
  TIMELINE,
  CANDOUR,
  formatAsOf,
} from "@/content";
import { Bay } from "./Bay";
import { OneLine } from "./OneLine";

/**
 * Bay 04 — the operator, and the honest section.
 *
 * The candour block is the loudest typography on the page after the hero. In
 * this direction that is the argument: saying "we are new and it is priced in"
 * at full volume reads as confidence, where the same sentence set small reads
 * as a disclaimer someone was made to include.
 */
export function OperatorBay() {
  return (
    <section
      id="operator"
      className="relative scroll-mt-24 border-t border-[var(--rule-strong)] bg-[var(--surface)] py-16 md:py-24"
    >
      <div className="d3-shell">
        <Bay
          index={SECTIONS.operator.index}
          eyebrow={SECTIONS.operator.eyebrow}
          heading={SECTIONS.operator.heading}
          standfirst={SECTIONS.operator.standfirst}
          headingId="operator-heading"
        />

        <div className="d3-bus">
          <div />
          <div>
            {/* --- facility ---------------------------------------------- */}
            <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
              <OneLine />

              <div>
                {/* Heading and body must not both open with "the building is
                    ours" — the paragraph already does. */}
                <h3
                  className="d3-display max-w-[20ch] text-[clamp(1.5rem,3.6vw,2.75rem)] text-balance"
                  data-load
                  data-load-from="74"
                >
                  {FACILITY.advantage}. {FACILITY.ownership}.
                </h3>
                <p
                  className="d3-body mt-5 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty"
                  data-r
                >
                  {FACILITY.advantageDetail}
                </p>

                <dl className="mt-9 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
                  {[
                    ["Fleet", FLEET.shape],
                    ["Power", POWER.summary],
                    ["Access", `${ACCESS.model} — ${ACCESS.interface}`],
                    ["Contract", `${CONTRACT.model}, ${CONTRACT.termYears}`],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-[var(--surface)] px-5 py-4">
                      <dt className="d3-tag text-[0.4375rem] text-[var(--accent)]">{k}</dt>
                      <dd className="d3-body mt-2 text-[0.8125rem] leading-snug text-[var(--ink-2)] text-pretty">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* --- schedule --------------------------------------------- */}
            <div className="mt-16 md:mt-20">
              <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--rule-strong)] pb-2">
                <p className="d3-tag text-[var(--ink-3)]">04.1 — Schedule</p>
                <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">
                  Target <span className="d3-figure text-[var(--accent)]">{TIMELINE.target}</span>
                </p>
              </div>

              <ol className="mt-4 grid gap-px bg-[var(--rule)] md:grid-cols-4" data-r-group>
                {TIMELINE.phases.map((phase, i) => {
                  const done = i < 2;
                  return (
                    <li key={phase.id} className="bg-[var(--surface)] p-5">
                      <p
                        className="d3-pip text-[0.4375rem]"
                        style={{ color: done ? "var(--accent)" : "var(--ink-3)" }}
                      >
                        {String(i + 1).padStart(2, "0")} · {phase.label}
                      </p>
                      <p
                        className="d3-display mt-3 text-[1.25rem]"
                        style={{
                          ["--wdth" as string]: 108,
                          color: done ? "var(--ink)" : "var(--ink-2)",
                        }}
                      >
                        {phase.status}
                      </p>
                      <p className="d3-body mt-2 text-[0.75rem] leading-snug text-[var(--ink-3)] text-pretty">
                        {phase.detail}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* --- the honest section ----------------------------------- */}
            <div className="mt-16 md:mt-24">
              <p className="d3-tag text-[var(--caution)]">{CANDOUR.eyebrow}</p>
              <h3
                className="d3-display mt-4 max-w-[22ch] text-[clamp(1.875rem,6vw,4.5rem)] text-balance"
                data-load
                data-load-from="66"
              >
                {CANDOUR.heading}
              </h3>

              <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
                <div className="space-y-4" data-r-group>
                  {CANDOUR.paragraphs.map((p) => (
                    <p
                      key={p}
                      className="d3-body max-w-[58ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty md:text-[1rem]"
                    >
                      {p}
                    </p>
                  ))}
                </div>

                <div className="flex flex-col gap-7">
                  <div>
                    <p className="d3-tag border-b border-[var(--accent)] pb-2 text-[var(--accent)]">
                      What is real
                    </p>
                    <dl className="mt-3">
                      {CANDOUR.real.map((item) => (
                        <div
                          key={item.label}
                          className="border-b border-[var(--rule)] py-2.5 last:border-0"
                        >
                          <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">
                            {item.label}
                          </dt>
                          <dd className="d3-body mt-1 text-[0.8125rem] leading-snug text-[var(--ink-2)] text-pretty">
                            {item.detail}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div>
                    <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                      What we do not have
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                      {CANDOUR.notReal.map((item) => (
                        <li
                          key={item}
                          className="d3-tag text-[0.5rem] text-[var(--ink-3)] line-through decoration-[var(--caution)]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="d3-body mt-3 text-[0.75rem] text-[var(--ink-3)] text-pretty">
                      Named rather than omitted, so none of it turns up as a surprise in a
                      procurement review.
                    </p>
                  </div>
                </div>
              </div>

              <p className="d3-tag mt-9 text-[0.4375rem] text-[var(--ink-3)]">
                {SITE.name} · {SITE.location.region} · Stated {formatAsOf(SITE.pricingAsOf)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
