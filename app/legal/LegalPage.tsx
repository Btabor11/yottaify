import { LEGAL_NOTICE, formatAsOf, type LegalSection } from "@/content";

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <article>
      <header className="border-b border-[var(--rule)] pb-10">
        <h1 className="font-[family-name:var(--fd)] text-[clamp(2.25rem,6vw,3.75rem)] font-normal leading-[1.05] tracking-[-0.02em]">
          {title}
        </h1>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 font-[family-name:var(--fm)] text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--ink-3)]">
          <span className="text-[var(--accent)]">{LEGAL_NOTICE.marker}</span>
          <span>Last updated {formatAsOf(updated)}</span>
        </div>
        <p className="mt-8 max-w-[38rem] text-[1.0625rem] leading-[1.65] text-[var(--ink-2)] text-pretty">
          {LEGAL_NOTICE.explainer}
        </p>
      </header>

      <div className="mt-16 grid gap-x-16 gap-y-12 md:grid-cols-[9rem_1fr]">
        {sections.map((section, i) => (
          <section key={section.heading} className="contents">
            <h2 className="font-[family-name:var(--fm)] text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--ink-3)] md:pt-[0.4rem]">
              <span className="tnum mr-3 text-[var(--ink-3)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.heading}
            </h2>
            <div className="max-w-[38rem] space-y-5 border-b border-[var(--rule)] pb-12 last:border-0 md:pb-0 md:[&:not(:last-child)]:pb-12">
              {section.paragraphs.map((p) => (
                <p key={p} className="text-[1.0625rem] leading-[1.7] text-pretty">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
