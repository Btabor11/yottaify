import { SITE } from "@/config/site";
import { SECTIONS, FAQS, FAQ_GROUPS, FAQ_COPY } from "@/content";
import { Bay } from "./Bay";

/**
 * Sheet 05 — the questions, as native disclosures.
 *
 * `<details>` so every answer is reachable with JavaScript off and from the
 * keyboard, grouped the way a buyer's questions arrive: what am I reserving,
 * what do I get, what does it cost, who are you. The answers are the same
 * strings the FAQPage JSON-LD carries, so what search engines quote is what
 * the page says.
 */
export function FaqBay() {
  const groups = Object.keys(FAQ_GROUPS) as Array<keyof typeof FAQ_GROUPS>;
  return (
    <section id="faq" className="relative scroll-mt-24 border-t border-[var(--rule-strong)] bg-[var(--surface)] py-16 md:py-24">
      <div aria-hidden className="d3-ledger pointer-events-none absolute inset-0 opacity-60" />
      <div className="d3-shell relative">
        <Bay
          index={SECTIONS.faq.index}
          eyebrow={FAQ_COPY.eyebrow}
          heading={FAQ_COPY.heading}
          standfirst={FAQ_COPY.standfirst}
          headingId="faq-heading"
          aside={
            <div className="border-l border-[var(--rule-strong)] pl-4" data-r>
              <p className="d3-tag text-[var(--ink-3)]">{FAQ_COPY.askHeading}</p>
              <p className="d3-body mt-2 text-[0.8125rem] text-[var(--ink-2)]">
                <a href={`mailto:${SITE.email.general}`} className="d3-link">
                  {SITE.email.general}
                </a>
                . A person reads it.
              </p>
            </div>
          }
        />

        <div className="grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <nav aria-label="Question groups" className="lg:sticky lg:top-24 lg:self-start">
            <ol className="flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-0">
              {groups.map((g, i) => (
                <li key={g} className="lg:border-b lg:border-[var(--rule)]">
                  <a
                    href={`#faq-${g}`}
                    className="d3-tag flex items-baseline gap-3 py-2.5 text-[0.5625rem] text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
                  >
                    <span className="d3-figure text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                    {FAQ_GROUPS[g]}
                    <span className="ml-auto text-[var(--ink-3)]">{FAQS.filter((f) => f.group === g).length}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-12">
            {groups.map((g, gi) => (
              <div key={g} id={`faq-${g}`} className="scroll-mt-28">
                <p className="d3-tag flex items-baseline gap-3 border-b border-[var(--rule-strong)] pb-2 text-[var(--ink-3)]">
                  <span className="d3-figure text-[var(--accent)]">{String(gi + 1).padStart(2, "0")}</span>
                  {FAQ_GROUPS[g]}
                </p>
                <div data-r-group>
                  {FAQS.filter((f) => f.group === g).map((f) => (
                    <details key={f.id} id={`faq-${f.id}`} className="d3-faq">
                      <summary>
                        <span className="d3-body text-[0.9375rem] font-medium text-[var(--ink)] md:text-[1rem]">{f.q}</span>
                        <span aria-hidden className="d3-faq-mark" />
                      </summary>
                      <p className="d3-body max-w-[66ch] pb-5 text-[0.875rem] text-[var(--ink-2)] text-pretty">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
