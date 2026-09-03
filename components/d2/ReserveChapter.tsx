import { SITE } from "@/config/site";
import { SECTIONS, FORM_COPY, CANDOUR, FLEET, NODE, RATE, CONTRACT, ACCESS } from "@/content";
import { Chapter } from "./Chapter";
import { Cite } from "./Cite";
import { OrderCard } from "./OrderCard";
import { Set } from "./Reveal";

/**
 * Chapter 03 — the order card, with the marginal rail a printed insert would
 * have: what happens next, what you would be reserving, and the caveat.
 *
 * The caveat sits beside the submit button rather than earlier in the document
 * because that is where hesitation actually happens.
 */
export function ReserveChapter() {
  return (
    <section id="reserve" className="scroll-mt-28 border-y border-[var(--ink)] bg-[var(--bg)]">
      <div className="d2-shell py-16 md:py-24">
        <Chapter
          index={SECTIONS.reserve.index}
          eyebrow={FORM_COPY.eyebrow}
          heading={
            <>
              Hold a <em>slot</em>
            </>
          }
          standfirst={FORM_COPY.standfirst}
          headingId="reserve-heading"
        />

        <div className="d2-page">
          <div />
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
            <OrderCard />

            <aside className="flex flex-col gap-9 lg:sticky lg:top-32 lg:self-start">
              <Set>
                <p className="d2-caps border-b border-[var(--ink)] pb-2 text-[var(--ink-3)]">
                  What happens next
                </p>
                <ol className="mt-3">
                  {FORM_COPY.whatHappensNext.map((step, i) => (
                    <li
                      key={step}
                      className="grid grid-cols-[1.5rem_1fr] gap-2 border-b border-[var(--rule)] py-2.5 last:border-0"
                    >
                      <span className="d2-figure text-[0.6875rem] text-[var(--accent)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="d2-prose text-[0.8125rem] leading-snug text-[var(--ink-2)] text-pretty">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </Set>

              <Set delay={0.06}>
                <p className="d2-caps border-b border-[var(--ink)] pb-2 text-[var(--ink-3)]">
                  Specification of the slot
                </p>
                <dl className="mt-3">
                  {[
                    ["Hardware", `${FLEET.gpusPerNode} × B300 per node`, "facility"],
                    ["Memory", `${NODE.hbmGbFormatted} GB per node`, "nvidiaBlackwellUltra"],
                    ["Access", ACCESS.model + ", SSH", "facility"],
                    ["On-demand", RATE.full, "ours"],
                    ["Terms", `${CONTRACT.model}, ${CONTRACT.termYears}`, "facility"],
                    ["Online", SITE.availability, "facility"],
                  ].map(([k, v, src]) => (
                    <div key={k} className="d2-leader border-b border-[var(--rule)] py-2 last:border-0">
                      <dt className="d2-caps shrink-0 text-[0.5rem] text-[var(--ink-3)]">{k}</dt>
                      <dd className="d2-figure shrink-0 text-[0.75rem]">
                        {v}
                        <Cite sourceId={src} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </Set>

              <Set delay={0.12}>
                <div className="border-l-2 border-[var(--caution)] pl-4">
                  <p className="d2-caps text-[var(--caution)]">Read before submitting</p>
                  <p className="d2-prose mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                    {CANDOUR.paragraphs[1]}
                  </p>
                </div>
              </Set>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
