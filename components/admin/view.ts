/**
 * THE VIEW — what the board is currently showing, as one object.
 *
 * Filter, search and sort all live in the query string, and they all have to
 * survive each other: sorting by capacity must not throw away a search, and
 * searching must not reset the column you were reading down. One state, one
 * link builder, and every control on the page goes through it.
 *
 * It is also the whole reason the desk works with JavaScript switched off.
 * There is no client state here to lose.
 */

import { gpuLow } from "@/lib/server/store-shared";
import type { Reservation } from "@/lib/server/schema";
import { depthOf } from "@/app/admin/derive";
import { workload } from "@/app/admin/format";

export interface View {
  status: string;
  tier: string;
  q: string;
  /** A key of SORTS. */
  sort: string;
  /** True for Z→A, oldest-first, smallest-first. */
  asc: boolean;
}

/**
 * How each column orders, written so that the *default* direction of every
 * column is the one worth looking at: the biggest request, the longest wait,
 * the deepest row. Ascending is the second click, not the first.
 */
export const SORTS: Record<string, (a: Reservation, b: Reservation) => number> = {
  reference: (a, b) => b.reference.localeCompare(a.reference),
  received: (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
  company: (a, b) => b.company.localeCompare(a.company),
  contact: (a, b) => b.name.localeCompare(a.name),
  capacity: (a, b) => gpuLow(a.gpuCount) - gpuLow(b.gpuCount),
  // Blank start dates sort as the far future: "unknown" is not "tomorrow".
  start: (a, b) => (b.startDate || "9999").localeCompare(a.startDate || "9999"),
  workload: (a, b) => workload(b.workload).localeCompare(workload(a.workload)),
  // Unowned first, because those are the rows that need somebody.
  owner: (a, b) => (b.owner || "").localeCompare(a.owner || "") || a.company.localeCompare(b.company),
  tier: (a, b) => (a.score ?? 0) - (b.score ?? 0),
  status: (a, b) => depthOf(a) - depthOf(b),
};

export const DEFAULT_SORT = "received";

/** The rows, ordered. Ties break on reference so the order is never unstable. */
export function order(rows: Reservation[], view: View): Reservation[] {
  const cmp = SORTS[view.sort] ?? SORTS[DEFAULT_SORT];
  const dir = view.asc ? 1 : -1;
  return [...rows].sort((a, b) => cmp(a, b) * dir || a.reference.localeCompare(b.reference));
}

/**
 * A link to the same board with something changed.
 *
 * Only non-default values are written, so the plain board is `/admin` and a
 * shared link says exactly what it does and nothing more.
 */
export function href(view: View, patch: Partial<View> = {}): string {
  const next = { ...view, ...patch };
  const sp = new URLSearchParams();
  if (next.status && next.status !== "open") sp.set("status", next.status);
  if (next.tier) sp.set("tier", next.tier);
  if (next.q) sp.set("q", next.q);
  if (next.sort !== DEFAULT_SORT || next.asc) sp.set("sort", (next.asc ? "" : "-") + next.sort);
  const s = sp.toString();
  return s ? `/admin?${s}` : "/admin";
}

/** The link a column heading points at: this column, or its other direction. */
export function sortHref(view: View, column: string): string {
  return href(view, { sort: column, asc: view.sort === column ? !view.asc : false });
}

/** Reads `sort=capacity` / `sort=-capacity`, and ignores anything it cannot sort by. */
export function readSort(raw: string): Pick<View, "sort" | "asc"> {
  const asc = !raw.startsWith("-");
  const key = asc ? raw : raw.slice(1);
  if (!SORTS[key]) return { sort: DEFAULT_SORT, asc: false };
  return { sort: key, asc };
}

/** True when the board is showing anything other than its resting view. */
export function isNarrowed(view: View): boolean {
  return view.status !== "open" || Boolean(view.tier) || Boolean(view.q);
}
