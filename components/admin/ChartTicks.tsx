/**
 * The chart's axis labels.
 *
 * HTML text over the plot rather than glyphs inside the SVG, because the
 * WebGL scene draws geometry and not type — axes drawn into the still
 * vanished the moment the canvas faded in, and the chart lost its scale
 * exactly when it became interactive. As text they are also selectable, they
 * respect the reader's font size, and a stage name is no longer a hundred
 * pixels of type hanging off the edge of a thousand-unit viewBox.
 *
 * Rendered twice, from one definition: once over the still, and once inside
 * the scene, which re-places them from its own tilted basis every frame so
 * they ride the plane instead of watching it turn. `data-u` and `data-v` are
 * how the frame loop knows where each one belongs.
 */

import { ADMIN, STAGE_DEPTH } from "@/content";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/server/schema";
import { percent } from "./project";

/** Stages worth naming on the depth axis. The rest are read between them. */
const AXIS_STAGES: ReservationStatus[] = [
  "new",
  "contacted",
  "call_scheduled",
  "term_sheet",
  "contracted",
  "live",
];

export function ChartTicks({ oldest, hostRef }: { oldest: number; hostRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0">
      {AXIS_STAGES.map((s) => {
        const v = STAGE_DEPTH[s] ?? 0;
        return (
          <span key={s} className="adm-chart-depth-tick" data-u={0} data-v={v} style={percent(0, v)}>
            {STATUS_LABEL[s]}
          </span>
        );
      })}
      <span className="adm-chart-time-tick" data-u={0} data-v={1} style={percent(0, 1)}>
        −{Math.round(oldest)}d
      </span>
      <span className="adm-chart-time-tick" data-end="true" data-u={1} data-v={1} style={percent(1, 1)}>
        {ADMIN.chart.axisNow}
      </span>
    </div>
  );
}
