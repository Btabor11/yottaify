import { STORY_CLOSE } from "@/content";

/**
 * The seam between the two halves. The stage scrolls away beneath this and
 * the paper rises over it — the lights coming on — so this block's only job
 * is to say what changed: above was specification, below is evidence.
 *
 * The ticker along the top edge is a running caption, not navigation, and it
 * is duplicated so the loop has no seam. Under reduced motion it stands still
 * and reads once.
 */
export function Paperwork() {
  const line = STORY_CLOSE.ticker;
  return (
    <section aria-labelledby="paperwork-heading" className="relative overflow-hidden border-b border-[var(--rule-strong)]">
      <div aria-hidden className="d3-contours pointer-events-none absolute inset-0 opacity-60" />

      <div className="relative overflow-hidden border-b border-[var(--rule-strong)] py-2.5">
        <div className="d3-run" aria-hidden>
          {[0, 1].map((k) => (
            <span key={k} className="d3-tag flex text-[0.5625rem] text-[var(--ink-2)]">
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className="px-6">
                  {line}
                  <span className="ml-6 text-[var(--accent)]">■</span>
                </span>
              ))}
            </span>
          ))}
        </div>
        <p className="sr-only">{line}</p>
      </div>

      <div className="d3-shell relative grid gap-x-16 gap-y-8 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-end">
        <div>
          <p className="d3-mark d3-tag text-[var(--accent)]">{STORY_CLOSE.eyebrow}</p>
          <h2
            id="paperwork-heading"
            className="d3-display mt-5 text-[clamp(3rem,10vw,9.5rem)]"
            data-load
            data-load-from="300"
          >
            {STORY_CLOSE.heading}
          </h2>
        </div>
        <p className="d3-body max-w-[46ch] text-[1rem] text-[var(--ink-2)] text-pretty md:text-[1.125rem]" data-r>
          {STORY_CLOSE.body}
        </p>
      </div>
    </section>
  );
}
