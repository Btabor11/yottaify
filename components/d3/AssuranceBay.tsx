import { SITE } from "@/config/site";
import { SECTIONS, ASSURANCE, CERTIFICATIONS, CERT_STATUS, formatAsOf } from "@/content";
import { Bay } from "./Bay";

/**
 * Sheet 04 — assurance.
 *
 * The section a security reviewer opens first, and the one most sites lie on.
 *
 * Every framework in the schedule is rendered with a status pip in `--caution`
 * and never in `--accent`, because accent is the colour this site uses for
 * things that are true. A planned certification is not an achievement and must
 * not be able to read as one at a glance — that is the entire failure mode
 * this component is designed against. The disclaimer sits ABOVE the schedule
 * rather than under it, so nobody can screenshot the table without it.
 *
 * The statuses themselves are constrained in content/assurance.ts and checked
 * by `npm run audit`; there is no status here that means "held".
 */
export function AssuranceBay() {
  return (
    <section
      id="assurance"
      className="relative scroll-mt-24 border-t border-[var(--rule-strong)] bg-[var(--surface)] py-16 md:py-24"
    >
      <div aria-hidden className="d3-ledger pointer-events-none absolute inset-0 opacity-60" />
      <div className="d3-shell relative">
        <Bay
          index={SECTIONS.assurance.index}
          eyebrow={SECTIONS.assurance.eyebrow}
          heading={SECTIONS.assurance.heading}
          standfirst={SECTIONS.assurance.standfirst}
          headingId="assurance-heading"
          aside={
            <div className="border-l-2 border-[var(--caution)] pl-4" data-r>
              <p className="d3-tag text-[var(--caution)]">Nothing here is held yet</p>
              <p className="d3-body mt-2 max-w-[44ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                {ASSURANCE.roadmap.disclaimer}
              </p>
            </div>
          }
        />

        {/* --- the roadmap ------------------------------------------------ */}
        <div>
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
            {SECTIONS.assurance.index}.1 — {ASSURANCE.roadmap.eyebrow}
          </p>

          <div className="mt-6 grid gap-x-14 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
            <h3
              className="d3-display max-w-[7.7em] text-[clamp(1.75rem,4.2vw,3.25rem)] text-balance"
              data-load
              data-load-from="300"
            >
              {ASSURANCE.roadmap.heading}
            </h3>
            <p className="d3-body max-w-[54ch] self-end text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
              {ASSURANCE.roadmap.body}
            </p>
          </div>

          {/* Stacked records below lg — a five-column compliance table on a
              phone is a horizontal scroll nobody performs. */}
          <table className="mt-9 w-full border-collapse text-left">
            <caption className="sr-only">
              Certification frameworks {SITE.name} is working towards, with the status of each. None
              are held. Stated {formatAsOf(SITE.pricingAsOf)}.
            </caption>
            <thead>
              <tr className="hidden lg:table-row">
                {[
                  [ASSURANCE.roadmap.columns.framework, "w-[22%]"],
                  [ASSURANCE.roadmap.columns.status, "w-[12%]"],
                  [ASSURANCE.roadmap.columns.target, "w-[30%]"],
                  [ASSURANCE.roadmap.columns.today, "w-[36%]"],
                ].map(([label, w]) => (
                  <th
                    key={label}
                    scope="col"
                    className={`d3-tag border-y border-[var(--rule-strong)] bg-[var(--surface-2)] px-3 py-3 text-[0.5rem] text-[var(--ink-3)] ${w}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody data-r-group>
              {CERTIFICATIONS.map((c) => (
                <tr
                  key={c.id}
                  className="block border-b border-[var(--rule)] py-4 lg:table-row lg:py-0"
                >
                  <th scope="row" className="block px-0 text-left align-top lg:table-cell lg:px-3 lg:py-4">
                    <span className="d3-body block text-[0.9375rem] font-medium leading-tight text-[var(--ink)]">
                      {c.label}
                    </span>
                    <span className="d3-body mt-2 block max-w-[56ch] text-[0.75rem] leading-relaxed text-[var(--ink-3)]">
                      {c.scope}
                    </span>
                  </th>

                  <td className="mt-3 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                    <span className="d3-pip text-[0.4375rem] text-[var(--caution)]">
                      {CERT_STATUS[c.status]}
                    </span>
                    <span className="d3-tag mt-1.5 block text-[0.4375rem] text-[var(--ink-3)]">
                      Not held
                    </span>
                  </td>

                  <td className="mt-3 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                    <span className="d3-tag mr-2 text-[0.4375rem] text-[var(--ink-3)] lg:hidden">
                      {ASSURANCE.roadmap.columns.target}
                    </span>
                    <span className="d3-body block max-w-[56ch] text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
                      {c.target}
                    </span>
                  </td>

                  <td className="mt-3 block align-top lg:mt-0 lg:table-cell lg:px-3 lg:py-4">
                    <span className="d3-tag mr-2 text-[0.4375rem] text-[var(--ink-3)] lg:hidden">
                      {ASSURANCE.roadmap.columns.today}
                    </span>
                    <span className="d3-body block max-w-[64ch] text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
                      {c.today}
                    </span>
                    <span className="d3-body mt-2 block max-w-[64ch] text-[0.75rem] leading-relaxed text-[var(--ink-3)]">
                      Why: {c.why}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="d3-body mt-6 max-w-[80ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
            {ASSURANCE.roadmap.ask}
          </p>
        </div>

        {/* --- physical posture ------------------------------------------- */}
        <div className="mt-16 md:mt-24">
          <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
            {SECTIONS.assurance.index}.2 — {ASSURANCE.physical.eyebrow}
          </p>

          <div className="mt-6 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <h3
                className="d3-display max-w-[7em] text-[clamp(1.75rem,4.2vw,3.25rem)] text-balance"
                data-load
                data-load-from="300"
              >
                {ASSURANCE.physical.heading}
              </h3>
              <p className="d3-body mt-4 max-w-[54ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
                {ASSURANCE.physical.body}
              </p>
              <p
                className="d3-body mt-5 max-w-[54ch] border-l-2 border-[var(--caution)] pl-4 text-[0.8125rem] text-[var(--ink-3)] text-pretty"
                data-r
              >
                {ASSURANCE.physical.caveat}
              </p>
            </div>

            <ul className="grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-2" data-r-group>
              {ASSURANCE.physical.points.map((p, i) => (
                <li key={p.label} className="bg-[var(--bg)] p-5">
                  <p className="d3-figure text-[0.625rem] text-[var(--accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="d3-display mt-2 text-[1.125rem]" style={{ ["--wght" as string]: 720 }}>
                    {p.label}
                  </p>
                  <p className="d3-body mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                    {p.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
