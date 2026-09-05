import type { ReactNode } from "react";
import { SITE } from "@/config/site";
import { TITLEBLOCK, formatAsOfShort } from "@/content";

/**
 * Sheet header. Every paper section opens with a drawing title block — sheet
 * number, title, check date, scale — and then the heading at poster weight.
 * Identical structure each time, so the paperwork reads as one document.
 */
export function Bay({
  index,
  eyebrow,
  heading,
  standfirst,
  aside,
  headingId,
}: {
  index: string;
  eyebrow: string;
  heading: ReactNode;
  standfirst?: ReactNode;
  aside?: ReactNode;
  headingId?: string;
}) {
  return (
    <header className="pb-10 md:pb-14">
      <dl className="d3-titleblock" data-r>
        <div>
          <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.sheet}</dt>
          <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink)] md:text-[1.125rem] md:leading-none">
            {index}
            <span className="d3-tag ml-2 text-[0.5rem] text-[var(--ink-3)]">
              {TITLEBLOCK.of} {String(TITLEBLOCK.total).padStart(2, "0")}
            </span>
          </dd>
        </div>
        <div>
          <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.title}</dt>
          <dd className="d3-display mt-1 text-[1rem] leading-[1.05] text-[var(--accent)] md:text-[1.125rem] md:leading-none" style={{ ["--wght" as string]: 700 }}>
            {eyebrow}
          </dd>
        </div>
        <div>
          <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.checked}</dt>
          <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink)] md:text-[1.125rem] md:leading-none">
            {formatAsOfShort(SITE.pricingAsOf)}
          </dd>
        </div>
        <div>
          <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{TITLEBLOCK.scale}</dt>
          <dd className="d3-figure mt-1 text-[1rem] leading-[1.15] text-[var(--ink-2)] md:text-[1.125rem] md:leading-none">
            {TITLEBLOCK.scaleValue}
          </dd>
        </div>
      </dl>

      <div className="mt-9 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
        <h2
          id={headingId}
          className="d3-display max-w-[7.7em] text-[clamp(2.5rem,7.2vw,6.25rem)] text-balance"
          data-load
          data-load-from="300"
        >
          {heading}
        </h2>
        <div className="flex flex-col gap-5">
          {standfirst && (
            <p className="d3-body max-w-[46ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty" data-r>
              {standfirst}
            </p>
          )}
          {aside}
        </div>
      </div>
    </header>
  );
}
