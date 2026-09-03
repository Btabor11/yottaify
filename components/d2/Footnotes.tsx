import { formatAsOf, VERIFICATION_LABEL } from "@/content";
import { allFootnotes } from "./apparatus";
import { Rule } from "./Reveal";

/**
 * The source apparatus.
 *
 * This is the load-bearing element of D2. The brief requires every price to
 * carry a source and a date visible to the user; a document answers that with
 * a numbered apparatus rather than a tooltip. It also happens to be the single
 * most persuasive block on the page for the buyer this site is for.
 */
export function Footnotes({ heading = "Sources" }: { heading?: string }) {
  const notes = allFootnotes();

  return (
    <section aria-labelledby="sources-heading" className="d2-page">
      <div className="lg:pt-1">
        <p className="d2-caps text-[var(--ink-3)]">{heading}</p>
      </div>

      <div>
        <Rule className="d2-rule mb-6" />
        <h2 id="sources-heading" className="sr-only">
          {heading}
        </h2>

        <ol className="grid gap-x-12 gap-y-0 lg:grid-cols-2">
          {notes.map((note) => (
            <li
              key={note.n}
              id={`fn-${note.n}`}
              className="grid scroll-mt-32 grid-cols-[1.75rem_1fr] gap-3 border-b border-[var(--rule)] py-3.5 target:bg-[color-mix(in_oklab,var(--accent)_9%,transparent)]"
            >
              <span className="d2-figure pt-[0.15rem] text-[0.75rem] text-[var(--accent)]">
                {note.n}
              </span>
              <div>
                <p className="d2-prose text-[0.9375rem] leading-snug">
                  {note.source.url ? (
                    <a
                      href={note.source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="d2-link"
                    >
                      {note.source.label}
                    </a>
                  ) : (
                    note.source.label
                  )}
                  <span className="d2-caps ml-2 whitespace-nowrap text-[0.5rem] text-[var(--ink-3)]">
                    {VERIFICATION_LABEL[note.source.kind]}
                  </span>
                </p>
                <p className="d2-prose mt-1.5 max-w-[54ch] text-[0.8125rem] leading-[1.55] text-[var(--ink-3)] text-pretty">
                  {note.source.note}
                </p>
                <p className="d2-caps mt-1.5 text-[0.5rem] text-[var(--ink-3)]">
                  Read {formatAsOf(note.source.accessed)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
