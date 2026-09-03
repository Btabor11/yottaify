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
import { Chapter } from "./Chapter";
import { Cite } from "./Cite";
import { Elevation } from "./Elevation";
import { Set, Rule } from "./Reveal";

/**
 * Chapter 04 — operator credibility, set as a signed statement plus a
 * colophon. The candour block is typeset as the leader of a letter (drop
 * initial, wide measure, ranged-left rag) because a letter is the one form
 * where "we are new" reads as authorship rather than as a disclaimer.
 */
export function Colophon() {
  return (
    <section id="operator" className="scroll-mt-28 bg-[var(--bg)]">
      <div className="d2-shell py-16 md:py-24">
        <Chapter
          index={SECTIONS.operator.index}
          eyebrow={SECTIONS.operator.eyebrow}
          heading={
            <>
              Who runs this, <em>and where it sits</em>
            </>
          }
          standfirst={SECTIONS.operator.standfirst}
        />

        {/* --- the letter ------------------------------------------------- */}
        <div className="d2-page">
          <div className="hidden md:block">
            <p className="d2-caps text-[var(--ink-3)]">{CANDOUR.eyebrow}</p>
            <div className="mt-2 h-px bg-[var(--ink)]" />
          </div>

          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
            <Set>
              <h3 className="d2-display text-balance text-[clamp(1.75rem,4vw,2.875rem)] leading-[0.98]">
                {CANDOUR.heading}
              </h3>

              <p className="d2-prose d2-dropcap d2-measure mt-6 text-[1.0625rem] leading-[1.6] text-[var(--ink)] text-pretty">
                {CANDOUR.paragraphs[0]}
              </p>

              {CANDOUR.paragraphs.slice(1).map((p) => (
                <p
                  key={p}
                  className="d2-prose d2-measure mt-4 text-[1.0625rem] leading-[1.6] text-[var(--ink-2)] text-pretty"
                >
                  {p}
                </p>
              ))}

              {/* signature block — a letter has one */}
              <div className="d2-measure mt-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-[var(--ink)] pt-4">
                <div>
                  <p className="d2-display text-[1.375rem] leading-none">{SITE.name}</p>
                  <p className="d2-caps mt-1.5 text-[var(--ink-3)]">
                    {SITE.location.region} · {SITE.email.general}
                  </p>
                </div>
                <p className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
                  Stated {formatAsOf(SITE.pricingAsOf)}
                </p>
              </div>
            </Set>

            {/* --- what is real, what is not ------------------------------ */}
            <Set delay={0.06} className="flex flex-col gap-8">
              <div className="border border-[var(--ink)] bg-[var(--surface)]">
                <p className="d2-caps border-b border-[var(--ink)] px-4 py-2 text-[var(--ink)]">
                  What is real
                </p>
                <dl className="px-4 py-2">
                  {CANDOUR.real.map((item) => (
                    <div key={item.label} className="border-b border-[var(--rule)] py-2.5 last:border-0">
                      <dt className="d2-caps text-[0.5625rem] text-[var(--accent)]">{item.label}</dt>
                      <dd className="d2-prose mt-1 text-[0.875rem] leading-snug text-[var(--ink-2)] text-pretty">
                        {item.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <p className="d2-caps border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                  What we do not have
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {CANDOUR.notReal.map((item) => (
                    <li
                      key={item}
                      className="d2-prose text-[0.875rem] text-[var(--ink-3)] line-through decoration-[var(--caution)] decoration-1"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="d2-prose mt-3 text-[0.8125rem] text-[var(--ink-3)] text-pretty">
                  Named rather than omitted, so none of it turns up as a surprise in a procurement
                  review.
                </p>
              </div>
            </Set>
          </div>
        </div>

        <Rule className="d2-rule my-14" />

        {/* --- the facility ---------------------------------------------- */}
        <div className="d2-page">
          <div className="hidden md:block">
            <p className="d2-caps text-[var(--ink-3)]">The facility</p>
            <div className="mt-2 h-px bg-[var(--ink)]" />
          </div>

          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
            <Set>
              <Elevation />
            </Set>

            <Set delay={0.06}>
              <h3 className="d2-display text-balance text-[clamp(1.5rem,3vw,2.125rem)] leading-[1.04]">
                {FACILITY.advantage} — {FACILITY.kind.toLowerCase()} in the{" "}
                {SITE.location.region}.
              </h3>
              <p className="d2-prose d2-measure mt-4 text-[1rem] leading-[1.6] text-[var(--ink-2)] text-pretty">
                {FACILITY.advantageDetail}
                <Cite sourceId={FACILITY.sourceId} />
              </p>

              <dl className="mt-7 border-t border-[var(--ink)]">
                {[
                  ["Building", `${FACILITY.kind}, ${FACILITY.ownership.toLowerCase()}`],
                  ["Region", SITE.location.region],
                  ["Cooling", `${FLEET.cooling}, sized for ${FLEET.total} units`],
                  ["Service", POWER.service],
                  ["Load at 16", `~${POWER.loadKw} kW at the meter`],
                  ["Access", `${ACCESS.model} — ${ACCESS.interface}`],
                  ["Contract", `${CONTRACT.model}, ${CONTRACT.termYears}`],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-4 border-b border-[var(--rule)] py-2.5"
                  >
                    <dt className="d2-caps text-[0.5625rem] text-[var(--ink-3)]">{k}</dt>
                    <dd className="d2-prose text-[0.9375rem] text-[var(--ink)]">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* what is not included — stated here, not discovered later */}
              <div className="mt-7 border-l-2 border-[var(--caution)] pl-4">
                <p className="d2-caps text-[var(--caution)]">Not included</p>
                <ul className="mt-2 space-y-1">
                  {ACCESS.notIncluded.map((n) => (
                    <li key={n} className="d2-prose text-[0.875rem] text-[var(--ink-2)] text-pretty">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </Set>
          </div>
        </div>

        <Rule className="d2-rule my-14" />

        {/* --- schedule --------------------------------------------------- */}
        <div className="d2-page">
          <div className="hidden md:block">
            <p className="d2-caps text-[var(--ink-3)]">Schedule</p>
            <div className="mt-2 h-px bg-[var(--ink)]" />
          </div>

          <Set>
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--ink)] pb-3">
              <h3 className="d2-display text-[clamp(1.375rem,2.6vw,1.875rem)] leading-none">
                Four milestones, and the two we have finished
              </h3>
              <p className="d2-caps text-[var(--ink-3)]">
                Target <span className="d2-figure text-[var(--accent)]">{TIMELINE.target}</span>
              </p>
            </div>

            <ol className="grid gap-0 md:grid-cols-4 md:gap-x-8">
              {TIMELINE.phases.map((phase, i) => {
                const done = i < 2;
                return (
                  <li
                    key={phase.id}
                    className="border-b border-[var(--rule)] py-5 md:border-b-0 md:border-t-0"
                  >
                    {/* per-column progress mark: filled for finished, hollow for pending */}
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          background: done ? "var(--accent)" : "transparent",
                          boxShadow: done ? "none" : "inset 0 0 0 1px var(--ink-3)",
                        }}
                      />
                      <span className="d2-caps text-[var(--ink-3)]">
                        {String(i + 1).padStart(2, "0")} · {phase.label}
                      </span>
                    </div>
                    <p
                      className="d2-display mt-2 text-[1.5rem] leading-none"
                      style={{ color: done ? "var(--ink)" : "var(--ink-2)" }}
                    >
                      {phase.status}
                    </p>
                    <p className="d2-prose mt-2 text-[0.875rem] leading-snug text-[var(--ink-3)] text-pretty">
                      {phase.detail}
                    </p>
                  </li>
                );
              })}
            </ol>

            <p className="d2-caps mt-6 text-[0.5rem] text-[var(--ink-3)]">
              Source: operator
              <Cite sourceId={TIMELINE.sourceId} />
            </p>
          </Set>
        </div>
      </div>
    </section>
  );
}
