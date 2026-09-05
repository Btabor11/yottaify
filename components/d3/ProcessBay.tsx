import { SECTIONS, PROCESS, PROCESS_COPY, BEFORE_CHECKLIST, SET_ON_THE_CALL } from "@/content";
import { Bay } from "./Bay";

/**
 * Sheet 04 — the process, as a sequence of operations.
 *
 * Three phases, every step with its actor marked, and the timing stated only
 * where one can honestly be stated. Beside it, the eight things to have to
 * hand, and the list of what is set on the call rather than here — named so
 * none of it arrives as a surprise.
 */
export function ProcessBay() {
  return (
    <section id="process" className="relative scroll-mt-24 border-t border-[var(--rule-strong)] py-16 md:py-24">
      <div className="d3-shell relative">
        <Bay
          index={SECTIONS.process.index}
          eyebrow={SECTIONS.process.eyebrow}
          heading={PROCESS_COPY.heading}
          standfirst={PROCESS_COPY.standfirst}
          headingId="process-heading"
          aside={
            <dl className="flex flex-wrap gap-x-5 gap-y-2 border-l border-[var(--rule-strong)] pl-4" data-r>
              {(Object.keys(PROCESS_COPY.actorLabel) as Array<keyof typeof PROCESS_COPY.actorLabel>).map((k) => (
                <div key={k} className="flex items-baseline gap-2">
                  <dt aria-hidden className="d3-actor" data-actor={k} />
                  <dd className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{PROCESS_COPY.actorLabel[k]}</dd>
                </div>
              ))}
            </dl>
          }
        />

        <div className="grid gap-x-14 gap-y-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          {/* --- the sequence ------------------------------------------- */}
          <ol className="space-y-12">
            {PROCESS.map((phase) => (
              <li key={phase.id} id={`process-${phase.id}`}>
                <div className="grid gap-x-8 gap-y-3 border-b border-[var(--rule-strong)] pb-4 md:grid-cols-[3.5rem_1fr]">
                  <p className="d3-display text-[2.25rem] leading-none text-[var(--accent)]" style={{ ["--wght" as string]: 800 }}>
                    {phase.index}
                  </p>
                  <div>
                    <p className="d3-tag text-[var(--ink-3)]">{phase.eyebrow}</p>
                    <h3 className="d3-display mt-2 text-[clamp(1.5rem,3.2vw,2.25rem)]" data-load data-load-from="300">
                      {phase.heading}
                    </h3>
                    <p className="d3-body mt-3 max-w-[58ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
                      {phase.standfirst}
                    </p>
                  </div>
                </div>

                <ol data-r-group>
                  {phase.steps.map((step, i) => (
                    <li
                      key={step.id}
                      className="grid gap-x-8 gap-y-1 border-b border-[var(--rule)] py-4 md:grid-cols-[3.5rem_1fr_minmax(0,9rem)]"
                    >
                      <div className="flex items-baseline gap-2">
                        <span aria-hidden className="d3-actor" data-actor={step.actor} />
                        <span className="d3-figure text-[0.6875rem] text-[var(--ink-3)]">
                          {phase.index}
                          {i + 1}
                        </span>
                        <span className="sr-only">{PROCESS_COPY.actorLabel[step.actor]}</span>
                      </div>
                      <div>
                        <p className="d3-body text-[0.9375rem] font-medium text-[var(--ink)]">{step.title}</p>
                        <p className="d3-body mt-1 max-w-[62ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                          {step.body}
                        </p>
                      </div>
                      <p className="d3-tag mt-2 text-[0.5rem] text-[var(--ink-3)] empty:hidden md:mt-0 md:text-right">
                        {step.when ?? ""}
                      </p>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>

          {/* --- to hand, and set on the call ------------------------------ */}
          <div className="flex flex-col gap-10 lg:sticky lg:top-24 lg:self-start">
            <div className="d3-panel d3-ticks p-5" data-r>
              <p className="d3-tag text-[var(--ink)]">{PROCESS_COPY.checklistHeading}</p>
              <p className="d3-body mt-2 text-[0.75rem] text-[var(--ink-3)] text-pretty">{PROCESS_COPY.checklistNote}</p>
              <ol className="mt-4">
                {BEFORE_CHECKLIST.map((item, i) => (
                  <li key={item.label} className="grid grid-cols-[1.5rem_1fr] gap-2 border-t border-[var(--rule)] py-3">
                    <span className="d3-figure text-[0.625rem] text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="d3-body text-[0.8125rem] font-medium leading-snug text-[var(--ink)]">{item.label}</p>
                      <p className="d3-body mt-1 text-[0.75rem] leading-snug text-[var(--ink-3)] text-pretty">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-l-2 border-[var(--caution)] pl-4" data-r>
              <p className="d3-tag text-[var(--caution)]">{PROCESS_COPY.setOnCallHeading}</p>
              <ul className="mt-3">
                {SET_ON_THE_CALL.map((item) => (
                  <li key={item} className="d3-body border-b border-[var(--rule)] py-2 text-[0.8125rem] text-[var(--ink-2)] last:border-0">
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
