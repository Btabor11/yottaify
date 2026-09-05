import { STORY_OPENING, source, formatAsOfShort, type StoryChapter } from "@/content";

/**
 * One stop on the path of the current.
 *
 * The heading is real text, set as a hairline and charged to full weight as it
 * enters — the same choreography as the hero, so the page reads as one voice.
 * The italic clause is the promise; the stencilled clause is the fact. The
 * readout on the right is the chapter's three figures with the source they
 * rest on, because a story on this site is not allowed to be unsourced.
 */
export function Chapter({ chapter }: { chapter: StoryChapter }) {
  const src = source(chapter.sourceId);
  return (
    <article
      id={`chapter-${chapter.id}`}
      className="d3-chapter"
      data-chapter={chapter.index}
      data-shape={chapter.shape}
      aria-labelledby={`chapter-${chapter.id}-heading`}
    >
      <div className="d3-shell grid gap-x-12 gap-y-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:items-end">
        <div>
          <p className="d3-mark d3-tag text-[var(--live)]">
            {STORY_OPENING.chapterWord} {chapter.index}
            <span aria-hidden className="text-[var(--ink-3)]">—</span>
            <span className="text-[var(--ink-2)]">{chapter.eyebrow}</span>
          </p>

          <h2
            id={`chapter-${chapter.id}-heading`}
            className="d3-display mt-6 max-w-[6.75em] text-[clamp(2.75rem,8.2vw,7.5rem)] text-balance md:mt-5"
            data-load
            data-load-from="300"
          >
            {chapter.heading}
            {chapter.voice && (
              <>
                {" "}
                <span className="d3-voice block text-[0.92em] text-[var(--live)]">{chapter.voice}</span>
              </>
            )}
          </h2>

          <p
            className="d3-body mt-7 max-w-[52ch] text-[0.9375rem] leading-[1.7] text-[var(--ink-2)] text-pretty md:mt-6 md:text-[1.0625rem] md:leading-[1.6]"
            data-r
          >
            {chapter.body}
          </p>
        </div>

        <dl className="d3-panel d3-ticks" data-r data-r-y="14">
          {chapter.readout.map((r) => (
            <div
              key={r.k}
              className="flex items-baseline justify-between gap-4 border-b border-[var(--rule)] px-4 py-3 last:border-0"
            >
              <dt className="d3-tag text-[0.5625rem] text-[var(--ink-3)]">{r.k}</dt>
              <dd
                className="d3-figure text-right text-[0.9375rem]"
                style={{ color: r.lead ? "var(--live)" : "var(--ink)" }}
              >
                {r.v}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 border-t border-[var(--rule-strong)] px-4 py-2.5">
            <dt className="d3-tag text-[0.5rem] text-[var(--ink-3)]">Source</dt>
            <dd className="d3-tag text-right text-[0.5rem] text-[var(--ink-3)]">
              {src.label} · {formatAsOfShort(src.accessed)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
