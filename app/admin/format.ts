/**
 * Presentation helpers for the desk. Values in the store are the raw option
 * values the form posted ("nvfp4-training"); the desk shows the label the
 * client saw. Pure functions, no I/O.
 */

import {
  ADMIN,
  EVENT_FIELD,
  EVENT_LABEL,
  FOLLOWUP_FIELDS,
  GPU_COUNT_OPTIONS,
  WORKLOAD_OPTIONS,
  type FollowupFieldName,
} from "@/content";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/server/schema";

const gpuLabel = new Map(GPU_COUNT_OPTIONS.map((o) => [o.value, o.label]));
const workloadLabel = new Map(WORKLOAD_OPTIONS.map((o) => [o.value, o.label]));
const followupLabel = new Map(
  FOLLOWUP_FIELDS.map((f) => [f.name, new Map((f.options ?? []).map((o) => [o.value, o.label]))] as const),
);

export function gpu(v: string): string {
  return gpuLabel.get(v) ?? v;
}

/**
 * The capacity band with the word "GPUs" taken off the end, so it can stand
 * as a display figure with a small unit beside it. Printing the whole label
 * next to a unit gives "16 16 GPUs", which is how the dossier read until
 * somebody looked at it on a phone.
 *
 * The labels are ours, from `content/`, so this trims our own wording rather
 * than parsing a string from somewhere unknown.
 */
export function gpuFigure(v: string): string {
  return gpu(v).replace(/\s*GPUs?\s*$/i, "");
}

export function workload(v: string): string {
  return workloadLabel.get(v) ?? v;
}

/** Label for a follow-up answer; falls back to the raw value for free text. */
export function followup(field: FollowupFieldName, v: string | null | undefined): string {
  if (v == null || v === "") return ADMIN.values.none;
  return followupLabel.get(field)?.get(v) ?? v;
}

export function followupList(field: FollowupFieldName, v: string[] | null | undefined): string {
  if (!v || v.length === 0) return ADMIN.values.none;
  return v.map((x) => followup(field, x)).join(", ");
}

export function when(d: Date | string | null | undefined): string {
  if (!d) return ADMIN.values.none;
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 16).replace("T", " ") + "Z";
}

export function ago(d: Date | string): string {
  const t = (typeof d === "string" ? new Date(d) : d).getTime();
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function ms(v: number | null | undefined): string {
  if (v == null) return ADMIN.values.none;
  if (v < 1000) return `${v} ms`;
  if (v < 60_000) return `${(v / 1000).toFixed(1)} s`;
  return `${Math.round(v / 60_000)} min`;
}

export function yesNo(v: boolean | null | undefined): string {
  if (v == null) return ADMIN.values.none;
  return v ? ADMIN.values.yes : ADMIN.values.no;
}

export function text(v: string | number | null | undefined): string {
  if (v == null || v === "") return ADMIN.values.none;
  return String(v);
}

export function sentAt(d: Date | string | null | undefined): string {
  return d ? `${ADMIN.values.sent} ${when(d)}` : ADMIN.values.notSent;
}

/** A duration in days, rendered at the coarsest unit that stays honest. */
export function days(n: number | null | undefined): string {
  if (n == null) return ADMIN.values.none;
  if (n < 1 / 24) return `${Math.max(1, Math.round(n * 24 * 60))}m`;
  if (n < 1) return `${Math.round(n * 24)}h`;
  if (n < 14) return `${Math.round(n)}d`;
  return `${Math.round(n / 7)}w`;
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

/** Day and month, for an axis tick. */
export function dayLabel(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/**
 * A timeline entry's payload, unpacked into readable pairs.
 *
 * Statuses are run back through their labels, so a row reads
 * "From New · To Contacted" rather than `{"from":"new","to":"contacted"}`.
 * Anything the desk has no name for is still shown — an unrecognised key is a
 * reason to print it, not to swallow it.
 */
export function payloadPairs(payload: unknown): Array<[string, string]> {
  if (!payload || typeof payload !== "object") return [];
  return Object.entries(payload as Record<string, unknown>)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => {
      const label = EVENT_FIELD[k] ?? k;
      if ((k === "from" || k === "to") && typeof v === "string") {
        return [label, STATUS_LABEL[v as ReservationStatus] ?? v] as [string, string];
      }
      return [label, typeof v === "string" ? v : JSON.stringify(v)] as [string, string];
    });
}

export function eventName(type: string): string {
  return EVENT_LABEL[type] ?? type.replace(/_/g, " ");
}

/**
 * A depth reading, as it is printed beside a stage.
 *
 * Leading zero dropped, because a column of `.00 .18 .36` is a scale and a
 * column of `0.00 0.18 0.36` is a spreadsheet. `slice(1)` would have done it
 * — right up to the floor, where it quietly turned 1.00 into .00 and put the
 * bottom of the pipeline back at the surface.
 */
export function depth(d: number): string {
  return d.toFixed(2).replace(/^0/, "");
}

/** Short month label from YYYY-MM-DD or YYYY-MM. */
export function month(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !months[m - 1]) return iso;
  return `${months[m - 1]} ${y}`;
}
