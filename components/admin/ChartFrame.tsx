/**
 * The sounding field, framed.
 *
 * Holds the plot at the projection's exact aspect ratio, which is what lets a
 * percentage be a pixel and the axis labels sit where the drawing put them.
 *
 * The labels live *inside* ChartMount, alongside the still they belong to, so
 * that when the scene takes over they hand off to the scene's own copy — the
 * one that tilts with the plane — rather than staying behind and pointing at
 * nothing.
 */

import { ADMIN } from "@/content";
import type { Field } from "@/app/admin/derive";
import { Chart } from "./Chart";
import { ChartMount } from "./ChartMount";
import { ChartTicks } from "./ChartTicks";
import { VIEW } from "./project";

export function ChartFrame({ field }: { field: Field }) {
  if (field.points.length === 0) {
    return (
      <div className="adm-chart-hull grid place-items-center px-8 py-16 text-center">
        <p className="max-w-[42ch] text-[var(--ink-3)] text-pretty">{ADMIN.chart.empty}</p>
      </div>
    );
  }

  const oldest = Math.max(...field.points.map((p) => p.ageDays), 0);

  return (
    <div className="adm-chart-hull" style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      <ChartMount field={field} oldest={oldest}>
        {/* Decorative: the caption below says in prose what these mark, and
            the log beneath it is the accessible path to every plotted row. */}
        <Chart field={field} />
        <ChartTicks oldest={oldest} />
      </ChartMount>
      <span className="adm-chart-sweep" aria-hidden />
    </div>
  );
}
