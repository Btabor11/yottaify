import { Rule } from "./Reveal";

/**
 * Chapter opener. Number in the margin, heading on the text grid, standfirst
 * below at a printed measure. Identical every time — chapters in a document
 * do not each get their own layout.
 */
export function Chapter({
  index,
  eyebrow,
  heading,
  standfirst,
  aside,
  id,
  headingId,
}: {
  index: string;
  eyebrow: string;
  heading: React.ReactNode;
  standfirst?: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
  headingId?: string;
}) {
  return (
    <header id={id} className="d2-page pb-10 md:pb-14">
      <div className="lg:pt-2">
        <p className="d2-figure text-[2.25rem] leading-none text-[var(--rule-strong)] lg:text-[3rem]">
          {index}
        </p>
        <p className="d2-caps mt-2 text-[var(--ink-3)] lg:mt-3">{eyebrow}</p>
      </div>

      <div>
        <Rule className="d2-rule-heavy mb-7" />
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <h2
            id={headingId}
            className="d2-display max-w-[22ch] text-[clamp(1.875rem,5vw,3.75rem)] text-balance"
          >
            {heading}
          </h2>
          <div className="flex flex-col gap-5">
            {standfirst && (
              <p className="d2-prose max-w-[46ch] text-[1rem] text-[var(--ink-2)] text-pretty">
                {standfirst}
              </p>
            )}
            {aside}
          </div>
        </div>
      </div>
    </header>
  );
}
