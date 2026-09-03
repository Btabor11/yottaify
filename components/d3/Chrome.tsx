"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/config/site";
import { NAV, FLEET, POWER, RATE } from "@/content";
import { trackCta } from "@/lib/analytics";

/**
 * Wordmark as a nameplate: monogram in a boxed cell, name beside it, live pip.
 * The pip is the only always-on animation on the page and it is 8px wide.
 */
export function D3Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} aria-label={`${SITE.name} — home`} className="group inline-flex items-center gap-3">
      <span
        aria-hidden
        className="d3-figure grid h-7 w-7 place-items-center border border-[var(--edge)] text-[0.6875rem] transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]"
      >
        {SITE.monogram}
      </span>
      <span className="d3-display text-[1.0625rem] leading-none" style={{ ["--wdth" as string]: 112 }}>
        {SITE.name}
      </span>
    </Link>
  );
}

/**
 * Fixed header. The hairline under it is a live scroll gauge — the one piece of
 * persistent chrome that reports state, which is what a control room does.
 */
export function D3Nav({ onPricingPage = false }: { onPricingPage?: boolean }) {
  const gauge = useRef<HTMLDivElement>(null);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (gauge.current) gauge.current.style.transform = `scaleX(${p})`;
      setSolid(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300"
      style={{
        background: solid ? "color-mix(in oklab, var(--bg) 88%, transparent)" : "transparent",
        backdropFilter: solid ? "blur(14px)" : undefined,
      }}
    >
      <div className="d3-shell flex h-16 items-center justify-between gap-6">
        <D3Logo />

        <nav aria-label="Sections" className="flex items-center gap-1.5 sm:gap-4">
          {onPricingPage ? (
            <Link
              href="/"
              className="d3-tag text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
            >
              ← Overview
            </Link>
          ) : (
            NAV.filter((n) => !n.cta).map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="d3-tag hidden text-[var(--ink-2)] transition-colors hover:text-[var(--accent)] sm:block"
              >
                {item.label}
              </a>
            ))
          )}
          <a
            href={onPricingPage ? "/d3#reserve" : "#reserve"}
            onClick={() => trackCta("d3", "nav")}
            className="d3-btn shrink-0 px-3 py-2 text-[0.625rem] sm:px-4"
          >
            Reserve
          </a>
        </nav>
      </div>

      <div className="relative h-px w-full bg-[var(--rule)]">
        <div
          ref={gauge}
          aria-hidden
          className="h-full w-full origin-left bg-[var(--accent)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </header>
  );
}

/**
 * Telemetry rail. Fixed to the left edge on large screens, reporting the four
 * facts that never change and which section is on screen.
 *
 * Not decoration: on a long page this is the only persistent answer to "where
 * am I and what am I looking at". Hidden below xl, where there is no room.
 */
export function D3Rail() {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const ids = NAV.map((n) => n.href.replace("#", ""));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // No section is active while the hero is on screen, and the rail must not
  // sit on top of the headline. So it fades in with the first bay and out again
  // if you scroll back to the top.
  const shown = activeId !== "";

  return (
    <aside
      aria-hidden
      className="pointer-events-none fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 pl-[max(1rem,calc((100vw-90rem)/2+1rem))] transition-opacity duration-500 xl:block"
      style={{ opacity: shown ? 1 : 0 }}
    >
      <ul className="flex flex-col gap-3 border-l border-[var(--rule-strong)] pl-3">
        {NAV.map((item) => {
          const id = item.href.replace("#", "");
          const on = activeId === id;
          return (
            <li key={item.id} className="flex items-center gap-2">
              <span
                className="h-px transition-all duration-500"
                style={{
                  width: on ? "1.25rem" : "0.5rem",
                  background: on ? "var(--accent)" : "var(--rule-strong)",
                }}
              />
              <span
                className="d3-tag text-[0.5rem] transition-colors duration-300"
                style={{ color: on ? "var(--accent)" : "var(--ink-3)" }}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="mt-8 flex flex-col gap-2.5 border-l border-[var(--rule-strong)] pl-3">
        {[
          ["Fleet", `${FLEET.total} × B300`],
          ["Load", `~${POWER.loadKw} kW`],
          ["Rate", RATE.display],
          ["Online", SITE.availabilityShort],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">{k}</dt>
            <dd className="d3-figure text-[0.6875rem] text-[var(--ink-2)]">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
