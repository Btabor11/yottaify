import {
  SECTIONS,
  SPECS,
  GPU,
  NODE,
  HEADLINE_ARGUMENT,
  WORKLOADS,
  NO_BENCHMARKS,
  NVLINK,
  ACCESS,
  HBM_PER_GPU,
  FLEET,
} from "@/content";
import { Bay } from "./Bay";
import { DomainRing } from "./DomainRing";
import { DomainMount } from "./DomainMount";

/**
 * Bay 02 — the hardware.
 *
 * The figure leads at poster scale, because 2,304 GB is the strongest thing
 * this company has to say and D3's whole register is scale. The specification
 * table underneath is where the density lives; a technical buyer who scrolled
 * here wants rows, not cards.
 */
export function SpecsBay() {
  return (
    <section
      id="specs"
      className="relative scroll-mt-24 border-y border-[var(--rule-strong)] bg-[var(--surface)] py-16 md:py-24"
    >
      <div className="d3-shell">
        <Bay
          index={SECTIONS.specs.index}
          eyebrow={SECTIONS.specs.eyebrow}
          heading={SECTIONS.specs.heading}
          standfirst={SECTIONS.specs.standfirst}
          headingId="specs-heading"
          aside={
            <div className="border-l border-[var(--rule-strong)] pl-4" data-r>
              <p className="d3-tag text-[var(--ink-3)]">{NO_BENCHMARKS.heading}</p>
              <p className="d3-body mt-2 max-w-[44ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                {NO_BENCHMARKS.body}
              </p>
            </div>
          }
        />

        <div className="d3-bus">
          <div />
          <div>
            {/* --- the argument, at scale ------------------------------- */}
            <div className="grid items-center gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
              <div>
                <p className="d3-tag text-[var(--accent)]">
                  Per {FLEET.gpusPerNode}-GPU node · {NVLINK.generation}
                </p>

                {/* Display face, not the mono: a monospaced comma takes a full
                    digit cell and punches a hole through the middle of the one
                    number this whole company is built on. */}
                <p className="mt-4 flex flex-wrap items-baseline gap-x-4">
                  <span
                    className="d3-display text-[clamp(3.75rem,13vw,10.5rem)] leading-[0.8] text-[var(--accent)]"
                    style={{ ["--wdth" as string]: 108 }}
                    data-count-to={NODE.hbmGb}
                  >
                    {NODE.hbmGbFormatted}
                  </span>
                  <span className="d3-display text-[clamp(1.5rem,3.5vw,2.75rem)] text-[var(--ink-2)]">
                    GB
                  </span>
                </p>

                <p className="d3-tag mt-3 text-[var(--ink-3)]">
                  HBM3e · {NODE.hbmTbFormatted} TB · {NODE.domain}
                </p>

                <h3
                  className="d3-display mt-9 max-w-[20ch] text-[clamp(1.375rem,3.2vw,2.375rem)] text-balance"
                  data-load
                  data-load-from="76"
                >
                  {HEADLINE_ARGUMENT.statement}
                </h3>
                <p
                  className="d3-body mt-5 max-w-[50ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty"
                  data-r
                >
                  {HEADLINE_ARGUMENT.consequence}
                </p>

                <p className="d3-tag mt-7 text-[0.5rem] text-[var(--ink-3)]">
                  {GPU.fullName} · {GPU.architectureName} · {HBM_PER_GPU.display} per device
                </p>
              </div>

              {/* --- the domain ---------------------------------------- */}
              <figure className="d3-panel d3-ticks p-3">
                <DomainMount>
                  <DomainRing className="h-[clamp(15rem,32vw,22rem)] w-full" />
                </DomainMount>
                <figcaption className="d3-tag mt-2 px-2 pb-1 text-[0.4375rem] text-[var(--ink-3)]">
                  One node in plan · {FLEET.gpusPerNode} devices, all-to-all over{" "}
                  {NVLINK.generation}
                </figcaption>
              </figure>
            </div>

            {/* --- specification table --------------------------------- */}
            <div className="mt-16 md:mt-20">
              <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                02.1 — Per-GPU specification
              </p>
              <table className="d3-table mt-4">
                <caption className="sr-only">
                  NVIDIA B300 per-GPU specifications and what each figure changes about a workload.
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="d3-tag w-[26%] text-[0.5rem] text-[var(--ink-3)]">
                      Specification
                    </th>
                    <th scope="col" className="d3-tag d3-num w-[16%] text-[0.5rem] text-[var(--ink-3)]">
                      Value
                    </th>
                    <th scope="col" className="d3-tag text-[0.5rem] text-[var(--ink-3)]">
                      What it changes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SPECS.map((s) => (
                    <tr key={s.id}>
                      <th scope="row" className="font-normal">
                        <span className="d3-body text-[0.875rem] leading-snug text-[var(--ink)]">
                          {s.longLabel}
                        </span>
                      </th>
                      <td className="d3-num whitespace-nowrap">
                        <span className="d3-figure text-[1rem] text-[var(--ink)]">
                          {s.approx && <span className="text-[var(--ink-3)]">~</span>}
                          {s.value}
                        </span>
                        {s.unit && (
                          <span className="d3-tag ml-1.5 text-[0.5rem] text-[var(--ink-3)]">
                            {s.unit}
                          </span>
                        )}
                      </td>
                      <td className="d3-cell-note d3-body text-[0.8125rem] leading-relaxed text-[var(--ink-2)] text-pretty">
                        {s.why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="d3-body mt-4 max-w-[72ch] text-[0.75rem] text-[var(--ink-3)] text-pretty">
                A tilde means the figure is approximate at source. Where NVIDIA publishes a range,
                the range is what is printed — nothing here has been rounded or averaged.
              </p>
            </div>

            {/* --- workloads ------------------------------------------- */}
            <div className="mt-16 md:mt-20">
              <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                02.2 — What it suits
              </p>
              <ol className="mt-4 grid gap-px bg-[var(--rule)] md:grid-cols-2" data-r-group>
                {WORKLOADS.map((w, i) => (
                  <li key={w.id} className="bg-[var(--surface)] p-6">
                    <p className="d3-figure text-[0.6875rem] text-[var(--accent)]">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h4 className="d3-display mt-3 text-[1.25rem]" style={{ ["--wdth" as string]: 108 }}>
                      {w.title}
                    </h4>
                    <p className="d3-body mt-2.5 max-w-[46ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                      {w.because}
                    </p>
                    <p className="d3-tag mt-4 text-[0.4375rem] text-[var(--ink-3)]">
                      Rests on:{" "}
                      {w.restsOn
                        .map((id) => SPECS.find((s) => s.id === id)?.label ?? id)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* --- access ---------------------------------------------- */}
            <div className="mt-16 md:mt-20">
              <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                02.3 — How you get at it
              </p>
              <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
                <div>
                  <h3
                    className="d3-display text-[clamp(1.5rem,3.4vw,2.5rem)]"
                    data-load
                    data-load-from="76"
                  >
                    {ACCESS.headline}
                  </h3>
                  <p
                    className="d3-body mt-4 max-w-[56ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty"
                    data-r
                  >
                    {ACCESS.body}
                  </p>
                </div>
                <div className="border-l border-[var(--caution)] pl-4" data-r>
                  <p className="d3-tag text-[var(--caution)]">Not included</p>
                  <ul className="mt-3">
                    {ACCESS.notIncluded.map((item) => (
                      <li
                        key={item}
                        className="d3-body border-b border-[var(--rule)] py-2.5 text-[0.8125rem] text-[var(--ink-2)] last:border-0"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
