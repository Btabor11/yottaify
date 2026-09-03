import Link from "next/link";
import { SITE } from "@/config/site";
import {
  FOOTER,
  FORM_COPY,
  FLEET,
  RATE,
  resolveFooterHref,
  formatAsOf,
} from "@/content";

/**
 * The imprint. Set as a colophon: the thing a printed document puts on the
 * last page — who made it, when, what it does not claim.
 *
 * A closing CTA sits above it, because a reader who reached the last page is
 * the most likely to act and scrolling back up is a tax.
 */
export function Footer({ reserveHref = "#reserve" }: { reserveHref?: string }) {
  return (
    <footer className="border-t-[3px] border-[var(--ink)] bg-[var(--surface)]">
      <div className="d2-shell border-b border-[var(--rule-strong)] py-14 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <div>
            <p className="d2-caps text-[var(--ink-3)]">
              {FLEET.total} GPUs · {RATE.full} · {SITE.availability}
            </p>
            <p className="d2-display mt-4 max-w-[17ch] text-[clamp(2.25rem,7vw,5rem)] text-balance">
              {SITE.tagline}
            </p>
          </div>
          <a href={reserveHref} className="d2-btn">
            {FORM_COPY.eyebrow}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="d2-shell py-12 md:py-16">
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div>
            <p className="d2-display text-[clamp(2rem,6vw,3.25rem)] leading-none">{SITE.name}</p>
            <p className="d2-caps mt-3 text-[var(--ink-3)]">{FOOTER.wordmarkNote}</p>
            <a
              href={`mailto:${SITE.email.general}`}
              className="d2-prose d2-link mt-4 inline-block text-[0.9375rem]"
            >
              {SITE.email.general}
            </a>
          </div>

          {FOOTER.columns.map((col) => (
            <nav key={col.id} aria-label={col.label} className="md:min-w-[11rem]">
              <p className="d2-caps border-b border-[var(--ink)] pb-2 text-[var(--ink-3)]">
                {col.label}
              </p>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={resolveFooterHref(link, "d2")}
                      className="d2-prose d2-link text-[0.9375rem]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* --- colophon proper ------------------------------------------- */}
        <div className="mt-12 border-t border-[var(--rule-strong)] pt-6">
          <p className="d2-prose d2-measure-wide text-[0.875rem] leading-[1.6] text-[var(--ink-2)] text-pretty">
            {FOOTER.disclosure}
          </p>
          <div className="mt-7 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-[var(--rule)] pt-4">
            <p className="d2-caps text-[0.5rem] text-[var(--ink-3)]">{FOOTER.copyright}</p>
            <p className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
              Issue 01 · Prospectus · Figures as of {formatAsOf(SITE.pricingAsOf)}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
