"use client";

import type { Snapshot } from "@/lib/market/types";
import { MARKET } from "@/content/market";
import { Meter } from "./Hero";
import { pct } from "./format";
import { EvidenceLink } from "./EvidenceLink";

/** One ratio against a limit → a meter, not a two-slice pie. */
export function BookableMeter({ snap }: { snap: Snapshot }) {
  const s = snap.inStock;
  if (!s) {
    return (
      <div className="d3-panel d3-ticks p-6">
        <p className="d3-body text-[var(--ink-2)]">The in-stock count was not read today. The tracker that publishes it is listed in the sources ledger with its status.</p>
      </div>
    );
  }
  const ratio = s.count / s.total;
  return (
    <div className="d3-panel d3-ticks grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-end md:gap-10 md:p-8">
      <div>
        <p className="d3-tag text-[var(--ink-3)]">Configs purchasable now</p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="d3-body text-[clamp(3rem,7vw,5rem)] font-semibold leading-none tracking-[-0.04em] text-[var(--ink)] [font-variant-numeric:lining-nums_proportional-nums]">{s.count}</span>
          <span className="d3-figure text-[1rem] text-[var(--ink-3)]">of {s.total}</span>
        </p>
        <p className="d3-figure mt-2 text-[0.875rem] text-[var(--accent)]">{pct(ratio, 1)}</p>
      </div>
      <div>
        <Meter value={ratio} label="Share of listed configurations in stock" />
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
          <p className="d3-body text-[0.875rem] text-[var(--ink-2)]">
            {s.total - s.count} listed configurations across {s.providers || "—"} sellers could not be ordered at the last hourly check.
          </p>
          <p className="d3-tag text-[var(--ink-3)]">
            {MARKET.bookable.attribution} <EvidenceLink evidence={s.evidence} label="GetDeploying" />
          </p>
        </div>
      </div>
    </div>
  );
}
