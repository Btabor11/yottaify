"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SITE } from "@/config/site";
import { NAV, STORY, STORY_OPENING, SECTIONS, TITLEBLOCK } from "@/content";
import { trackCta } from "@/lib/analytics";
import { subscribeScroll } from "@/lib/scroll-runtime";

/**
 * Wordmark as a nameplate: monogram in a boxed cell, the name in the
 * stencilled face beside it.
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
      <span className="d3-display text-[1.375rem] leading-none" style={{ ["--wght" as string]: 800 }}>
        {SITE.name}
      </span>
    </Link>
  );
}

/**
 * Which ground the fixed chrome is standing over. The chrome lives outside
 * `.d3-paper`, so it rebinds its own tokens by taking the class itself the
 * moment the paper passes under it. One measurement, one boolean.
 */
function useGround(): "dark" | "paper" {
  const [ground, setGround] = useState<"dark" | "paper">("dark");
  useEffect(() => {
    const paper = document.querySelector<HTMLElement>(".d3-paper");
    if (!paper) return;
    let over = false;
    return subscribeScroll({
      read: () => {
        const rect = paper.getBoundingClientRect();
        const next = rect.top <= 40 && rect.bottom > 40;
        // Only a crossing is worth a render. Setting state from a value that
        // has not changed is the one way this could re-render on every frame.
        if (next === over) return;
        over = next;
        setGround(next ? "paper" : "dark");
      },
    });
  }, []);
  return ground;
}

interface Stop {
  id: string;
  mark: string;
  label: string;
  href: string;
  kind: "chapter" | "sheet";
}

/** Every stop on the page, in order: the chapters of the story, then the sheets. */
function stops(): Stop[] {
  const chapters: Stop[] = [
    { id: "hero-heading", mark: "00", label: SITE.tagline, href: "#main", kind: "chapter" },
    ...STORY.map((c) => ({
      id: `chapter-${c.id}`,
      mark: c.index,
      label: c.eyebrow,
      href: `#chapter-${c.id}`,
      kind: "chapter" as const,
    })),
  ];
  const sheets: Stop[] = NAV.filter((n) => !n.cta).map((n) => {
    const id = n.href.replace("#", "");
    const sec = SECTIONS[id as keyof typeof SECTIONS];
    return { id, mark: sec?.index ?? "", label: n.label, href: n.href, kind: "sheet" as const };
  });
  return [...chapters, ...sheets];
}

const NO_STOPS: Stop[] = [];

/** The stop currently on screen. Observed, not computed from scroll maths. */
function useActiveStop(list: Stop[]): Stop | undefined {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const els = list
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el))
      // The hero heading is small; observe its chapter instead.
      .map((el) => el.closest<HTMLElement>("[data-chapter]") ?? el);
    if (!els.length) return;
    // Track everything currently crossing the band, then pick the top-most.
    // Deciding from the changed entries alone misses the case where the
    // previous stop leaves the band after the next one has already entered.
    const inBand = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target);
          else inBand.delete(e.target);
        }
        const top = [...inBand].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
        if (!top) return;
        const hit = list.find((s) => {
          const el = document.getElementById(s.id);
          return el && (el === top || top.contains(el));
        });
        if (hit) setActive(hit.id);
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [list]);
  return list.find((s) => s.id === active);
}

/**
 * Fixed header. The hairline under it is a live scroll gauge; the readout in
 * the middle names the chapter or sheet on screen, which on a long page is the
 * persistent answer to "where am I".
 */
export function D3Nav({ onPricingPage = false }: { onPricingPage?: boolean }) {
  const gauge = useRef<HTMLDivElement>(null);
  const [solid, setSolid] = useState(false);
  const ground = useGround();
  const [list] = useState(stops);
  const active = useActiveStop(onPricingPage ? NO_STOPS : list);

  useEffect(() => {
    let atTop = true;
    let written = -1;
    return subscribeScroll({
      // A pure writer: the document height it needs was measured for the
      // whole frame, so the gauge costs a transform and nothing else.
      write: (frame) => {
        const max = frame.docHeight - frame.vh;
        const p = max > 0 ? Math.min(1, Math.max(0, frame.scrollY / max)) : 0;
        // A hairline 1440px wide cannot show more than about a thousand
        // distinct positions, and each write is a composited layer update.
        const step = Math.round(p * 1000);
        if (gauge.current && step !== written) {
          written = step;
          gauge.current.style.transform = `scaleX(${step / 1000})`;
        }
        const next = frame.scrollY <= 24;
        if (next === atTop) return;
        atTop = next;
        setSolid(!next);
      },
    });
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${ground === "paper" ? "d3-paper" : ""}`}
      style={{
        background: solid ? "color-mix(in oklab, var(--bg) 86%, transparent)" : "transparent",
        backdropFilter: solid ? "blur(14px)" : undefined,
      }}
    >
      <div className="d3-shell flex h-16 items-center justify-between gap-6">
        <D3Logo />

        {/* Readout. Hidden until there is something to report. */}
        <p
          aria-live="polite"
          className="d3-tag hidden min-w-0 items-baseline gap-3 overflow-hidden whitespace-nowrap text-[0.5625rem] text-[var(--ink-3)] md:flex"
          style={{ opacity: active && solid ? 1 : 0, transition: "opacity 300ms" }}
        >
          {active && (
            <>
              <span className="text-[var(--live)]">
                {active.kind === "chapter" ? STORY_OPENING.chapterWord : TITLEBLOCK.sheet} {active.mark}
              </span>
              <span aria-hidden className="text-[var(--rule-strong)]">/</span>
              <span className="min-w-0 truncate text-[var(--ink-2)]">{active.label}</span>
            </>
          )}
        </p>

        <nav aria-label="Sections" className="flex items-center gap-1.5 sm:gap-4 lg:gap-5">
          {onPricingPage ? (
            <Link href="/" className="d3-tag text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]">
              ← Overview
            </Link>
          ) : (
            NAV.filter((n) => !n.cta).map((item, i) => (
              <a
                key={item.id}
                href={item.href}
                className={`d3-tag hidden text-[var(--ink-2)] transition-colors hover:text-[var(--accent)] ${
                  i < 3 ? "sm:block" : "lg:block"
                }`}
              >
                {item.label}
              </a>
            ))
          )}
          <a
            href={onPricingPage ? "/#reserve" : "#reserve"}
            onClick={() => trackCta("d3", "nav")}
            className="d3-btn shrink-0 px-3 py-2 text-[0.5625rem] sm:px-4"
          >
            Reserve
          </a>
        </nav>
      </div>

      <div className="relative h-px w-full bg-[var(--rule)]">
        <div
          ref={gauge}
          aria-hidden
          className="h-full w-full origin-left"
          style={{ transform: "scaleX(0)", background: "var(--live)" }}
        />
      </div>
    </header>
  );
}

