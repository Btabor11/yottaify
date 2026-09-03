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
  source,
  formatAsOfShort,
} from "@/content";
import { SectionHead } from "./SectionHead";
import { NodeDiagram } from "./NodeDiagram";
import { NodeSceneMount } from "./NodeSceneMount";

/**
 * The density section. A technical buyer scrolls here first and stays longest,
 * so nothing is hidden behind a hover or a tab — every number, its unit, why
 * it matters, and where it came from are all on screen at once.
 */
export function SpecsSection() {
  const specById = new Map(SPECS.map((s) => [s.id, s]));

  return (
    <section id="specs" className="d1-shell scroll-mt-16 py-20 md:py-28">
      <SectionHead
        index={SECTIONS.specs.index}
        eyebrow={SECTIONS.specs.eyebrow}
        heading={SECTIONS.specs.heading}
        standfirst={SECTIONS.specs.standfirst}
        id="specs-heading"
        aside={
          <div data-reveal className="border-l-2 border-[var(--rule-strong)] pl-4">
            <p className="d1-label text-[var(--ink-3)]">{NO_BENCHMARKS.heading}</p>
            <p className="d1-body mt-2 max-w-[42ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
              {NO_BENCHMARKS.body}
            </p>
          </div>
        }
      />

      {/* --- THE ARGUMENT ------------------------------------------------- */}
      <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]">
        <div>
          <p className="d1-label text-[var(--accent)]">Per 8-GPU node</p>

          <p data-reveal data-reveal-y="26" className="mt-4 flex flex-wrap items-baseline gap-x-4">
            <span
              className="d1-figure text-[clamp(3.5rem,11vw,8.5rem)] leading-[0.82] tracking-[-0.045em]"
              style={{ color: "var(--accent)" }}
            >
              {/* Printed value, animated in place — the real number is in the
                  HTML, so no-JS and reduced-motion see 2,304 immediately. */}
              <span data-count-to={NODE.hbmGb} data-count-decimals="0">
                {NODE.hbmGbFormatted}
              </span>
            </span>
            <span className="d1-display-loose text-[clamp(1.5rem,3.4vw,2.5rem)] text-[var(--ink-2)]">
              GB
            </span>
          </p>

          <p className="d1-label mt-1 text-[var(--ink-3)]">
            HBM3e · {NODE.hbmTbFormatted} TB · {NODE.domain}
          </p>

          <p
            data-reveal
            className="d1-display-loose mt-8 max-w-[26ch] text-[clamp(1.25rem,2.6vw,1.875rem)] text-balance"
          >
            {HEADLINE_ARGUMENT.statement}
          </p>

          <p data-reveal className="d1-body mt-5 max-w-[46ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
            {HEADLINE_ARGUMENT.consequence}
          </p>

          <p className="d1-label mt-6 flex flex-wrap items-baseline gap-x-2 text-[var(--ink-3)]">
            <span aria-hidden className="text-[var(--rule-strong)]">↳</span>
            {GPU.fullName} · {GPU.architectureName}
            <span className="text-[var(--rule-strong)]">·</span>
            <a
              href={source(HEADLINE_ARGUMENT.sourceId).url ?? undefined}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="d1-link"
            >
              {source(HEADLINE_ARGUMENT.sourceId).label}
            </a>
            <span className="text-[var(--rule-strong)]">·</span>
            <span className="d1-figure tracking-normal">
              {formatAsOfShort(source(HEADLINE_ARGUMENT.sourceId).accessed)}
            </span>
          </p>
        </div>

        {/* --- the node, drawn ------------------------------------------- */}
        <figure className="d1-ticked relative border border-[var(--rule-strong)] bg-[var(--surface)]/40">
          <div className="flex items-baseline justify-between gap-3 border-b border-[var(--rule)] px-4 py-2.5">
            <figcaption className="d1-label text-[var(--ink-2)]">
              One node · {NVLINK.generation} domain
            </figcaption>
            <span className="d1-label text-[var(--ink-3)]">Schematic</span>
          </div>

          <NodeSceneMount>
            <NodeDiagram className="h-[clamp(15rem,34vw,22rem)] w-full" />
          </NodeSceneMount>

          <div className="grid grid-cols-3 border-t border-[var(--rule)]">
            {[
              ["Devices", `${NODE.gpus}`],
              ["HBM3e", `${NODE.hbmGbFormatted} GB`],
              ["Links / GPU", `${NVLINK.links}`],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-[var(--rule)] px-4 py-3 last:border-r-0">
                <p className="d1-label text-[var(--ink-3)]">{label}</p>
                <p className="d1-figure mt-1.5 text-[0.9375rem]">{value}</p>
              </div>
            ))}
          </div>
        </figure>
      </div>

      {/* --- SPEC TABLE ---------------------------------------------------- */}
      <div className="mt-20 md:mt-24">
        <div className="d1-sechead">
          <span className="d1-figure text-[0.625rem] text-[var(--ink-3)]">02.1</span>
          <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
          <span className="d1-label text-[var(--ink-3)]">Per-GPU specification</span>
        </div>

        <table className="mt-6 w-full border-collapse text-left">
          <caption className="sr-only">
            NVIDIA B300 per-GPU specifications, what each figure changes about a workload, and the
            source of each figure.
          </caption>
          <thead>
            <tr className="hidden md:table-row">
              <th scope="col" className="d1-label w-[16%] border-b border-[var(--rule-strong)] pb-2.5 pr-4 text-[var(--ink-3)]">
                Spec
              </th>
              <th scope="col" className="d1-label w-[18%] border-b border-[var(--rule-strong)] pb-2.5 pr-4 text-[var(--ink-3)]">
                Value
              </th>
              <th scope="col" className="d1-label border-b border-[var(--rule-strong)] pb-2.5 pr-4 text-[var(--ink-3)]">
                What it changes
              </th>
              <th scope="col" className="d1-label w-[14%] border-b border-[var(--rule-strong)] pb-2.5 text-right text-[var(--ink-3)]">
                Source
              </th>
            </tr>
          </thead>
          <tbody data-reveal-group data-reveal-y="14">
            {SPECS.map((s) => {
              const src = source(s.sourceId);
              return (
                <tr
                  key={s.id}
                  className="block border-b border-[var(--rule)] py-4 md:table-row md:py-0"
                >
                  <th
                    scope="row"
                    className="d1-label block pb-1 text-left align-baseline text-[var(--ink-3)] md:table-cell md:py-4 md:pr-4"
                  >
                    {s.longLabel}
                  </th>
                  <td className="block align-baseline md:table-cell md:py-4 md:pr-4">
                    <span className="d1-figure text-[1.125rem] leading-none text-[var(--ink)]">
                      {s.approx && <span className="text-[var(--ink-3)]">~</span>}
                      {s.value}
                    </span>
                    {s.unit && (
                      <span className="d1-label ml-1.5 text-[var(--ink-2)]">{s.unit}</span>
                    )}
                  </td>
                  <td className="d1-body block max-w-[62ch] pt-2 text-[0.875rem] align-baseline text-[var(--ink-2)] text-pretty md:table-cell md:py-4 md:pr-4">
                    {s.why}
                  </td>
                  <td className="block pt-2 align-baseline md:table-cell md:py-4 md:text-right">
                    <span className="d1-label whitespace-nowrap text-[var(--ink-3)]">
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="d1-link"
                        >
                          {src.kind === "vendor-spec" ? "NVIDIA" : src.label}
                        </a>
                      ) : (
                        src.label
                      )}
                      <span aria-hidden className="mx-1.5 text-[var(--rule-strong)]">
                        ·
                      </span>
                      <span className="d1-figure tracking-normal">
                        {formatAsOfShort(src.accessed)}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="d1-label mt-4 max-w-[76ch] normal-case tracking-[0.03em] text-[var(--ink-3)]">
          A tilde means the figure is approximate at source. We have not rounded, averaged, or
          restated any of these — where NVIDIA publishes a range, the range is what appears here.
        </p>
      </div>

      {/* --- WORKLOAD FIT -------------------------------------------------- */}
      <div className="mt-20 md:mt-24">
        <div className="d1-sechead">
          <span className="d1-figure text-[0.625rem] text-[var(--ink-3)]">02.2</span>
          <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
          <span className="d1-label text-[var(--ink-3)]">What it suits</span>
        </div>

        <ul data-reveal-group className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
          {WORKLOADS.map((w, i) => (
            <li key={w.id} className="flex flex-col bg-[var(--bg)] p-5 md:p-6">
              <span className="d1-figure text-[0.625rem] text-[var(--accent)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="d1-display-loose mt-3 text-[1.0625rem] text-balance">{w.title}</h3>
              <p className="d1-body mt-3 flex-1 text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                {w.because}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-[var(--rule)] pt-3">
                {w.restsOn.map((id) => (
                  <span
                    key={id}
                    className="d1-label border border-[var(--rule-strong)] px-1.5 py-0.5 text-[0.5rem] text-[var(--ink-3)]"
                  >
                    {specById.get(id)?.label ?? id}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* --- ACCESS MODEL -------------------------------------------------- */}
      <div className="mt-20 md:mt-24">
        <div className="d1-sechead">
          <span className="d1-figure text-[0.625rem] text-[var(--ink-3)]">02.3</span>
          <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
          <span className="d1-label text-[var(--ink-3)]">How you get at it</span>
        </div>

        <div className="mt-6 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <h3 data-reveal className="d1-display-loose text-[clamp(1.5rem,3.2vw,2.25rem)]">
              {ACCESS.headline}
            </h3>
            <p data-reveal className="d1-body mt-5 max-w-[58ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
              {ACCESS.body}
            </p>
          </div>

          <div data-reveal className="border-t border-[var(--rule-strong)] pt-5">
            <p className="d1-label text-[var(--ink-3)]">Not included</p>
            <ul className="mt-3 space-y-2.5">
              {ACCESS.notIncluded.map((item) => (
                <li key={item} className="d1-body flex gap-2.5 text-[0.8125rem] text-[var(--ink-2)]">
                  <span aria-hidden className="mt-[0.5em] h-px w-3 shrink-0 bg-[var(--rule-strong)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
