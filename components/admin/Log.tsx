/**
 * THE LOG — the board's table.
 *
 * A survey log rather than a spreadsheet. Two things make it one:
 *
 *  · a depth gutter down the left edge, whose bead sits at each row's
 *    pipeline depth, so the shape of the pipeline is legible down the side of
 *    the table before a single cell has been read;
 *  · a capacity rule under the GPU figure, drawn against the largest request
 *    on the board, so relative size is seen rather than compared.
 *
 * Everything else is a plain table: real `<th scope>`, real `<time>`, one
 * link per row, no JavaScript anywhere in it.
 */

import Link from "next/link";
import { ADMIN } from "@/content";
import type { Reservation } from "@/lib/server/schema";
import { ago, gpu, month, workload } from "@/app/admin/format";
import { depthOf, isOpen } from "@/app/admin/derive";
import { gpuLow } from "@/lib/server/store-shared";
import { HoldBridge } from "./HoldBridge";
import { StatusMark, TierMark } from "./Marks";
import { level } from "./Plate";
import { sortHref, type View } from "./view";

/** The columns, in order, each with the key it sorts by. */
const COLUMNS: Array<[key: string, label: string]> = [
  ["reference", ADMIN.table.reference],
  ["received", ADMIN.table.received],
  ["company", ADMIN.table.company],
  ["contact", ADMIN.table.contact],
  ["capacity", ADMIN.table.capacity],
  ["start", ADMIN.table.start],
  ["workload", ADMIN.table.workload],
  ["owner", ADMIN.table.owner],
  ["tier", ADMIN.table.tier],
  ["status", ADMIN.table.status],
];

export function Log({ rows, peakGpus, view }: { rows: Reservation[]; peakGpus: number; view: View }) {
  return (
    /* Its own scrollport, for two reasons: the column names stay stuck to the
       top while the log is scanned, and the page stops being three thousand
       pixels tall. A scrolling region has to be reachable from the keyboard,
       or the rows past the fold belong to mouse users only.

       HoldBridge adds the link to the sounding field and nothing else. The
       table inside it stays server-rendered and works without it. */
    <HoldBridge>
      <div
        className="adm-plate adm-plate-flush max-h-[min(78vh,52rem)] overflow-auto"
        role="region"
        aria-label={ADMIN.table.caption}
        tabIndex={0}
      >
        <table className="adm-log">
          <caption className="sr-only">{ADMIN.table.caption}</caption>
          <thead>
            <tr>
              {COLUMNS.map(([key, label]) => {
                const on = view.sort === key;
                return (
                  <th key={key} scope="col" aria-sort={on ? (view.asc ? "ascending" : "descending") : "none"}>
                    {/* A link, not a button: the order is part of the address,
                      so it can be bookmarked, shared, and clicked with
                      JavaScript switched off like everything else here. */}
                    <Link href={sortHref(view, key)} className="adm-sort" data-on={on || undefined}>
                      {label}
                      <span className="adm-sort-mark" aria-hidden>
                        {on ? (view.asc ? "▲" : "▼") : "◆"}
                      </span>
                      <span className="sr-only">
                        {on ? (view.asc ? ADMIN.table.sortedAsc : ADMIN.table.sortedDesc) : ADMIN.table.sortBy}
                      </span>
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-14 text-center">
                  <p className="adm-display text-[1.125rem]">{ADMIN.table.empty}</p>
                  <p className="mx-auto mt-2 max-w-[46ch] text-[var(--ink-3)] text-pretty">{ADMIN.table.emptyHint}</p>
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                style={level(depthOf(r))}
                data-spent={isOpen(r) ? undefined : "true"}
                data-ref={r.reference}
              >
                <td className="whitespace-nowrap">
                  <Link href={`/admin/r/${r.reference}`} className="adm-ref">
                    {r.reference}
                  </Link>
                </td>
                <td className="whitespace-nowrap adm-cell-quiet">
                  <time dateTime={new Date(r.createdAt).toISOString()}>{ago(r.createdAt)}</time>
                </td>
                <td className="adm-cell-strong">{r.company}</td>
                <td className="adm-cell-quiet">
                  {r.name}
                  <br />
                  <a href={`mailto:${r.email}`} className="adm-cell-faint">
                    {r.email}
                  </a>
                </td>
                <td className="whitespace-nowrap">
                  {gpu(r.gpuCount)}
                  <span className="adm-bar" style={level(peakGpus ? gpuLow(r.gpuCount) / peakGpus : 0)} aria-hidden />
                </td>
                <td className="whitespace-nowrap adm-cell-quiet">{month(r.startDate)}</td>
                <td className="adm-cell-quiet">{workload(r.workload)}</td>
                <td className={r.owner ? "adm-cell-quiet" : "adm-cell-faint"}>{r.owner || ADMIN.table.unowned}</td>
                <td>
                  <TierMark tier={r.tier} score={r.score} />
                </td>
                <td>
                  <StatusMark status={r.status} spam={r.spam} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </HoldBridge>
  );
}
