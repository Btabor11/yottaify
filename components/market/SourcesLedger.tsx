"use client";

import type { Snapshot, SourceMeta } from "@/lib/market/types";
import { MARKET } from "@/content/market";
import { SOURCE_META, SOURCE_ORDER } from "@/lib/market/catalog";

/** The table view: the whole tracker's provenance in one place. */
export function SourcesLedger({ snap }: { snap: Snapshot }) {
  const byId = new Map(snap.sources.map((s) => [s.id, s]));
  return (
    <div className="min-w-0 overflow-x-auto border border-[var(--rule-strong)]">
      <table className="w-full min-w-[56rem] border-collapse text-left">
        <thead>
          <tr className="d3-tag text-[var(--ink-3)]">
            <th className="border-b border-[var(--rule-strong)] px-4 py-3 font-medium">{MARKET.sources.columns.source}</th>
            <th className="border-b border-[var(--rule-strong)] px-4 py-3 font-medium">{MARKET.sources.columns.kind}</th>
            <th className="border-b border-[var(--rule-strong)] px-4 py-3 font-medium">{MARKET.sources.columns.state}</th>
            <th className="border-b border-[var(--rule-strong)] px-4 py-3 font-medium">{MARKET.sources.columns.method}</th>
            <th className="border-b border-[var(--rule-strong)] px-4 py-3 font-medium">{MARKET.sources.columns.terms}</th>
          </tr>
        </thead>
        <tbody className="d3-body text-[0.8125rem]">
          {SOURCE_ORDER.map((key) => {
            const s = { meta: SOURCE_META[key] as SourceMeta };
            const st = byId.get(s.meta.id);
            const state = s.meta.declined ? "declined" : (st?.state ?? "error");
            const tone = state === "ok" ? "var(--accent)" : state === "declined" ? "var(--ink-3)" : "var(--hot)";
            return (
              <tr key={s.meta.id} className="align-top odd:bg-[color-mix(in_oklab,var(--ink)_2%,transparent)]">
                <td className="border-b border-[var(--rule)] px-4 py-3">
                  <a href={s.meta.homepage} target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-[0.2em] hover:text-[var(--accent)] hover:decoration-[var(--accent)]">{s.meta.label}</a>
                </td>
                <td className="border-b border-[var(--rule)] px-4 py-3 d3-tag text-[var(--ink-2)]">{s.meta.kind}</td>
                <td className="border-b border-[var(--rule)] px-4 py-3 whitespace-nowrap">
                  <span className="d3-figure text-[0.75rem]" style={{ color: tone }}>{MARKET.sources.states[state as keyof typeof MARKET.sources.states] ?? state}</span>
                  {st && st.state === "ok" && <span className="d3-figure ml-2 text-[0.6875rem] text-[var(--ink-3)]">{st.observations} rows</span>}
                  {st?.error && <span className="mt-1 block max-w-[18rem] d3-body text-[0.75rem] text-[var(--ink-3)]">{st.error}</span>}
                  {s.meta.declined && <span className="mt-1 block max-w-[18rem] d3-body text-[0.75rem] text-[var(--ink-3)]">{s.meta.declined.reason}</span>}
                </td>
                <td className="border-b border-[var(--rule)] px-4 py-3 text-[var(--ink-2)]">{s.meta.method}</td>
                <td className="border-b border-[var(--rule)] px-4 py-3 text-[var(--ink-3)]">{s.meta.terms ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
