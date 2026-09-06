"use client";

import { useMemo, useState } from "react";
import type { Snapshot } from "@/lib/market/types";
import { MARKET } from "@/content/market";
import { Hero } from "./Hero";
import { DayScrubber } from "./DayScrubber";
import { SpreadChart } from "./SpreadChart";
import { BookableMeter } from "./BookableMeter";
import { HistoryLines } from "./HistoryLines";
import { SourcesLedger } from "./SourcesLedger";
import { ProviderDetail } from "./ProviderDetail";
import { FloorMount } from "./floor/FloorMount";
import { railRate } from "./format";

/**
 * The market page's state lives here: which day is selected, which provider
 * is hovered or pinned. Everything below is a pure view of the snapshot for
 * that day. The 3D floor and the 2D spread chart share the same hover state,
 * so touching a blade lights up its row and vice versa.
 */
export function MarketDashboard({ latest, history }: { latest: Snapshot | null; history: Snapshot[] }) {
  const days = useMemo(() => (history.length ? history : latest ? [latest] : []), [history, latest]);
  const [dayIndex, setDayIndex] = useState(Math.max(0, days.length - 1));
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const snap = days[Math.min(dayIndex, days.length - 1)] ?? null;
  const focus = pinned ?? hover;
  const focused = snap?.providers.find((p) => p.provider === focus) ?? null;

  if (!snap) {
    return (
      <section className="d3-panel d3-ticks mx-auto my-24 max-w-2xl p-8 text-center">
        <p className="d3-tag text-[var(--ink-3)]">{MARKET.eyebrow}</p>
        <h2 className="d3-display mt-4 text-3xl">No snapshot yet.</h2>
        <p className="d3-body mt-4 text-[var(--ink-2)]">
          The tracker has not run. Run <code className="d3-figure">npm run market:refresh</code>, or wait for the scheduled job.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-24 md:gap-32">
      <Hero snap={snap} dayCount={days.length} />

      <section aria-labelledby="floor-h" data-r-group className="flex flex-col gap-8">
        <header className="grid gap-4 md:grid-cols-[1fr_minmax(0,28rem)] md:gap-12">
          <div>
            <p className="d3-tag text-[var(--ink-3)]">{MARKET.floor.eyebrow}</p>
            <h2 id="floor-h" className="d3-display mt-3 text-[clamp(1.75rem,3.6vw,2.75rem)] text-balance">{MARKET.floor.heading}</h2>
          </div>
          <p className="d3-body self-end text-[0.9375rem] text-[var(--ink-2)]">{MARKET.floor.hint}</p>
        </header>

        <DayScrubber days={days} index={dayIndex} onChange={setDayIndex} />

        <FloorMount snap={snap} hover={focus} onHover={setHover} onPin={(id) => setPinned((p) => (p === id ? null : id))} />

        {focused && <ProviderDetail digest={focused} rail={railRate(snap)} onClose={() => { setPinned(null); setHover(null); }} pinned={pinned === focused.provider} />}
      </section>

      <section aria-labelledby="spread-h" data-r-group className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <header>
          <p className="d3-tag text-[var(--ink-3)]">{MARKET.spread.eyebrow}</p>
          <h2 id="spread-h" className="d3-display mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] text-balance">{MARKET.spread.heading}</h2>
          <p className="d3-body mt-5 max-w-[38ch] text-[0.9375rem] text-[var(--ink-2)]">{MARKET.spread.body}</p>
        </header>
        <SpreadChart snap={snap} hover={focus} onHover={setHover} onPin={(id) => setPinned((p) => (p === id ? null : id))} />
      </section>

      <section aria-labelledby="bookable-h" data-r-group className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <header>
          <p className="d3-tag text-[var(--ink-3)]">{MARKET.bookable.eyebrow}</p>
          <h2 id="bookable-h" className="d3-display mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] text-balance">{MARKET.bookable.heading}</h2>
          <p className="d3-body mt-5 max-w-[38ch] text-[0.9375rem] text-[var(--ink-2)]">{MARKET.bookable.body}</p>
        </header>
        <BookableMeter snap={snap} />
      </section>

      <section aria-labelledby="history-h" data-r-group className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <header>
          <p className="d3-tag text-[var(--ink-3)]">{MARKET.history.eyebrow}</p>
          <h2 id="history-h" className="d3-display mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] text-balance">{MARKET.history.heading}</h2>
          <p className="d3-body mt-5 max-w-[38ch] text-[0.9375rem] text-[var(--ink-2)]">{MARKET.history.body}</p>
          <p className="d3-tag mt-4 text-[var(--ink-3)]">{MARKET.history.young(days.length)}</p>
          {days.some((d) => d.synthetic) && <p className="d3-tag mt-2 text-[var(--caution)]">{MARKET.history.synthetic}</p>}
        </header>
        <HistoryLines days={days} index={dayIndex} onChange={setDayIndex} />
      </section>

      <section aria-labelledby="sources-h" data-r-group className="flex flex-col gap-8">
        <header className="max-w-[60ch]">
          <p className="d3-tag text-[var(--ink-3)]">{MARKET.sources.eyebrow}</p>
          <h2 id="sources-h" className="d3-display mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] text-balance">{MARKET.sources.heading}</h2>
          <p className="d3-body mt-5 text-[0.9375rem] text-[var(--ink-2)]">{MARKET.sources.body}</p>
        </header>
        <SourcesLedger snap={snap} />
      </section>

      <section aria-labelledby="method-h" data-r-group className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <header>
          <p className="d3-tag text-[var(--ink-3)]">{MARKET.method.eyebrow}</p>
          <h2 id="method-h" className="d3-display mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] text-balance">{MARKET.method.heading}</h2>
        </header>
        <ol className="grid gap-px overflow-hidden border border-[var(--rule-strong)] bg-[var(--rule-strong)] sm:grid-cols-2">
          {MARKET.method.points.map((p, i) => (
            <li key={p.label} className="bg-[var(--surface)] p-6">
              <p className="d3-figure text-[0.625rem] text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="d3-body mt-3 font-medium text-[var(--ink)]">{p.label}</h3>
              <p className="d3-body mt-2 text-[0.875rem] text-[var(--ink-2)]">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
