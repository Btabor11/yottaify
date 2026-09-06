import Link from "next/link";
import { SITE } from "@/config/site";
import { FOOTER, FORM_COPY, FLEET, OWNERSHIP, resolveFooterHref } from "@/content";
import { D3Logo } from "./Chrome";

/**
 * Back to the dark. The paper ends, the yard returns, and the closing call is
 * the tagline at the largest size it appears — the promise, in the voice, set
 * against the fact in the stencil.
 */
export function D3Footer({ reserveHref = "#reserve" }: { reserveHref?: string }) {
  const [fact, ...rest] = SITE.tagline.split(" in ");
  const promise = rest.length ? `in ${rest.join(" in ")}` : "";
  return (
    <footer className="relative border-t border-[var(--rule-strong)] bg-[var(--bg)]">
      <div className="relative overflow-hidden border-b border-[var(--rule)]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 140% at 15% 130%, color-mix(in oklab, var(--live) 18%, transparent), transparent 60%)",
          }}
        />
        <div aria-hidden className="d3-grid d3-fade-down absolute inset-0 opacity-50" />
        <div className="d3-shell relative flex flex-wrap items-end justify-between gap-x-10 gap-y-10 py-16 md:gap-y-8 md:py-24">
          <div>
            <p className="d3-tag text-[var(--ink-3)]">
              {FLEET.total} GPUs · {OWNERSHIP.short} · {SITE.availability}
            </p>
            <p className="mt-6 md:mt-5">
              <span className="d3-display block max-w-[5.8em] text-[clamp(2.75rem,9vw,8rem)] text-balance" data-load data-load-from="300">
                {fact}
              </span>
              {promise && (
                <span className="d3-voice block max-w-[16ch] text-[clamp(2.5rem,8vw,7rem)] text-[var(--live)]" data-r>
                  {promise}
                </span>
              )}
            </p>
          </div>
          <a href={reserveHref} className="d3-btn w-full sm:w-auto">
            {FORM_COPY.eyebrow}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="d3-shell grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-16">
        <div>
          <D3Logo />
          <p className="d3-tag mt-4 text-[0.5rem] text-[var(--ink-3)]">{FOOTER.wordmarkNote}</p>
          <a href={`mailto:${SITE.email.general}`} className="d3-body d3-link mt-4 inline-block text-[0.8125rem]">
            {SITE.email.general}
          </a>
        </div>

        {FOOTER.columns.map((col) => (
          <nav key={col.id} aria-label={col.label}>
            <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{col.label}</p>
            <ul className="mt-3.5 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={resolveFooterHref(link)}
                    className="d3-body text-[0.8125rem] text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="d3-shell border-t border-[var(--rule)] py-8">
        <p className="d3-body max-w-[92ch] text-[0.75rem] leading-relaxed text-[var(--ink-3)] text-pretty">
          {FOOTER.disclosure}
        </p>
        <p className="d3-tag mt-5 text-[0.4375rem] text-[var(--ink-3)]">{FOOTER.copyright}</p>
      </div>
    </footer>
  );
}
