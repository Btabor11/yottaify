import Link from "next/link";
import { SITE } from "@/config/site";
import { FOOTER, FLEET, RATE, FORM_COPY, resolveFooterHref } from "@/content";
import { D1Logo } from "./Chrome";

export function D1Footer({ reserveHref = "#reserve" }: { reserveHref?: string }) {
  return (
    <footer className="border-t border-[var(--rule-strong)] bg-[var(--surface)]">
      {/* Final call to action. A visitor who read to the bottom is the one most
          likely to convert, and making them scroll back up is a tax. */}
      <div className="d1-shell border-b border-[var(--rule)] py-14 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="d1-label text-[var(--ink-3)]">
              {FLEET.total} GPUs · {RATE.full} · {SITE.availability}
            </p>
            <p className="d1-display mt-4 max-w-[18ch] text-[clamp(2rem,6vw,4.5rem)] text-balance">
              {SITE.tagline}
            </p>
          </div>
          <a href={reserveHref} className="d1-btn">
            {FORM_COPY.eyebrow}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="d1-shell grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-16">
        <div>
          <D1Logo />
          <p className="d1-label mt-4 text-[var(--ink-3)]">{FOOTER.wordmarkNote}</p>
        </div>

        {FOOTER.columns.map((col) => (
          <nav key={col.id} aria-label={col.label}>
            <p className="d1-label text-[var(--ink-3)]">{col.label}</p>
            <ul className="mt-3.5 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={resolveFooterHref(link, "d1")}
                    className="d1-body text-[0.8125rem] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="d1-shell border-t border-[var(--rule)] py-8">
        <p className="d1-label max-w-[92ch] normal-case tracking-[0.03em] text-[var(--ink-3)]">
          {FOOTER.disclosure}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="d1-label text-[var(--ink-3)]">{FOOTER.copyright}</span>
          <a href={`mailto:${SITE.email.general}`} className="d1-label d1-link">
            {SITE.email.general}
          </a>
        </div>
      </div>
    </footer>
  );
}
