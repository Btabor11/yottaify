import type { ReactNode } from "react";

/**
 * Section opener. Every section on this page is a "bay" on the bus: a number
 * tapped off the conductor in the left column, and the heading in the main
 * one. Identical structure each time, so the page reads as one circuit.
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
    <header className="d3-bus pb-10 md:pb-14">
      <div>
        <p
          className="d3-figure text-[2.5rem] leading-none text-[var(--ink-3)]"
          data-r
          data-r-y="10"
        >
          {index}
        </p>
        <p className="d3-tag mt-2 text-[0.5625rem] text-[var(--accent)]">{eyebrow}</p>
      </div>

      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end">
        <h2
          id={headingId}
          className="d3-display max-w-[18ch] text-[clamp(1.875rem,5.2vw,4.25rem)] text-balance"
          data-load
          data-load-from="72"
        >
          {heading}
        </h2>
        <div className="flex flex-col gap-5">
          {standfirst && (
            <p
              className="d3-body max-w-[46ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty"
              data-r
            >
              {standfirst}
            </p>
          )}
          {aside}
        </div>
      </div>
    </header>
  );
}
