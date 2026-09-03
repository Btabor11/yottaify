import Link from "next/link";
import { SITE } from "@/config/site";
import { FOOTER, FORM_COPY, FLEET, RATE, resolveFooterHref } from "@/content";
import { D3Logo } from "./Chrome";

export function D3Footer({ reserveHref = "#reserve" }: { reserveHref?: string }) {
  return (
    <footer className="border-t border-[var(--rule-strong)] bg-[var(--bg)]">
      {/* Closing call. A reader at the bottom is the one most likely to act. */}
      <div className="relative overflow-hidden border-b border-[var(--rule)]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 140% at 15% 130%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 60%)",
          }}
        />
        <div className="d3-shell relative flex flex-wrap items-end justify-between gap-x-10 gap-y-8 py-14 md:py-20">
          <div>
            <p className="d3-tag text-[var(--ink-3)]">
              {FLEET.total} GPUs · {RATE.full} · {SITE.availability}
            </p>
            <p
              className="d3-display mt-4 max-w-[16ch] text-[clamp(2rem,7vw,5.5rem)] text-balance"
              data-load
              data-load-from="68"
            >
              {SITE.tagline}
            </p>
          </div>
          <a href={reserveHref} className="d3-btn">
            {FORM_COPY.eyebrow}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      <div className="d3-shell grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-16">
        <div>
          <D3Logo />
          <p className="d3-tag mt-4 text-[0.5rem] text-[var(--ink-3)]">{FOOTER.wordmarkNote}</p>
          <a
            href={`mailto:${SITE.email.general}`}
            className="d3-body d3-link mt-4 inline-block text-[0.8125rem]"
          >
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
                    href={resolveFooterHref(link, "d3")}
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
