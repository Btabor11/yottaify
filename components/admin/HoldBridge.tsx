"use client";

/**
 * Joins any list of reservations to the hold channel.
 *
 * Wraps a subtree without touching it. Two listeners on the container read
 * `data-ref` off whatever the pointer is over, so there is no per-row
 * JavaScript and nothing inside has to become a client component — the log is
 * still a server-rendered table, and it still works with this doing nothing.
 *
 * Highlighting is an attribute write rather than a re-render. A table of two
 * hundred rows that re-rendered on every pointer move would be the slowest
 * thing on the desk, in service of a hover state.
 *
 * Used on the triage list first and the log second. The triage list is the
 * one that matters: it sits beside the sounding field, so pointing at a card
 * and watching its mark light up out on the plane is a question being
 * answered rather than a trick. By the time the log is on screen the field
 * has scrolled away above it.
 */

import { useEffect, useRef } from "react";
import { hold, subscribe } from "./hold";

export function HoldBridge({ children }: { children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const over = (e: PointerEvent) => {
      const row = (e.target as Element | null)?.closest?.("[data-ref]");
      hold(row?.getAttribute("data-ref") ?? null);
    };
    const out = () => hold(null);

    el.addEventListener("pointerover", over);
    el.addEventListener("pointerleave", out);

    /* Marks whatever the field is holding. Deliberately does not scroll to
       it: sweeping the pointer across the plot would drag the list along
       underneath, and the field's own label already names what it has. */
    let last: Element | null = null;
    const off = subscribe((reference) => {
      last?.removeAttribute("data-held");
      last = reference ? el.querySelector(`[data-ref="${CSS.escape(reference)}"]`) : null;
      last?.setAttribute("data-held", "true");
    });

    return () => {
      el.removeEventListener("pointerover", over);
      el.removeEventListener("pointerleave", out);
      off();
      hold(null);
    };
  }, []);

  return (
    <div ref={host} className="contents">
      {children}
    </div>
  );
}
