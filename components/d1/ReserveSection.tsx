import { SITE } from "@/config/site";
import { SECTIONS, FORM_COPY, CONTRACT, RATE, FLEET, NODE, CANDOUR } from "@/content";
import { SectionHead } from "./SectionHead";
import { ReservationForm } from "./ReservationForm";

/**
 * The form sits in the wider column with a sticky rail beside it. The rail
 * answers the three questions a buyer has while filling this in — what am I
 * committing to, what happens next, and what am I actually getting — so none
 * of them require scrolling away from the fields.
 */
export function ReserveSection() {
  return (
    <section
      id="reserve"
      className="scroll-mt-16 border-y border-[var(--rule-strong)] bg-[var(--surface)]/50 py-20 md:py-28"
    >
      <div className="d1-shell">
        <SectionHead
          index={SECTIONS.reserve.index}
          eyebrow={FORM_COPY.eyebrow}
          heading={FORM_COPY.heading}
          standfirst={FORM_COPY.standfirst}
          id="reserve-heading"
        />

        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <ReservationForm />

          <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
            <div>
              <p className="d1-label border-b border-[var(--rule-strong)] pb-2.5 text-[var(--ink-3)]">
                What happens next
              </p>
              <ol className="mt-4 space-y-4">
                {FORM_COPY.whatHappensNext.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="d1-figure mt-[0.15em] shrink-0 text-[0.625rem] text-[var(--accent)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="d1-body text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <p className="d1-label border-b border-[var(--rule-strong)] pb-2.5 text-[var(--ink-3)]">
                What you would be reserving
              </p>
              <dl className="mt-4 space-y-3">
                {[
                  ["Hardware", `${FLEET.gpusPerNode} × ${"B300"} per node`],
                  ["Memory", `${NODE.hbmGbFormatted} GB HBM3e per node`],
                  ["Access", "Bare metal, SSH"],
                  ["On-demand", RATE.full],
                  ["Terms", `${CONTRACT.model}, ${CONTRACT.termYears}`],
                  ["Online", SITE.availability],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4">
                    <dt className="d1-label text-[var(--ink-3)]">{k}</dt>
                    <dd className="d1-figure text-right text-[0.75rem] text-[var(--ink)]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The honesty, restated at the moment of decision. A buyer who is
                about to submit is exactly who needs to read it. */}
            <div className="border-l-2 border-[var(--caution)] pl-4">
              <p className="d1-label text-[var(--caution)]">Read before submitting</p>
              <p className="d1-body mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">
                {CANDOUR.paragraphs[1]}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
