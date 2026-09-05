"use client";

import type { ProviderDigest } from "@/lib/market/types";
import { MARKET } from "@/content/market";
import { EvidenceLink } from "./EvidenceLink";
import { STOCK_GLYPH, STOCK_TOKEN, pct, usd } from "./format";

/** The table view for one seller: every figure with its evidence. */
export function ProviderDetail({ digest: p, ourRate, onClose, pinned }: { digest: ProviderDigest; ourRate: number; onClose: () => void; pinned: boolean }) {
  const vsOurs = p.published ? p.published.usdPerGpuHour / ourRate : null;
  return (
    <aside className="d3-panel d3-ticks grid gap-6 p-6 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-10 md:p-8" aria-live="polite">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="d3-tag text-[var(--ink-3)]">{pinned ? "Pinned" : "Hovering"}</p>
            <h3 className="d3-display mt-2 text-[1.75rem]">{p.label}</h3>
          </div>
          {pinned && <button type="button" onClick={onClose} className="d3-figure text-[0.75rem] text-[var(--ink-3)] hover:text-[var(--accent)]" aria-label="Unpin">✕</button>}
        </div>
        <p className="mt-4 d3-body text-[0.875rem]" style={{ color: STOCK_TOKEN[p.stock] }}>
          {STOCK_GLYPH[p.stock]} {MARKET.stock[p.stock]}
          {p.stockBasis && <span className="text-[var(--ink-3)]"> — {MARKET.basis[p.stockBasis]}</span>}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <div><dt className="d3-tag text-[var(--ink-3)]">Spread</dt><dd className="d3-figure mt-1 text-[1.125rem] text-[var(--ink)]">{pct(p.spread, 1)}</dd></div>
          <div><dt className="d3-tag text-[var(--ink-3)]">vs ours</dt><dd className="d3-figure mt-1 text-[1.125rem] text-[var(--ink)]">{vsOurs == null ? "—" : `${vsOurs.toFixed(2)}×`}</dd></div>
        </dl>
      </div>

      <dl className="grid content-start gap-3 border-t border-[var(--rule)] pt-4 md:border-t-0 md:border-l md:pl-8 md:pt-0">
        <Row label="Published" value={p.published ? usd(p.published.usdPerGpuHour) : MARKET.states[p.publishedState]} tone={p.published ? "var(--accent)" : "var(--ink-3)"} evidence={p.published?.evidence} />
        {p.reported.map((r, i) => (
          <Row key={i} label={`As reported by ${r.sourceId}`} value={usd(r.usdPerGpuHour)} sub={`${STOCK_GLYPH[r.stock]} ${MARKET.stock[r.stock]}`} evidence={r.evidence} />
        ))}
        {p.otherTerms.map((t, i) => (
          <Row key={`o${i}`} label={`${t.term}${t.variant ? ` · ${t.variant}` : ""}`} value={usd(t.usdPerGpuHour)} tone="var(--ink-2)" />
        ))}
      </dl>
    </aside>
  );
}

function Row({ label, value, sub, tone = "var(--ink)", evidence }: { label: string; value: string; sub?: string; tone?: string; evidence?: ProviderDigest["reported"][number]["evidence"] }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-[var(--rule)] pb-3">
      <dt className="d3-body text-[0.875rem] text-[var(--ink-2)]">{label}{sub && <span className="ml-2 text-[var(--ink-3)]">{sub}</span>}</dt>
      <dd className="d3-figure text-[1rem]" style={{ color: tone }}>{value}</dd>
      {evidence && <dd className="col-span-2 mt-1 d3-body text-[0.75rem]"><EvidenceLink evidence={evidence} /></dd>}
    </div>
  );
}
