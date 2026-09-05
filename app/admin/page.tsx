/**
 * THE BOARD.
 *
 * Read top to bottom it answers four questions in order, and it is arranged
 * that way on purpose:
 *
 *   1. Is anything wrong?          notices, and the store pip in the rail
 *   2. Where does the desk stand?  the posture strip
 *   3. What does it look like?     the sounding field, and who is waiting
 *   4. What is actually in it?     the instruments, then every row
 *
 * Every instrument except the view counters reads the *filtered* rows, so
 * narrowing the board narrows the whole page and the picture never describes
 * a set the table is not showing. The view counters are deliberately global,
 * because a chip that reported its own filtered count would always read zero
 * for every view you are not currently in.
 */

import { ADMIN } from "@/content";
import { getStore } from "@/lib/server/store";
import { RESERVATION_STATUSES, type Reservation, type ReservationStatus } from "@/lib/server/schema";
import type { ListFilter, Stats } from "@/lib/server/store-shared";
import { Attention } from "@/components/admin/Attention";
import { ChartFrame } from "@/components/admin/ChartFrame";
import { Filters } from "@/components/admin/Filters";
import { order as orderRows, readSort, type View } from "@/components/admin/view";
import { Descent, Distribution, Spark } from "@/components/admin/Instruments";
import { Log } from "@/components/admin/Log";
import { Figure, Plate, order } from "@/components/admin/Plate";
import { attention, descent, field, intake, posture, ranked, sourceOf, tally, weight } from "./derive";
import { days, gpu, month, pct, workload } from "./format";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function toFilter(state: View): ListFilter {
  const f: ListFilter = { q: state.q || undefined, limit: 500 };
  if (state.status === "spam") {
    f.includeSpam = true;
    f.status = "spam";
  } else if (state.status === "all") {
    f.status = "all";
  } else if ((RESERVATION_STATUSES as readonly string[]).includes(state.status)) {
    f.status = state.status as ReservationStatus;
  } else {
    f.status = "open";
  }
  if (state.tier === "A" || state.tier === "B" || state.tier === "C") f.tier = state.tier;
  return f;
}

function readState(sp: Search): View {
  const status = first(sp.status);
  const known = status === "all" || status === "spam" || (RESERVATION_STATUSES as readonly string[]).includes(status);
  const tier = first(sp.tier);
  return {
    status: known ? status : "open",
    tier: tier === "A" || tier === "B" || tier === "C" ? tier : "",
    q: first(sp.q).trim(),
    ...readSort(first(sp.sort)),
  };
}

/** Chip counts, from the global stats rather than the filtered set. */
function viewCounts(stats: Stats | null): Record<string, number> {
  if (!stats) return {};
  const c: Record<string, number> = { open: stats.open, all: stats.total, spam: stats.spam };
  for (const [k, n] of Object.entries(stats.byStatus)) c[k] = n;
  for (const [k, n] of Object.entries(stats.byTier)) c[`tier:${k}`] = n;
  return c;
}

export default async function AdminBoard({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const state = readState(sp);
  const store = await getStore();

  let rows: Reservation[] = [];
  let stats: Stats | null = null;
  let storeError = false;
  try {
    [rows, stats] = await Promise.all([store.listReservations(toFilter(state)), store.stats()]);
  } catch (e) {
    console.error("[admin] store read failed", e);
    storeError = true;
  }

  // Every instrument reads the same set of rows; only the log cares what
  // order they are in, so the ordering happens here and stops here.
  const logged = orderRows(rows, state);

  const plot = field(rows);
  const stand = posture(rows);
  const arrivals = intake(rows);
  const shelves = descent(rows);
  const load = weight(rows);
  const waiting = attention(rows);
  const answered = rows.filter((r) => r.followupAt).length;

  return (
    <>
      {(sp.erased || storeError) && (
        <div className="mb-6 grid gap-2">
          {sp.erased && (
            <p role="status" className="adm-notice" data-tone="ok">
              {ADMIN.actions.erased}
            </p>
          )}
          {storeError && (
            <p role="alert" className="adm-notice" data-tone="alarm">
              {ADMIN.store.down}
            </p>
          )}
        </div>
      )}

      <h1 className="sr-only">{ADMIN.title}</h1>

      {/* --- 2. posture ---------------------------------------------------- */}
      {/* Five plates into two or three columns leaves an orphan on the last
          row, so the last plate takes the slack until all five fit abreast. */}
      <section
        aria-label={ADMIN.panel.coverage}
        className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 xl:[&>*:last-child]:col-span-1"
      >
        <Plate label={ADMIN.filters.open} index={0}>
          <Figure value={stand.open} unit={ADMIN.filters.rows} />
          <p className="mt-1.5 text-[var(--ink-3)]">
            {ADMIN.panel.median} {days(stand.medianOpenDays)} · {ADMIN.panel.oldest} {days(stand.oldestOpenDays)}
          </p>
        </Plate>

        <Plate label={ADMIN.panel.weight} index={1}>
          <Figure value={load.gpus} unit={ADMIN.table.capacity} />
          <p className="mt-1.5 text-[var(--ink-3)]">{ADMIN.panel.weightLead}</p>
        </Plate>

        <Plate label={ADMIN.panel.coverage} index={2}>
          <Figure
            value={stand.coverage === null ? ADMIN.values.none : pct(stand.coverage)}
            tone={stand.coverage === null ? "quiet" : stand.coverage >= 80 ? "accent" : undefined}
          />
          <p className="mt-1.5 text-[var(--ink-3)]">
            {stand.coverage === null
              ? ADMIN.panel.noneOpen
              : stand.unowned > 0
                ? `${stand.unowned} ${ADMIN.panel.unowned.toLowerCase()}`
                : ADMIN.panel.noneUnowned}
          </p>
        </Plate>

        <Plate label={ADMIN.panel.stalled} index={3}>
          <Figure value={stand.stalled} tone={stand.stalled === 0 ? "quiet" : undefined} />
          <p className="mt-1.5 text-[var(--ink-3)]">
            {stand.stalled === 0 ? ADMIN.panel.noneStalled : ADMIN.panel.stalledNote}
          </p>
        </Plate>

        <Plate label={ADMIN.panel.answered} index={4}>
          <Figure
            value={answered}
            unit={`${ADMIN.filters.of} ${rows.length}`}
            tone={rows.length === 0 ? "quiet" : undefined}
          />
          <p className="mt-1.5 text-[var(--ink-3)]">
            {rows.length
              ? `${pct((answered / rows.length) * 100)} ${ADMIN.panel.answeredLead}`
              : ADMIN.panel.noneToCount}
          </p>
        </Plate>
      </section>

      {/* --- 3. the field, and who is waiting ------------------------------ */}
      <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <section aria-label={ADMIN.chart.title} className="adm-plate adm-rise" style={order(5)}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="adm-tag">{ADMIN.chart.title}</h2>
            <p className="adm-tag">
              {ADMIN.chart.surveyed} <span className="text-[var(--ink)]">{plot.points.length}</span>
            </p>
          </div>

          <div className="mt-3">
            <ChartFrame field={plot} />
          </div>

          <p className="mt-3 max-w-[76ch] text-[var(--ink-3)] text-pretty">{ADMIN.chart.caption}</p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <Key tone="shoal" label={ADMIN.chart.legendShoal} />
            <Key tone="deep" label={ADMIN.chart.legendDeep} />
            <Key tone="spent" label={ADMIN.chart.legendSpent} />
            <li className="adm-tag">{ADMIN.chart.legendSize}</li>
          </ul>
        </section>

        <Plate label={ADMIN.attention.title} note={ADMIN.attention.note} index={5}>
          <Attention waiting={waiting} />
        </Plate>
      </div>

      {/* --- 4. the instruments -------------------------------------------- */}
      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Plate
          label={ADMIN.panel.intake}
          note={ADMIN.panel.intakeNote}
          index={0}
          aside={
            <span className="adm-tag">
              <span className="text-[var(--ink)]">{arrivals.today}</span> {ADMIN.panel.today.toLowerCase()}
            </span>
          }
        >
          <Spark intake={arrivals} />
          <p className="mt-2 text-[var(--ink-3)]">
            <span className="text-[var(--ink)]">{arrivals.perDay}</span>
            {ADMIN.panel.perDay} · {arrivals.total} {ADMIN.filters.rows}
          </p>
        </Plate>

        <Plate label={ADMIN.panel.descent} note={ADMIN.panel.descentNote} index={1}>
          <Descent steps={shelves.steps} />
        </Plate>

        <Plate label={ADMIN.panel.weight} note={ADMIN.panel.weightNote} index={2}>
          <Distribution
            slices={load.bands.map((b) => ({ key: b.band, n: b.gpus, ratio: b.ratio }))}
            label={gpu}
            empty={ADMIN.table.empty}
          />
        </Plate>

        <Plate label={ADMIN.panel.signal} note={ADMIN.panel.signalNote} index={3}>
          <Distribution slices={ranked(tally(rows, sourceOf))} empty={ADMIN.table.empty} />
        </Plate>
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <Plate label={ADMIN.panel.workload} note={ADMIN.panel.workloadNote} index={0}>
          <Distribution slices={ranked(tally(rows, (r) => r.workload))} label={workload} empty={ADMIN.table.empty} />
        </Plate>
        <Plate label={ADMIN.panel.schedule} note={ADMIN.panel.scheduleNote} index={1}>
          <Distribution slices={ranked(tally(rows, (r) => r.startDate.slice(0, 7)))} label={month} empty={ADMIN.table.empty} />
        </Plate>
        <Plate label={ADMIN.panel.quality} note={ADMIN.panel.qualityNote} index={2}>
          <Distribution
            slices={ranked(tally(rows, (r) => r.tier))}
            label={(k) => `${ADMIN.filters.tier} ${k}`}
            empty={ADMIN.table.empty}
          />
        </Plate>
      </div>

      {/* --- 5. filters, then every row ------------------------------------ */}
      <div className="mt-2.5">
        <Filters state={state} counts={viewCounts(stats)} showing={rows.length} total={stats?.total ?? rows.length} />
      </div>

      <div className="mt-2.5">
        <Log rows={logged} peakGpus={plot.peakGpus} view={state} />
      </div>
    </>
  );
}

/** One legend entry: a swatch on the depth scale and what it means. */
function Key({ tone, label }: { tone: "shoal" | "deep" | "spent"; label: string }) {
  return (
    <li className="adm-tag flex items-center gap-2">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: `var(--${tone})` }} />
      {label}
    </li>
  );
}
