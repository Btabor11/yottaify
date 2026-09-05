/**
 * The filter bar.
 *
 * Two halves, both of which survive JavaScript being switched off, because
 * the desk is the surface someone reaches for when something is already
 * going wrong:
 *
 *  · the views are links, so the board's whole state lives in the URL and
 *    can be bookmarked, shared in a message, or opened in a second tab;
 *  · the search is a plain GET form that posts to the same route.
 *
 * Counts sit inside the chips. A view that would return nothing says so
 * before it is clicked, which is the difference between a filter and a
 * guessing game.
 */

import Link from "next/link";
import { ADMIN } from "@/content";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/server/schema";
import { DEFAULT_SORT, href, isNarrowed, type View } from "./view";

/** Views worth one click. Everything else is reachable from the select. */
const QUICK: ReservationStatus[] = ["new", "contacted", "call_scheduled", "term_sheet"];

export function Filters({
  state,
  counts,
  showing,
  total,
}: {
  state: View;
  /** Row count per status across the unfiltered board, plus "open" and "all". */
  counts: Record<string, number>;
  showing: number;
  total: number;
}) {
  const filtered = isNarrowed(state);

  return (
    <section aria-label={ADMIN.filters.legend} className="adm-plate adm-rise" style={{ "--i": 6 } as React.CSSProperties}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="adm-tag">{ADMIN.filters.quick}</h2>
        <p className="adm-tag" role="status">
          {ADMIN.filters.showing} <span className="text-[var(--ink)]">{showing}</span> {ADMIN.filters.of}{" "}
          <span className="text-[var(--ink)]">{total}</span> {ADMIN.filters.rows}
          {filtered && <span className="ml-2 text-[var(--accent)]">· {ADMIN.filters.active}</span>}
        </p>
      </div>

      <nav aria-label={ADMIN.filters.status} className="mt-3 flex flex-wrap gap-1.5">
        <Chip href={href(state, { status: "open" })} on={state.status === "open"} label={ADMIN.filters.open} n={counts.open} />
        {QUICK.map((s) => (
          <Chip key={s} href={href(state, { status: s })} on={state.status === s} label={STATUS_LABEL[s]} n={counts[s] ?? 0} />
        ))}
        <Chip href={href(state, { status: "all" })} on={state.status === "all"} label={ADMIN.filters.all} n={counts.all} />
        <Chip href={href(state, { status: "spam" })} on={state.status === "spam"} label={ADMIN.filters.spam} n={counts.spam ?? 0} />
      </nav>

      <nav aria-label={ADMIN.filters.tier} className="mt-1.5 flex flex-wrap gap-1.5">
        <Chip href={href(state, { tier: "" })} on={!state.tier} label={ADMIN.filters.anyTier} />
        {(["A", "B", "C"] as const).map((t) => (
          <Chip key={t} href={href(state, { tier: t })} on={state.tier === t} label={`${ADMIN.filters.tier} ${t}`} n={counts[`tier:${t}`] ?? 0} />
        ))}
      </nav>

      <form method="get" action="/admin" className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--rule)] pt-4">
        {/* The view survives a search: filter, tier and the column being read
            down all travel in the same query string, so searching narrows the
            board rather than resetting it. */}
        {state.status !== "open" && <input type="hidden" name="status" value={state.status} />}
        {state.tier && <input type="hidden" name="tier" value={state.tier} />}
        {(state.sort !== DEFAULT_SORT || state.asc) && (
          <input type="hidden" name="sort" value={(state.asc ? "" : "-") + state.sort} />
        )}
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="f-q" className="adm-tag block">
            {ADMIN.filters.search}
          </label>
          <input
            id="f-q"
            name="q"
            type="search"
            defaultValue={state.q}
            placeholder={ADMIN.filters.searchPlaceholder}
            className="adm-input mt-1.5"
          />
        </div>
        {/* A plain button on purpose. This is a native GET form, not a server
            action, so there is no in-flight state for it to report. */}
        <button type="submit" className="adm-btn adm-btn-solid">
          {ADMIN.filters.apply}
        </button>
        <Link href="/admin" className="adm-btn">
          {ADMIN.filters.clear}
        </Link>
      </form>
    </section>
  );
}

function Chip({ href, on, label, n }: { href: string; on: boolean; label: string; n?: number }) {
  return (
    <Link href={href} className="adm-chip" aria-current={on ? "true" : undefined}>
      {label}
      {n !== undefined && <span className="adm-chip-n">{n}</span>}
    </Link>
  );
}
