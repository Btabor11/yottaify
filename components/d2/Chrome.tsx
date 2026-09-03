"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { NAV, FLEET, formatAsOfShort } from "@/content";
import { trackCta } from "@/lib/analytics";

/** Wordmark, set in the display serif. Reads SITE.name. */
export function D2Logo({ href = "/d2" }: { href?: string }) {
  return (
    <Link href={href} aria-label={`${SITE.name} — home`} className="group inline-flex items-baseline gap-2">
      <span className="d2-display text-[1.5rem] leading-none tracking-[-0.01em] transition-colors group-hover:text-[var(--accent)]">
        {SITE.name}
      </span>
      <span aria-hidden className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
        Est. 2026
      </span>
    </Link>
  );
}

/**
 * Masthead. A broadsheet nameplate rather than an app bar: a folio line above,
 * the nameplate and a contents-style nav below, and a heavy rule holding it all
 * to the page.
 */
export function D2Masthead({ onPricingPage = false }: { onPricingPage?: boolean }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg)]">
      {/* Folio line. The date is the point — this direction is dated matter.
          Collapsed with a grid row rather than a max-height, so the open state
          is whatever the content needs. A fixed height was clipping the second
          line the moment the two halves wrapped onto separate rows. */}
      <div
        className="grid border-b border-[var(--rule)] transition-[grid-template-rows,opacity] duration-500"
        style={{ gridTemplateRows: compact ? "0fr" : "1fr", opacity: compact ? 0 : 1 }}
      >
        <div className="d2-shell flex min-h-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 overflow-hidden py-2">
          <p className="d2-caps text-[0.5625rem] text-[var(--ink-3)]">
            Prospectus · No. 01 · {formatAsOfShort(SITE.pricingAsOf)}
          </p>
          <p className="d2-caps text-[0.5625rem] text-[var(--ink-3)]">
            {FLEET.total} × NVIDIA B300 · {SITE.location.region} · {SITE.availabilityShort}
          </p>
        </div>
      </div>

      <div className="d2-shell flex items-center justify-between gap-3 py-3 sm:gap-6">
        <D2Logo />

        <nav aria-label="Contents" className="flex min-w-0 items-center gap-3 sm:gap-5">
          {onPricingPage ? (
            <Link
              href="/d2"
              className="d2-caps truncate text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
            >
              ← Prospectus
            </Link>
          ) : (
            NAV.filter((n) => !n.cta).map((item, i) => (
              <a
                key={item.id}
                href={item.href}
                className="d2-caps hidden items-baseline gap-1.5 text-[var(--ink-2)] transition-colors hover:text-[var(--accent)] sm:inline-flex"
              >
                <span className="d2-figure text-[0.5625rem] text-[var(--ink-3)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            ))
          )}
          <a
            href={onPricingPage ? "/d2#reserve" : "#reserve"}
            onClick={() => trackCta("d2", "masthead")}
            className="d2-btn shrink-0 px-3 py-2 text-[0.625rem] sm:px-4"
          >
            Reserve
          </a>
        </nav>
      </div>

      <div className="d2-shell">
        <div className="d2-rule-heavy" />
      </div>
    </header>
  );
}
