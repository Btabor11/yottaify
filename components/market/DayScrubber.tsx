"use client";

import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/lib/market/types";
import { dayLabel } from "./format";

/**
 * The timeline. A native range input underneath (keyboard, screen readers,
 * touch), with a drawn track over it: one tick per recorded day, the
 * legibility index as tick height, the selected day lifted. Optional play
 * button steps through the days — the 3D floor animates between them.
 */
export function DayScrubber({ days, index, onChange }: { days: Snapshot[]; index: number; onChange: (i: number) => void }) {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const many = days.length > 1;

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      onChange(index >= days.length - 1 ? 0 : index + 1);
    }, 900);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, index, days.length, onChange]);

  const cur = days[index];
  return (
    <div className="d3-panel d3-ticks grid gap-4 p-4 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6 md:p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={!many}
          aria-pressed={playing}
          aria-label={playing ? "Pause replay" : "Replay the days"}
          className="d3-figure grid h-9 w-9 place-items-center border border-[var(--edge)] text-[0.75rem] text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <div>
          <p className="d3-tag text-[var(--ink-3)]">Day</p>
          <p className="d3-figure text-[1rem] text-[var(--ink)]">{cur ? cur.day : "—"}</p>
        </div>
      </div>

      <div className="relative h-14">
        <svg viewBox={`0 0 ${Math.max(days.length, 2) * 10} 40`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {days.map((d, i) => {
            const h = 6 + (d.legibility.index / 100) * 30;
            const sel = i === index;
            return (
              <rect
                key={d.day}
                x={i * 10 + 3.5}
                y={40 - h}
                width={3}
                height={h}
                rx={1}
                fill={sel ? "var(--accent)" : "var(--ink-3)"}
                opacity={sel ? 1 : 0.55}
                style={{ transition: "y 300ms var(--ease-out-expo), height 300ms var(--ease-out-expo)" }}
              />
            );
          })}
        </svg>
        <input
          type="range"
          min={0}
          max={Math.max(0, days.length - 1)}
          value={index}
          onChange={(e) => { setPlaying(false); onChange(Number(e.target.value)); }}
          disabled={!many}
          aria-label="Recorded day"
          aria-valuetext={cur?.day}
          className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent [&::-webkit-slider-thumb]:h-14 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-x [&::-webkit-slider-thumb]:border-[var(--accent)] [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-thumb]:h-14 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-x [&::-moz-range-thumb]:border-[var(--accent)] [&::-moz-range-thumb]:bg-transparent disabled:cursor-default"
        />
      </div>

      <div className="flex justify-between gap-6 md:block md:text-right">
        <div>
          <p className="d3-tag text-[var(--ink-3)]">Legibility</p>
          <p className="d3-figure text-[1rem] text-[var(--ink)]">{cur ? cur.legibility.index : "—"}<span className="text-[var(--ink-3)]"> / 100</span></p>
        </div>
        <p className="d3-tag text-[var(--ink-3)] md:mt-2">{days.length ? `${dayLabel(days[0].day)} → ${dayLabel(days[days.length - 1].day)}` : ""}</p>
      </div>
    </div>
  );
}
