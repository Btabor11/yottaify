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
  FLEET,
  HBM_PER_GPU,
} from "@/content";
import { Chapter } from "./Chapter";
import { Cite } from "./Cite";
import { NodePlate, PLATE_LEGEND } from "./NodePlate";
import { EngravingMount } from "./EngravingMount";
import { Set, Ink, Rule } from "./Reveal";

/**
 * Chapter 02 — the hardware, as a spread.
 *
 * Density is the point for this reader, and a document can be dense in a way a
 * landing page cannot: a specification table with a "what it changes" column, a
 * numbered plate with a legend, and a manifest of all sixteen units. The
 * manifest is a small piece of theatre with a real purpose — a competitor
 * claiming "100+ GPUs" cannot print one, and sixteen rows is a claim the reader
 * can audit by counting.
 */
export function SpecsSpread() {
  return (
    <section id="specs" className="d2-shell scroll-mt-28 py-16 md:py-24">
      <Chapter
        index={SECTIONS.specs.index}
        eyebrow={SECTIONS.specs.eyebrow}
        heading={
          <>
            One node, one <em>memory domain</em>
          </>
        }
        standfirst={
          <>
            {SECTIONS.specs.standfirst}
            <Cite sourceId="nvidiaBlackwellUltra" />
          </>
        }
        headingId="specs-heading"
        aside={
          <Set className="border-t border-[var(--rule-strong)] pt-3">
            <p className="d2-caps text-[var(--ink-3)]">{NO_BENCHMARKS.heading}</p>
            <p className="d2-prose mt-2 max-w-[44ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
              {NO_BENCHMARKS.body}
            </p>
          </Set>
        }
      />

      <div className="d2-page">
        <div />
        <div>
          {/* --- THE ARGUMENT ------------------------------------------- */}
          <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
            <div>
              <p className="d2-caps text-[var(--accent)]">Per 8-GPU node</p>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                <span className="d2-figure text-[clamp(3.5rem,10vw,7.5rem)] leading-[0.85] text-[var(--accent)]">
                  <Ink>{NODE.hbmGbFormatted}</Ink>
                </span>
                <span className="d2-display text-[clamp(1.5rem,3vw,2.25rem)] text-[var(--ink-2)]">
                  GB
                </span>
              </p>
              <p className="d2-caps mt-1 text-[var(--ink-3)]">
                HBM3e · {NODE.hbmTbFormatted} TB · {NODE.domain}
                <Cite sourceId={HEADLINE_ARGUMENT.sourceId} />
              </p>

              <Set className="mt-8">
                <p className="d2-display max-w-[24ch] text-[clamp(1.375rem,3vw,2.25rem)] text-balance">
                  {HEADLINE_ARGUMENT.statement}
                </p>
              </Set>
              <Set delay={0.06}>
                <p className="d2-prose mt-5 max-w-[48ch] text-[1rem] text-[var(--ink-2)] text-pretty">
                  {HEADLINE_ARGUMENT.consequence}
                </p>
              </Set>
              <p className="d2-caps mt-6 text-[var(--ink-3)]">
                {GPU.fullName} · {GPU.architectureName}
              </p>
            </div>

            {/* --- PLATE I -------------------------------------------- */}
            <figure className="border border-[var(--ink)]">
              <div className="flex items-baseline justify-between gap-3 border-b border-[var(--ink)] bg-[var(--surface)] px-4 py-2">
                <figcaption className="d2-caps text-[var(--ink-2)]">Plate I — one node</figcaption>
                <span className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
                  {NVLINK.generation}
                </span>
              </div>

              <EngravingMount>
                <NodePlate className="h-[clamp(14rem,30vw,20rem)] w-full" />
              </EngravingMount>

              <ol className="border-t border-[var(--ink)]">
                {PLATE_LEGEND.map((item) => (
                  <li
                    key={item.n}
                    className="grid grid-cols-[1.5rem_1fr] gap-2 border-b border-[var(--rule)] px-4 py-2 last:border-b-0"
                  >
                    <span className="d2-figure text-[0.6875rem] text-[var(--ink-3)]">
                      ({item.n})
                    </span>
                    <span className="d2-prose text-[0.8125rem] leading-snug">
                      {item.label}
                      <span className="text-[var(--ink-3)]"> — {item.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </figure>
          </div>

          {/* --- SPECIFICATION TABLE ---------------------------------- */}
          <div className="mt-16 md:mt-20">
            <Rule className="d2-rule" />
            <p className="d2-caps mt-3 text-[var(--ink-3)]">02.1 — Per-GPU specification</p>

            <table className="d2-table mt-5">
              <caption className="sr-only">
                NVIDIA B300 per-GPU specifications, what each figure changes about a workload, and
                the source of each figure.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="d2-caps w-[24%] text-[var(--ink-3)]">
                    Specification
                  </th>
                  <th scope="col" className="d2-caps d2-num w-[16%] text-[var(--ink-3)]">
                    Value
                  </th>
                  <th scope="col" className="d2-caps text-[var(--ink-3)]">
                    What it changes
                  </th>
                </tr>
              </thead>
              <tbody>
                {SPECS.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className="font-normal">
                      <span className="d2-prose text-[0.9375rem] leading-snug">
                        {s.longLabel}
                        <Cite sourceId={s.sourceId} />
                      </span>
                    </th>
                    <td className="d2-num whitespace-nowrap text-[1rem]">
                      {s.approx && <span className="text-[var(--ink-3)]">~</span>}
                      {s.value}
                      {s.unit && (
                        <span className="d2-caps ml-1.5 text-[0.5625rem] text-[var(--ink-2)]">
                          {s.unit}
                        </span>
                      )}
                    </td>
                    <td className="d2-prose max-w-[58ch] text-[0.875rem] leading-[1.55] text-[var(--ink-2)] text-pretty">
                      {s.why}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="d2-prose mt-4 max-w-[76ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty">
              A tilde means the figure is approximate at source. Nothing here has been rounded,
              averaged, or restated — where NVIDIA publishes a range, the range is what is printed.
            </p>
          </div>

          {/* --- WORKLOAD FIT ----------------------------------------- */}
          <div className="mt-16 md:mt-20">
            <Rule className="d2-rule" />
            <p className="d2-caps mt-3 text-[var(--ink-3)]">02.2 — What it suits</p>

            <ol className="mt-5">
              {WORKLOADS.map((w, i) => (
                <Set
                  key={w.id}
                  as="li"
                  delay={Math.min(i * 0.06, 0.24)}
                  className="grid gap-x-8 gap-y-2 border-b border-[var(--rule)] py-5 lg:grid-cols-[3rem_minmax(0,16rem)_minmax(0,1fr)]"
                >
                  <span className="d2-figure text-[1.25rem] leading-none text-[var(--rule-strong)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="d2-display text-[1.375rem] leading-tight">{w.title}</h3>
                  <p className="d2-prose max-w-[62ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
                    {w.because}
                  </p>
                </Set>
              ))}
            </ol>
          </div>

          {/* --- MANIFEST --------------------------------------------- */}
          <div className="mt-16 md:mt-20">
            <Rule className="d2-rule" />
            <p className="d2-caps mt-3 text-[var(--ink-3)]">02.3 — Manifest</p>
            <p className="d2-prose mt-3 max-w-[52ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
              All {FLEET.total} units, listed. The number is small enough to print, which is the
              only reason a page like this can print it.
              <Cite sourceId="facility" />
            </p>

            <Set className="mt-5 grid gap-x-12 gap-y-0 sm:grid-cols-2">
              {Array.from({ length: FLEET.nodes }, (_, n) => (
                <table key={n} className="d2-table">
                  <caption className="d2-caps py-2 text-left text-[var(--ink-3)]">
                    Node {String(n + 1).padStart(2, "0")} — {FLEET.gpusPerNode} × {GPU.model} ·{" "}
                    {NODE.hbmGbFormatted} GB
                  </caption>
                  <tbody>
                    {Array.from({ length: FLEET.gpusPerNode }, (_, g) => {
                      const unit = n * FLEET.gpusPerNode + g + 1;
                      return (
                        <tr key={unit}>
                          <td className="d2-figure w-[3.5rem] text-[0.75rem] text-[var(--ink-3)]">
                            {String(unit).padStart(2, "0")}
                          </td>
                          <td className="d2-prose text-[0.8125rem]">{GPU.fullName}</td>
                          <td className="d2-num text-[0.75rem] text-[var(--ink-2)]">
                            {HBM_PER_GPU.display}
                          </td>
                          <td className="d2-caps text-right text-[0.5rem] text-[var(--ink-3)]">
                            On order
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ))}
            </Set>
          </div>

          {/* --- ACCESS ----------------------------------------------- */}
          <div className="mt-16 md:mt-20">
            <Rule className="d2-rule" />
            <p className="d2-caps mt-3 text-[var(--ink-3)]">02.4 — How you get at it</p>

            <div className="mt-5 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
              <div>
                <Set>
                  <h3 className="d2-display text-[clamp(1.5rem,3.2vw,2.25rem)]">
                    {ACCESS.headline}
                  </h3>
                </Set>
                <Set delay={0.06}>
                  <p className="d2-prose mt-4 max-w-[58ch] text-[1rem] text-[var(--ink-2)] text-pretty">
                    {ACCESS.body}
                  </p>
                </Set>
              </div>

              <Set delay={0.1} className="border-t border-[var(--rule-strong)] pt-3">
                <p className="d2-caps text-[var(--ink-3)]">Not included</p>
                <ul className="mt-3">
                  {ACCESS.notIncluded.map((item) => (
                    <li
                      key={item}
                      className="d2-prose border-b border-[var(--rule)] py-2.5 text-[0.8125rem] text-[var(--ink-2)] last:border-0"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </Set>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
