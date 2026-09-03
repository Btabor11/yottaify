"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { NAV, FLEET, POWER } from "@/content";
import { trackCta } from "@/lib/analytics";

/** Wordmark. Reads SITE.name — renaming the company renames this. */
export function D1Logo({ href = "/d1" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group flex items-baseline gap-2.5"
      aria-label={`${SITE.name} — home`}
    >
      <span
        aria-hidden
        className="relative grid h-6 w-6 shrink-0 place-items-center border border-[var(--accent)] font-[family-name:var(--fm)] text-[0.5rem] font-bold tracking-[0.02em] text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-ink)]"
      >
        {SITE.monogram}
      </span>
      <span className="d1-display-loose text-[1.0625rem] uppercase tracking-[0.08em]">
        {SITE.name}
      </span>
    </Link>
  );
}

export function D1Nav({ onPricingPage = false }: { onPricingPage?: boolean }) {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300"
      style={{
        backgroundColor: lifted ? "color-mix(in oklab, var(--bg) 88%, transparent)" : "transparent",
        borderBottom: `1px solid ${lifted ? "var(--rule)" : "transparent"}`,
        backdropFilter: lifted ? "blur(12px)" : "none",
      }}
    >
      <div className="d1-shell flex h-14 items-center justify-between gap-6">
        <D1Logo />

        <nav aria-label="Sections" className="flex items-center gap-1 sm:gap-2">
          {onPricingPage ? (
            <Link href="/d1" className="d1-label px-3 py-2 text-[var(--ink-2)] hover:text-[var(--ink)]">
              ← Overview
            </Link>
          ) : (
            NAV.filter((n) => !n.cta).map((item) => (
              <a
                key={item.id}
                href={item.id === "pricing" ? "#pricing" : item.href}
                className="d1-label hidden px-3 py-2 text-[var(--ink-2)] transition-colors hover:text-[var(--ink)] sm:block"
              >
                {item.label}
              </a>
            ))
          )}
          <a
            href={onPricingPage ? "/d1#reserve" : "#reserve"}
            onClick={() => trackCta("d1", "nav")}
            className="d1-label ml-1 border border-[var(--accent)] px-3.5 py-2 text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
          >
            Reserve
          </a>
        </nav>
      </div>
    </header>
  );
}

/**
 * Telemetry strip. Every value is a fact from content/, presented the way a
 * facility header line would present it. No invented readings.
 */
export function D1StatusStrip() {
  const cells = [
    ["FLEET", `${FLEET.total} × B300`],
    ["NODES", `${FLEET.nodes} × ${FLEET.gpusPerNode}`],
    ["COOLING", FLEET.cooling],
    ["LOAD", `~${POWER.loadKw} kW`],
    ["CURRENT", POWER.service],
    ["SITE", SITE.location.region.toUpperCase()],
    ["ACCESS", "BARE METAL · SSH"],
    ["ONLINE", SITE.availability.toUpperCase()],
  ];

  const Run = ({ ariaHidden }: { ariaHidden?: boolean }) => (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden || undefined}>
      {cells.map(([label, value], i) => (
        <span key={`${label}-${i}`} className="flex items-center whitespace-nowrap">
          <span className="d1-label px-4 text-[var(--ink-3)]">
            {label}
            <span aria-hidden className="mx-2 text-[var(--rule-strong)]">/</span>
            <span className="d1-figure text-[var(--ink-2)]">{value}</span>
          </span>
          <span aria-hidden className="h-2.5 w-px bg-[var(--rule-strong)]" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y border-[var(--rule)] bg-[var(--surface)] py-2">
      <div className="d1-marquee-track">
        <Run />
        {/* Second copy makes the loop seamless; hidden from the a11y tree. */}
        <Run ariaHidden />
      </div>
    </div>
  );
}
