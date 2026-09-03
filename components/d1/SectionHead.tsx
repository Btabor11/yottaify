/**
 * Section header. Identical structure every time it appears — index, rule,
 * eyebrow, then heading and standfirst on the text grid. The repetition is the
 * point: it makes the page feel like one instrument with numbered channels.
 */
export function SectionHead({
  index,
  eyebrow,
  heading,
  standfirst,
  aside,
  id,
}: {
  index: string;
  eyebrow: string;
  heading: string;
  standfirst?: string;
  aside?: React.ReactNode;
  id?: string;
}) {
  return (
    <header className="pb-10 md:pb-14">
      <div className="d1-sechead">
        <span className="d1-figure text-[0.625rem] text-[var(--accent)]">{index}</span>
        <span aria-hidden data-reveal-rule className="h-px w-full bg-[var(--rule)]" />
        <span className="d1-label text-[var(--ink-3)]">{eyebrow}</span>
      </div>

      <div className="mt-8 grid gap-x-16 gap-y-6 md:mt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <h2
          id={id}
          data-reveal
          className="d1-display-loose max-w-[24ch] text-[clamp(1.875rem,4.6vw,3.5rem)] text-balance"
        >
          {heading}
        </h2>

        <div className="flex flex-col gap-4">
          {standfirst && (
            <p
              data-reveal
              className="d1-body max-w-[42ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty md:text-[1rem]"
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
