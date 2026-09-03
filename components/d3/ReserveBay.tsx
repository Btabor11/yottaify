import { SITE } from "@/config/site";
import { SECTIONS, FORM_COPY, CANDOUR, FLEET, NODE, RATE, CONTRACT, ACCESS } from "@/content";
import { Bay } from "./Bay";
import { Console } from "./Console";

/**
 * Bay 03 — the console, with the specification of what a slot actually is
 * beside it. The caveat sits next to the submit button rather than earlier in
 * the page, because that is where hesitation happens.
 */
export function ReserveBay() {
  return (
    <section id="reserve" className="d3-shell scroll-mt-24 py-16 md:py-24">
      <Bay
        index={SECTIONS.reserve.index}
        eyebrow={FORM_COPY.eyebrow}
        heading={SECTIONS.reserve.heading}
        standfirst={FORM_COPY.standfirst}
        headingId="reserve-heading"
      />

      <div className="d3-bus">
        <div />
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
          <Console />

          <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
            <div>
              <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                What a slot is
              </p>
              <dl className="mt-3">
                {[
                  ["Hardware", `${FLEET.gpusPerNode} × B300 per node`],
                  ["Memory", `${NODE.hbmGbFormatted} GB per node`],
                  ["Access", `${ACCESS.model}, SSH`],
                  ["On-demand", RATE.full],
                  ["Terms", `${CONTRACT.model}, ${CONTRACT.termYears}`],
                  ["Online", SITE.availability],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-3 border-b border-[var(--rule)] py-2.5 last:border-0"
                  >
                    <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">{k}</dt>
                    <dd className="d3-figure text-right text-[0.75rem] text-[var(--ink-2)]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="d3-tag border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                Then what
              </p>
              <ol className="mt-3">
                {FORM_COPY.whatHappensNext.map((step, i) => (
                  <li
                    key={step}
                    className="grid grid-cols-[1.25rem_1fr] gap-2 border-b border-[var(--rule)] py-2.5 last:border-0"
                  >
                    <span className="d3-figure text-[0.625rem] text-[var(--accent)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="d3-body text-[0.75rem] leading-snug text-[var(--ink-2)] text-pretty">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-l-2 border-[var(--caution)] pl-4">
              <p className="d3-tag text-[var(--caution)]">Before you submit</p>
              <p className="d3-body mt-2 text-[0.75rem] text-[var(--ink-2)] text-pretty">
                {CANDOUR.paragraphs[1]}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
