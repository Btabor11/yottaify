/**
 * The readouts.
 *
 * Each one takes a shape from app/admin/derive.ts and draws it. None of them
 * counts anything itself — two instruments that count separately eventually
 * disagree, and a desk whose instruments disagree is worse than a desk with
 * fewer instruments.
 *
 * All of them are text first. The bars are drawn from the same numbers that
 * are printed beside them, so a reader who cannot see the bar loses nothing
 * but the shape.
 */

import { ADMIN } from "@/content";
import { STATUS_LABEL } from "@/lib/server/schema";
import type { DescentStep, Intake, Slice } from "@/app/admin/derive";
import { depth } from "@/app/admin/format";
import { level } from "./Plate";

/**
 * Arrivals per day.
 *
 * The bar row is decoration over a real list: the figures it draws are the
 * ones already printed above it, and every column carries its own day and
 * count as a native tooltip.
 */
export function Spark({ intake }: { intake: Intake }) {
  const first = intake.days[0];
  const last = intake.days[intake.days.length - 1];
  return (
    <div aria-hidden>
      <div className="adm-spark">
        {intake.days.map((d) => (
          <span
            key={d.iso}
            className="adm-spark-col"
            style={level(d.ratio)}
            data-live={d.today || undefined}
            title={`${d.label} · ${d.n}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.5625rem] tracking-[0.1em] text-[var(--ink-3)]">
        <span>{first?.label}</span>
        <span>{last?.label}</span>
      </div>
    </div>
  );
}

/**
 * The pipeline as a vertical section: each stage a shelf, further down and as
 * wide as the number of rows resting on it.
 */
export function Descent({ steps }: { steps: DescentStep[] }) {
  return (
    <dl className="adm-descent">
      {steps.map((s) => (
        <div key={s.status} className="adm-descent-step" data-empty={s.n === 0 || undefined}>
          {/* The depth reading and the shelf live inside the <dt>. A <dt>
              nested one level deeper than its <dl>'s own <div> is not a
              definition list as far as assistive tech is concerned, and axe
              is right to say so. */}
          <dt className="adm-descent-term">
            <span className="adm-descent-depth" aria-hidden>
              {depth(s.depth)}
            </span>
            <span className="adm-descent-label">{STATUS_LABEL[s.status]}</span>
            <span className="adm-descent-shelf" style={level(s.ratio, s.depth)} aria-hidden />
          </dt>
          <dd className="adm-descent-n">{s.n}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A ranked breakdown. Label, a rule drawn to scale, the count.
 *
 * Always `slots` rows tall, padded with blank divisions. An instrument keeps
 * its scale whether or not there is a reading on it, and a row of plates that
 * all hold the same height is the difference between a bank of instruments
 * and a pile of boxes.
 */
export function Distribution({
  slices,
  label,
  empty,
  slots = 5,
}: {
  slices: Slice[];
  /** Turns a stored value into the label the client actually saw. */
  label?: (key: string) => string;
  empty?: string;
  slots?: number;
}) {
  const blanks = Math.max(0, slots - slices.length);
  return (
    <dl>
      {slices.map((s) => (
        <div key={s.key} className="adm-dist">
          <dt>
            <span className="adm-dist-name">{label ? label(s.key) : s.key}</span>
            <span className="adm-dist-track" style={level(s.ratio)} aria-hidden />
          </dt>
          <dd>{s.n}</dd>
        </div>
      ))}
      {Array.from({ length: blanks }, (_, i) => (
        <div key={`blank-${i}`} className="adm-dist" data-empty="true" aria-hidden>
          <dt>
            {i === 0 && slices.length === 0 && <span className="adm-dist-name">{empty ?? ADMIN.values.none}</span>}
            <span className="adm-dist-track" />
          </dt>
          <dd />
        </div>
      ))}
    </dl>
  );
}
