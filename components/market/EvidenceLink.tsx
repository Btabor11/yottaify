"use client";

import { useState } from "react";
import type { Evidence } from "@/lib/market/types";

/**
 * A figure's citation. The link opens the page it was read from; the toggle
 * shows the excerpt, hash and any arithmetic, so a reader can check without
 * trusting us.
 */
export function EvidenceLink({ evidence, label }: { evidence: Evidence; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline">
      <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="text-[var(--ink-2)] underline decoration-[var(--rule-strong)] underline-offset-[0.2em] transition-colors hover:text-[var(--accent)] hover:decoration-[var(--accent)]">
        {label ?? new URL(evidence.url).hostname.replace(/^www\./, "")}
      </a>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="ml-1.5 d3-figure text-[0.625rem] text-[var(--ink-3)] hover:text-[var(--accent)]" aria-label="Show evidence">
        {open ? "[−]" : "[+]"}
      </button>
      {open && (
        <span className="mt-2 block border-l border-[var(--edge)] pl-3 d3-body text-[0.75rem] text-[var(--ink-3)]">
          <span className="block">read {new Date(evidence.readAt).toUTCString()}</span>
          <span className="block">sha256 {evidence.bodyHash}</span>
          {evidence.derivation && <span className="block text-[var(--ink-2)]">{evidence.derivation}</span>}
          {evidence.excerpt && <q className="mt-1 block text-[var(--ink-2)]">{evidence.excerpt}</q>}
        </span>
      )}
    </span>
  );
}
