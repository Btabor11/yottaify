"use client";

/**
 * REVIEW TOOL — not part of any design direction.
 *
 * A discreet way to jump between /d1, /d2 and /d3 while choosing a direction.
 * Delete this component and its three call sites once a winner is promoted.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DIRECTIONS, type DirectionSlug } from "@/config/site";

export function DirectionSwitcher({ current }: { current: DirectionSlug }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Escape closes, matching every other dismissible surface on the web.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const subpath = pathname.replace(/^\/d[123]/, "");

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-2 print:hidden">
      {open && (
        <ul
          className="pointer-events-auto w-[15rem] overflow-hidden rounded-sm border border-[var(--rule-strong)] bg-[var(--surface)] shadow-2xl"
          aria-label="Design directions"
        >
          {DIRECTIONS.map((d) => {
            const active = d.slug === current;
            return (
              <li key={d.slug} className="border-b border-[var(--rule)] last:border-0">
                <Link
                  href={`/${d.slug}${subpath}`}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="block px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
                >
                  <span className="flex items-baseline gap-2">
                    <span
                      className="font-[family-name:var(--fm)] text-[0.625rem] uppercase tracking-[0.14em]"
                      style={{ color: active ? "var(--accent)" : "var(--ink-3)" }}
                    >
                      {d.slug}
                    </span>
                    <span className="text-[0.8125rem] font-medium">{d.label}</span>
                  </span>
                  <span className="mt-0.5 block font-[family-name:var(--fm)] text-[0.5625rem] leading-[1.5] text-[var(--ink-3)]">
                    {d.blurb}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="pointer-events-auto flex items-center gap-2 rounded-sm border border-[var(--rule-strong)] bg-[var(--surface)]/90 px-3 py-2 font-[family-name:var(--fm)] text-[0.5625rem] uppercase tracking-[0.16em] text-[var(--ink-2)] backdrop-blur transition-colors hover:text-[var(--ink)]"
      >
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
        Direction {current}
      </button>
    </div>
  );
}
