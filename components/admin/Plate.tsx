/**
 * The instrument plate, and the two things that sit on one.
 *
 * Every readout on the desk is a plate: a milled panel with a lamp line along
 * its top edge and four registration corners. Uniform enough that the eye
 * stops parsing the container and reads the number, which is the entire job.
 */

import type { CSSProperties } from "react";

/** `--i` staggers a plate's entrance. It carries no meaning at rest. */
export function order(index: number | undefined): CSSProperties | undefined {
  return index === undefined ? undefined : ({ "--i": index } as CSSProperties);
}

/** `--d` is the 0..1 the CSS draws a bar, bead or shelf from. */
export function level(value: number, extra?: number): CSSProperties {
  const style: Record<string, number> = { "--d": clamp(value) };
  if (extra !== undefined) style["--o"] = clamp(extra);
  return style as CSSProperties;
}

function clamp(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

export function Plate({
  label,
  note,
  aside,
  index,
  className,
  children,
}: {
  label: string;
  note?: string;
  /** A figure or mark pinned opposite the label. */
  aside?: React.ReactNode;
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`adm-plate adm-rise ${className ?? ""}`} style={order(index)} aria-label={label}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="adm-tag">{label}</h2>
        {aside}
      </div>
      {note && <p className="mt-0.5 text-[0.6875rem] text-[var(--ink-3)] text-pretty">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * A lead figure with its unit.
 *
 * The unit is a separate element at a separate weight because "14" and
 * "14 GPUs" want to be scanned differently: the eye should land on the digits
 * and pick up the unit afterwards, not read a single long string.
 */
export function Figure({ value, unit, tone }: { value: string | number; unit?: string; tone?: "accent" | "quiet" }) {
  return (
    <p className="flex items-baseline gap-1.5">
      <span
        className="adm-figure"
        style={tone === "accent" ? { color: "var(--accent)" } : tone === "quiet" ? { color: "var(--ink-2)" } : undefined}
      >
        {value}
      </span>
      {unit && <span className="adm-unit">{unit}</span>}
    </p>
  );
}
