/**
 * THE DOSSIER — one reservation, in full.
 *
 * The board answers "which one"; this answers "what do I say to them". So it
 * is arranged as a briefing rather than a record dump: the masthead is who
 * they are, the strip under it is the four numbers you would want before
 * picking up the phone, and the read is what their own behaviour columns
 * observed. The raw record is all still here, below, in the order it was
 * captured — but it is no longer the first thing on the page.
 *
 * The actions rail is plain form posts, every one of which works with
 * JavaScript switched off, because this is the surface someone reaches for
 * when something has already gone wrong.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN } from "@/content";
import { getStore } from "@/lib/server/store";
import { RESERVATION_STATUSES, STATUS_LABEL } from "@/lib/server/schema";
import { isReference } from "@/lib/server/reference";
import { DepthGauge, Reading } from "@/components/admin/Sounding";
import { StatusMark, TierMark } from "@/components/admin/Marks";
import { Figure, Plate } from "@/components/admin/Plate";
import { Submit } from "@/components/admin/Submit";
import { addNote, advanceStatus, eraseReservation, setOwner, setStatus, toggleSpam } from "../../actions";
import { ageDays, nextStage, read, signal } from "../../derive";
import {
  days,
  eventName,
  followup,
  followupList,
  gpu,
  gpuFigure,
  month,
  ms,
  payloadPairs,
  sentAt,
  text,
  when,
  workload,
  yesNo,
} from "../../format";

export const dynamic = "force-dynamic";

const SIGNAL_LABEL = { strong: ADMIN.read.strong, fair: ADMIN.read.fair, weak: ADMIN.read.weak } as const;

export default async function ReservationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ reference: raw }, sp] = await Promise.all([params, searchParams]);
  const reference = raw.toUpperCase();
  if (!isReference(reference)) notFound();

  const store = await getStore();
  const r = await store.getByReference(reference);
  if (!r) notFound();
  const events = await store.listEvents(r.id);

  const flag = sp.saved ? "saved" : sp.failed ? "failed" : null;
  const utm = [r.utmSource, r.utmMedium, r.utmCampaign, r.utmTerm, r.utmContent].filter(Boolean).join(" / ");
  const location = [r.city, r.region, r.country].filter(Boolean).join(", ");
  const viewport = r.viewportW ? `${r.viewportW}×${r.viewportH} · screen ${r.screenW}×${r.screenH} @${r.dpr ?? "1"}x` : null;
  const estimator = r.estimatorGpus ? `${r.estimatorGpus} GPUs × ${r.estimatorHours ?? "?"} h` : null;
  // Consecutive repeats are the same page still being looked at, not a second
  // visit to it, and printing "/ · /" makes the desk look like it is guessing.
  const journey = [r.landingPath, ...(r.pagesViewed ?? [])].filter(
    (p, i, all): p is string => Boolean(p) && p !== all[i - 1],
  );
  const advance = r.spam ? null : nextStage(r.status);

  return (
    <>
      <p>
        <Link href="/admin" className="adm-chip">
          {ADMIN.detail.back}
        </Link>
      </p>

      {/* --- masthead ------------------------------------------------------ */}
      <header className="adm-plate adm-rise mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <p className="adm-tag text-[var(--accent)]">{r.reference}</p>
          <h1 className="adm-display mt-1 text-[clamp(1.5rem,1.1rem+1.6vw,2.125rem)]">{r.company}</h1>
          <p className="mt-1.5 text-[var(--ink-2)]">
            {r.name} ·{" "}
            <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.reference)}`} className="text-[var(--accent)]">
              {r.email}
            </a>
            {r.phone && <> · {r.phone}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="adm-mark">{SIGNAL_LABEL[signal(r)]}</span>
          <TierMark tier={r.tier} score={r.score} prefix={ADMIN.filters.tier} />
          <StatusMark status={r.status} spam={r.spam} />
          {r.owner && <span className="adm-mark">{r.owner}</span>}
        </div>
      </header>

      {flag && (
        <p role="status" className="adm-notice mt-2.5" data-tone={flag === "saved" ? "ok" : "alarm"}>
          {flag === "saved" ? ADMIN.actions.saved : ADMIN.actions.failed}
        </p>
      )}

      {/* --- the four numbers you want first ------------------------------- */}
      <section aria-label={ADMIN.detail.reading} className="mt-2.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <Plate label={ADMIN.table.capacity} index={0}>
          <Figure value={gpuFigure(r.gpuCount)} unit={ADMIN.table.capacity} />
          <p className="mt-1.5 text-[var(--ink-3)]">{workload(r.workload)}</p>
        </Plate>
        <Plate label={ADMIN.table.start} index={1}>
          <Figure value={month(r.startDate)} />
          <p className="mt-1.5 text-[var(--ink-3)]">{r.startDate}</p>
        </Plate>
        <Plate label={ADMIN.detail.age} index={2}>
          <Figure value={days(ageDays(r.createdAt))} />
          <p className="mt-1.5 text-[var(--ink-3)]">
            {ADMIN.detail.lastMove} {days(ageDays(r.updatedAt))}
          </p>
        </Plate>
        <Plate label={ADMIN.detail.score} index={3}>
          <Figure value={r.score} unit={`${ADMIN.filters.tier} ${r.tier}`} tone={r.tier === "A" ? "accent" : undefined} />
          <p className="mt-1.5 text-[var(--ink-3)]">{ADMIN.detail.scoreHelp}</p>
        </Plate>
      </section>

      <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid gap-2.5">
          <Plate label={ADMIN.detail.intent} note={ADMIN.detail.intentNote}>
            <Reading keys={read(r)} />
          </Plate>

          <Plate label={ADMIN.detail.form}>
            <Row k={ADMIN.fields.gpuCount} v={gpu(r.gpuCount)} />
            <Row k={ADMIN.fields.startDate} v={`${r.startDate} (${month(r.startDate)})`} />
            <Row k={ADMIN.fields.workload} v={workload(r.workload)} />
            <Row k={ADMIN.fields.notes} v={text(r.notes)} pre />
          </Plate>

          <Plate
            label={ADMIN.detail.followup}
            note={r.followupAt ? `${ADMIN.fields.followupAt} ${when(r.followupAt)}` : undefined}
          >
            {r.followupAt ? (
              <>
                <Row k={ADMIN.fields.role} v={followup("role", r.role)} />
                <Row k={ADMIN.fields.phone} v={text(r.phone)} />
                <Row k={ADMIN.fields.teamSize} v={followup("teamSize", r.teamSize)} />
                <Row k={ADMIN.fields.currentProvider} v={followup("currentProvider", r.currentProvider)} />
                <Row k={ADMIN.fields.currentSpend} v={followup("currentSpend", r.currentSpend)} />
                <Row k={ADMIN.fields.termInterest} v={followup("termInterest", r.termInterest)} />
                <Row k={ADMIN.fields.durationMonths} v={followup("durationMonths", r.durationMonths)} />
                <Row k={ADMIN.fields.storageNeeds} v={followup("storageNeeds", r.storageNeeds)} />
                <Row k={ADMIN.fields.dataMovement} v={followup("dataMovement", r.dataMovement)} />
                <Row k={ADMIN.fields.compliance} v={followupList("compliance", r.compliance)} />
                <Row k={ADMIN.fields.decisionTimeframe} v={followup("decisionTimeframe", r.decisionTimeframe)} />
                <Row k={ADMIN.fields.heardFrom} v={followup("heardFrom", r.heardFrom)} />
                <Row k={ADMIN.fields.dealbreakers} v={text(r.dealbreakers)} pre />
              </>
            ) : (
              <p className="text-[var(--ink-3)]">{ADMIN.detail.followupNone}</p>
            )}
          </Plate>

          <div className="grid gap-2.5 lg:grid-cols-2">
            <Plate label={ADMIN.detail.journey}>
              {journey.length ? (
                <ol className="adm-obs">
                  {journey.map((p, i) => (
                    <li key={`${p}-${i}`}>{p}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-[var(--ink-3)]">{ADMIN.detail.journeyNone}</p>
              )}
              <div className="mt-3">
                <Row k={ADMIN.fields.referrer} v={text(r.referrer) === ADMIN.values.none ? ADMIN.values.direct : text(r.referrer)} />
                <Row k={ADMIN.fields.utm} v={utm || ADMIN.values.none} />
                <Row k={ADMIN.fields.path} v={text(r.path)} />
              </div>
            </Plate>

            <Plate label={ADMIN.detail.engagement}>
              <Row k={ADMIN.fields.timeOnPage} v={ms(r.timeOnPageMs)} />
              <Row k={ADMIN.fields.formFill} v={ms(r.formFillMs)} />
              <Row k={ADMIN.fields.validationFailures} v={text(r.validationFailures)} />
              <Row k={ADMIN.fields.estimator} v={estimator ?? ADMIN.values.none} />
              <Row k={ADMIN.fields.sectionsViewed} v={r.sectionsViewed?.join(" → ") || ADMIN.values.none} />
              <Row k={ADMIN.fields.sourceClicks} v={text(r.sourceClicks)} />
            </Plate>
          </div>

          <Plate label={ADMIN.detail.context}>
            <Row k={ADMIN.fields.landingPath} v={text(r.landingPath)} />
            <Row k={ADMIN.fields.country} v={location || ADMIN.values.none} />
            <Row k={ADMIN.fields.locale} v={text(r.locale)} />
            <Row k={ADMIN.fields.timezone} v={text(r.timezone)} />
            <Row k={ADMIN.fields.device} v={text(r.deviceClass)} />
            <Row k={ADMIN.fields.viewport} v={viewport ?? ADMIN.values.none} />
            <Row k={ADMIN.fields.colorScheme} v={text(r.colorScheme)} />
            <Row k={ADMIN.fields.reducedMotion} v={yesNo(r.reducedMotion)} />
            <Row k={ADMIN.fields.jsEnabled} v={yesNo(r.jsEnabled)} />
            <Row k={ADMIN.fields.userAgent} v={text(r.userAgent)} />
            <Row k={ADMIN.fields.ipHash} v={text(r.ipHash)} />
            <Row k={ADMIN.fields.sessionId} v={text(r.sessionId)} />
          </Plate>

          <Plate label={ADMIN.detail.pipeline}>
            <Row k={ADMIN.fields.receipt} v={sentAt(r.receiptSentAt)} />
            <Row k={ADMIN.fields.notify} v={sentAt(r.notifySentAt)} />
            <Row k={ADMIN.fields.webhook} v={sentAt(r.webhookSentAt)} />
            <Row k={ADMIN.fields.idempotencyKey} v={text(r.idempotencyKey)} />
            <Row k={ADMIN.fields.id} v={r.id} />
            {r.spam && <Row k={STATUS_LABEL.spam} v={text(r.spamReason)} />}
          </Plate>

          <Plate label={ADMIN.detail.timeline}>
            <ol className="adm-core">
              {events.map((e) => {
                const pairs = payloadPairs(e.payload);
                return (
                  <li
                    key={e.id}
                    className="adm-core-entry"
                    data-key={e.type === "created" || e.type === "status_changed" ? "true" : undefined}
                  >
                    <div>
                      <time dateTime={new Date(e.createdAt).toISOString()} className="text-[var(--ink-3)]">
                        {when(e.createdAt)}
                      </time>
                      <p className="text-[var(--ink-3)]">{e.actor}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[var(--ink)]">{eventName(e.type)}</p>
                      {pairs.length > 0 && (
                        <p className="text-[var(--ink-2)] [overflow-wrap:anywhere]">
                          {pairs.map(([k, v], i) => (
                            <span key={k}>
                              {i > 0 && <span className="adm-sep" aria-hidden />}
                              <span className="text-[var(--ink-3)]">{k} </span>
                              {v}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Plate>
        </div>

        {/* --- the rail ----------------------------------------------------
            Sticky, because the record is long and the actions are the reason
            anyone opened it. Scrolling to the bottom of a dossier to find the
            save button is a tax paid on every single use. */}
        <aside className="grid content-start gap-2.5 xl:sticky xl:top-[4.25rem] xl:max-h-[calc(100dvh-5.5rem)] xl:overflow-y-auto xl:pr-1">
          <Plate label={ADMIN.detail.pipeline} note={ADMIN.detail.depthNote}>
            <DepthGauge status={r.status} spam={r.spam} />
            {advance && (
              <form action={advanceStatus} className="mt-3">
                <input type="hidden" name="reference" value={r.reference} />
                <Submit className="adm-btn adm-btn-solid w-full">
                  {ADMIN.actions.advance} → {STATUS_LABEL[advance]}
                </Submit>
              </form>
            )}
          </Plate>

          <Plate label={ADMIN.detail.actions} note={ADMIN.detail.actionsNote}>
            <form action={setStatus} className="grid gap-2">
              <input type="hidden" name="reference" value={r.reference} />
              <label htmlFor="a-status" className="adm-tag">
                {ADMIN.actions.status}
              </label>
              <select id="a-status" name="status" defaultValue={r.spam ? "spam" : r.status} className="adm-select">
                {RESERVATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <Submit className="adm-btn">
                {ADMIN.actions.save}
              </Submit>
            </form>

            <form action={setOwner} className="mt-4 grid gap-2 border-t border-[var(--rule)] pt-4">
              <input type="hidden" name="reference" value={r.reference} />
              <label htmlFor="a-owner" className="adm-tag">
                {ADMIN.actions.owner}
              </label>
              <input
                id="a-owner"
                name="owner"
                type="text"
                maxLength={120}
                defaultValue={r.owner ?? ""}
                placeholder={ADMIN.actions.ownerPlaceholder}
                className="adm-input"
              />
              <Submit className="adm-btn">
                {ADMIN.actions.save}
              </Submit>
            </form>

            <p className="mt-4 border-t border-[var(--rule)] pt-4">
              <a href={`mailto:${r.email}?subject=${encodeURIComponent(r.reference)}`} className="adm-btn w-full">
                {ADMIN.detail.mailto}
              </a>
            </p>
          </Plate>

          <Plate label={ADMIN.detail.notes}>
            <form action={addNote} className="grid gap-2">
              <input type="hidden" name="reference" value={r.reference} />
              <label htmlFor="a-note" className="adm-tag">
                {ADMIN.actions.note}
              </label>
              <textarea
                id="a-note"
                name="note"
                maxLength={4000}
                placeholder={ADMIN.actions.notePlaceholder}
                className="adm-textarea"
              />
              <Submit className="adm-btn">
                {ADMIN.actions.save}
              </Submit>
            </form>
            {r.internalNotes ? (
              <pre className="mt-3 whitespace-pre-wrap border-l border-[var(--rule-strong)] pl-3 text-[var(--ink-2)] [overflow-wrap:anywhere]">
                {r.internalNotes}
              </pre>
            ) : (
              <p className="mt-3 text-[var(--ink-3)]">{ADMIN.detail.notesNone}</p>
            )}
          </Plate>

          <Plate label={ADMIN.detail.danger}>
            <form action={toggleSpam}>
              <input type="hidden" name="reference" value={r.reference} />
              <Submit className={`adm-btn w-full ${r.spam ? "" : "adm-btn-danger"}`}>
                {r.spam ? ADMIN.actions.unflagSpam : ADMIN.actions.flagSpam}
              </Submit>
            </form>

            <form action={eraseReservation} className="mt-4 grid gap-2 border-t border-[var(--rule)] pt-4">
              <input type="hidden" name="reference" value={r.reference} />
              <label htmlFor="a-erase" className="adm-tag text-[var(--alarm)]">
                {ADMIN.actions.erase}
              </label>
              <p className="text-[var(--ink-3)] text-pretty">{ADMIN.actions.eraseHelp}</p>
              <input
                id="a-erase"
                name="confirm"
                type="text"
                required
                pattern="[Rr]-[A-Za-z0-9]{6}"
                autoComplete="off"
                placeholder={ADMIN.actions.eraseConfirmPlaceholder}
                className="adm-input"
              />
              <Submit className="adm-btn adm-btn-danger">
                {ADMIN.actions.erase}
              </Submit>
            </form>
          </Plate>
        </aside>
      </div>
    </>
  );
}

function Row({ k, v, pre }: { k: string; v: string; pre?: boolean }) {
  return (
    <dl className="adm-dl" data-empty={v === ADMIN.values.none ? "true" : undefined}>
      <dt>{k}</dt>
      <dd className={pre ? "whitespace-pre-wrap" : undefined}>{v}</dd>
    </dl>
  );
}
