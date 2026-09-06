"use client";

/**
 * RESERVATION FORM — a paper form with a switchboard on it.
 *
 * GPU count is a bank of tickets, and beside it an allocation board: the
 * fleet as one row of eight per node, lit to the count chosen. The board is
 * the one place the reader can touch the fleet, and it is honest by
 * construction — there are as many cells as devices, and no more can be lit.
 * Target start is a date with quick-set chips.
 * Everything else is a ruled field.
 *
 * Same hook, same zod schema, same submit path as before — this file is
 * markup and style. It works with the stage dead, with the scroll choreography
 * dead, and with JavaScript off (native POST to /api/reservation).
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { SITE } from "@/config/site";
import {
  FIELDS,
  FORM_COPY,
  GPU_COUNT_OPTIONS,
  START_DATE_PRESETS,
  TARGET_START_FLOOR,
  field,
  FLEET,
  QUOTE,
  CONTRACT,
  FOLLOWUP_COPY,
} from "@/content";
import { useReservationForm } from "@/lib/useReservationForm";
import type { ReservationFormState } from "@/lib/validation";
import { Followup } from "./Followup";

const STANDARD_ORDER = ["company", "name", "email", "workload", "notes"] as const;

function subscribeLocation(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/** The no-JS round trip lands back here with flags in the query string. */
function readLocation(): string {
  return window.location.search;
}

/**
 * How many cells an option lights.
 *
 * Options are stored strings ("1-2", "8", "48+"), so this reads the leading
 * integer and treats a trailing "+" as the whole fleet — which keeps working
 * when the fleet grows and the rungs change.
 */
function litCells(value: string): { lit: number; over: boolean } {
  if (value === "1-2") return { lit: 2, over: false };
  if (value.endsWith("+")) return { lit: FLEET.total, over: true };
  const n = Number(value);
  return { lit: Number.isFinite(n) ? Math.min(FLEET.total, n) : 0, over: false };
}

/** The option a tapped cell should select: the smallest option that covers it. */
function optionForCell(index: number): string {
  const need = index + 1;
  const ordered = GPU_COUNT_OPTIONS.filter((o) => !o.value.endsWith("+"))
    .map((o) => ({ value: o.value, n: litCells(o.value).lit }))
    .sort((a, b) => a.n - b.n);
  return (ordered.find((o) => o.n >= need) ?? ordered[ordered.length - 1]).value;
}

export function Console() {
  const form = useReservationForm("d3");
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const search = useSyncExternalStore(subscribeLocation, readLocation, () => "");
  const params = new URLSearchParams(search);
  const nativeSuccess = params.get("reservation") === "received";
  const nativeInvalid = params.get("reservation") === "invalid";
  const nativeError = params.get("reservation") === "error";

  useEffect(() => {
    if (form.attempted && form.firstErrorField) summaryRef.current?.focus();
  }, [form.attempted, form.firstErrorField]);

  useEffect(() => {
    if (form.status === "success") successRef.current?.focus();
  }, [form.status]);

  if (form.status === "success" || nativeSuccess) {
    const followupFlag = params.get("followup");
    return (
      <Received
        ref={successRef}
        onReset={form.reset}
        reference={form.reference ?? params.get("ref")}
        email={form.submitted?.email ?? null}
        followupStatus={followupFlag === "saved" ? "saved" : followupFlag === "error" ? "error" : "idle"}
      />
    );
  }

  const errorCount = Object.values(form.errors).filter(Boolean).length;
  const chosen = GPU_COUNT_OPTIONS.find((o) => o.value === form.values.gpuCount);
  const { lit, over } = litCells(form.values.gpuCount);
  const pct = Math.round((form.completion.filled / form.completion.total) * 100);
  const busy = form.status === "submitting";

  return (
    <form
      method="post"
      action="/api/reservation"
      onSubmit={form.handleSubmit}
      noValidate
      aria-labelledby="reserve-heading"
      className="d3-panel d3-ticks"
    >
      <input type="hidden" name="returnTo" value="/" />
      {/* Honeypot. Off-screen, skipped by the tab order, never autofilled.
          Anything typed into it marks the submission as a bot on the server. */}
      <div aria-hidden className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
        <label htmlFor="d3-website">Website</label>
        <input id="d3-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {/* --- form head ----------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[var(--rule-strong)] px-5 py-3 md:px-7">
        <p className="d3-pip text-[var(--accent)]">Reservation form</p>
        <div className="flex items-center gap-3">
          <span className="d3-tag text-[0.5rem] text-[var(--ink-3)]">
            {form.completion.filled}/{form.completion.total} set
          </span>
          <span aria-hidden className="h-1 w-24 bg-[var(--rule)]">
            <span
              className="block h-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ width: `${pct}%`, background: "var(--accent)" }}
            />
          </span>
        </div>
      </div>

      <div className="grid gap-10 px-5 py-7 md:px-7 md:py-9">
        {/* --- error summary ----------------------------------------------- */}
        {(nativeInvalid || nativeError) && errorCount === 0 && (
          <div role="alert" className="border border-[var(--alarm)] bg-[color-mix(in_oklab,var(--alarm)_8%,transparent)] px-4 py-3">
            <p className="d3-pip text-[var(--alarm)]">
              {nativeError ? FORM_COPY.nativeError.heading : FORM_COPY.nativeInvalid.heading}
            </p>
            <p className="d3-body mt-1.5 text-[0.8125rem] text-[var(--ink-2)]">
              {nativeError ? FORM_COPY.nativeError.body : FORM_COPY.nativeInvalid.body}
            </p>
          </div>
        )}
        <div
          ref={summaryRef}
          tabIndex={-1}
          role={errorCount > 0 ? "alert" : undefined}
          aria-live="polite"
          className={
            errorCount > 0
              ? "border border-[var(--alarm)] bg-[color-mix(in_oklab,var(--alarm)_8%,transparent)] px-4 py-3"
              : "sr-only"
          }
        >
          {errorCount > 0 && (
            <>
              <p className="d3-pip text-[var(--alarm)]">
                {errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention
              </p>
              <ul className="mt-2 space-y-1">
                {FIELDS.filter((f) => form.errors[f.name as keyof ReservationFormState]).map((f) => (
                  <li key={f.name}>
                    <a href={`#d3-${f.name}`} className="d3-body d3-link text-[0.8125rem]">
                      {f.label} — {form.errors[f.name as keyof ReservationFormState]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* --- 01 · capacity ----------------------------------------------- */}
        <fieldset aria-describedby="d3-gpuCount-help d3-gpuCount-error" disabled={busy}>
          <legend className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2">
            <span className="d3-tag text-[var(--ink)]">
              <span className="d3-figure mr-2 text-[var(--accent)]">01</span>
              {field("gpuCount").label}
            </span>
            <span className="d3-tag text-[0.5rem] text-[var(--accent)]">{FORM_COPY.requiredNote}</span>
          </legend>

          <p id="d3-gpuCount-help" className="d3-body mt-3 text-[0.8125rem] text-[var(--ink-3)]">
            {field("gpuCount").help}
          </p>

          <div className="mt-5 grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
            <div className="grid gap-2 sm:grid-cols-2">
              {GPU_COUNT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="d3-ticket"
                >
                  <input
                    type="radio"
                    name="gpuCount"
                    value={opt.value}
                    checked={form.values.gpuCount === opt.value}
                    onChange={form.handleChange}
                    required
                  />
                  <span className="d3-figure block text-[0.9375rem] leading-none text-[var(--ink)]">{opt.label}</span>
                  {opt.hint && (
                    <span className="d3-body mt-1.5 block text-[0.6875rem] leading-snug text-[var(--ink-3)]">
                      {opt.hint}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {/* The allocation board. One row of eight per node. The radios
                above are the control; this is the same choice, drawn. */}
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">Allocation board</p>
                <p className="d3-figure text-[0.75rem]" style={{ color: lit ? "var(--accent)" : "var(--ink-3)" }}>
                  {lit}
                  <span className="text-[var(--ink-3)]">/{FLEET.total}</span>
                </p>
              </div>
              <div className="mt-2 grid gap-1.5" aria-hidden>
                {Array.from({ length: FLEET.nodes }, (_, node) => (
                  <div key={node} className="grid grid-cols-[auto_1fr] items-center gap-2">
                    <span className="d3-tag w-7 text-[0.4375rem] text-[var(--ink-3)]">N{node + 1}</span>
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${FLEET.gpusPerNode}, minmax(0, 1fr))` }}>
                      {Array.from({ length: FLEET.gpusPerNode }, (_, i) => {
                        const index = node * FLEET.gpusPerNode + i;
                        const on = index < lit;
                        return (
                          <button
                            key={i}
                            type="button"
                            tabIndex={-1}
                            disabled={busy}
                            className="d3-cell"
                            data-on={on ? (over ? "partial" : "true") : "false"}
                            onClick={() => form.setValue("gpuCount", optionForCell(index))}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="d3-tag mt-2 text-[0.4375rem] text-[var(--ink-3)]">
                {over
                  ? `Exceeds the fleet — ${FLEET.total} is the whole board.`
                  : lit
                    ? `${lit} of ${FLEET.total} devices${
                        lit === FLEET.total
                          ? ` — all ${FLEET.nodes} nodes`
                          : lit % FLEET.gpusPerNode === 0
                            ? ` — ${lit / FLEET.gpusPerNode === 1 ? "one full node" : `${lit / FLEET.gpusPerNode} full nodes`}`
                            : ""
                      }`
                    : `${FLEET.nodes} nodes × ${FLEET.gpusPerNode} devices. Pick a count.`}
              </p>
            </div>
          </div>

          <Err id="d3-gpuCount-error" message={form.errors.gpuCount} />
        </fieldset>

        {/* --- 02 · start date --------------------------------------------- */}
        <div>
          <div className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2">
            <label htmlFor="d3-startDate" className="d3-tag text-[var(--ink)]">
              <span className="d3-figure mr-2 text-[var(--accent)]">02</span>
              {field("startDate").label}
            </label>
            <span className="d3-tag text-[0.5rem] text-[var(--accent)]">{FORM_COPY.requiredNote}</span>
          </div>

          <p id="d3-startDate-help" className="d3-body mt-3 text-[0.8125rem] text-[var(--ink-3)]">
            {field("startDate").help}
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-3">
            <input
              id="d3-startDate"
              name="startDate"
              type="date"
              required
              disabled={busy}
              min={TARGET_START_FLOOR}
              value={form.values.startDate}
              onChange={form.handleChange}
              onBlur={() => form.handleBlur("startDate")}
              aria-describedby="d3-startDate-help d3-startDate-error"
              aria-invalid={form.errors.startDate ? true : undefined}
              className="d3-input d3-figure max-w-[11rem]"
            />
            <div className="flex flex-wrap gap-2">
              {START_DATE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={busy}
                  onClick={() => form.setValue("startDate", p.value)}
                  aria-pressed={form.values.startDate === p.value}
                  className="d3-chip"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <Err id="d3-startDate-error" message={form.errors.startDate} />
        </div>

        {/* --- 03 · identification ----------------------------------------- */}
        <div>
          <div className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2">
            <span className="d3-tag text-[var(--ink)]">
              <span className="d3-figure mr-2 text-[var(--ink-3)]">03</span>
              Who to contact
            </span>
          </div>

          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {STANDARD_ORDER.map((name) => {
              const f = field(name);
              const err = form.errors[name as keyof ReservationFormState];
              const wide = f.type === "textarea";
              return (
                <div key={f.name} className={wide ? "sm:col-span-2" : undefined}>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={`d3-${f.name}`} className="d3-tag text-[0.5625rem] text-[var(--ink-2)]">
                      {f.label}
                    </label>
                    <span
                      className="d3-tag text-[0.4375rem]"
                      style={{ color: f.required ? "var(--accent)" : "var(--ink-3)" }}
                    >
                      {f.required ? FORM_COPY.requiredNote : FORM_COPY.optionalNote}
                    </span>
                  </div>

                  {f.type === "select" ? (
                    <select
                      id={`d3-${f.name}`}
                      name={f.name}
                      required={f.required}
                      disabled={busy}
                      value={form.values[f.name as keyof ReservationFormState]}
                      onChange={form.handleChange}
                      onBlur={() => form.handleBlur(f.name as keyof ReservationFormState)}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={`d3-${f.name}-error`}
                      className="d3-input d3-select mt-2"
                    >
                      <option value="">Select…</option>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={`d3-${f.name}`}
                      name={f.name}
                      rows={4}
                      disabled={busy}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder}
                      value={form.values[f.name as keyof ReservationFormState]}
                      onChange={form.handleChange}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={`d3-${f.name}-help d3-${f.name}-error`}
                      className="d3-input d3-textarea mt-2"
                    />
                  ) : (
                    <input
                      id={`d3-${f.name}`}
                      name={f.name}
                      type={f.type}
                      required={f.required}
                      disabled={busy}
                      maxLength={f.maxLength}
                      autoComplete={f.autoComplete}
                      placeholder={f.placeholder}
                      value={form.values[f.name as keyof ReservationFormState]}
                      onChange={form.handleChange}
                      onBlur={() => form.handleBlur(f.name as keyof ReservationFormState)}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={`d3-${f.name}-help d3-${f.name}-error`}
                      className="d3-input mt-2"
                    />
                  )}

                  {f.help && (
                    <p id={`d3-${f.name}-help`} className="d3-body mt-2 text-[0.75rem] text-[var(--ink-3)]">
                      {f.help}
                    </p>
                  )}
                  <Err id={`d3-${f.name}-error`} message={err} />
                </div>
              );
            })}
          </div>
        </div>

        {/* --- readout + submit -------------------------------------------- */}
        <div className="border-t border-[var(--rule-strong)] pt-6">
          <dl className="mb-6 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-3">
            {[
              { k: "Capacity", v: chosen?.label ?? "Not set", set: Boolean(chosen) },
              {
                k: "From",
                v: form.values.startDate ? formatChosen(form.values.startDate) : "Not set",
                set: Boolean(form.values.startDate),
              },
              { k: "Rate", v: QUOTE.short, set: true },
            ].map((cell) => (
              <div key={cell.k} className="bg-[var(--bg)] px-4 py-3">
                <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">{cell.k}</dt>
                <dd className="d3-figure mt-1.5 text-[0.9375rem]" style={{ color: cell.set ? "var(--accent)" : "var(--ink-3)" }}>
                  {cell.v}
                </dd>
              </div>
            ))}
          </dl>

          {form.status === "error" && form.formError && (
            <div
              role="alert"
              className="mb-5 border border-[var(--alarm)] bg-[color-mix(in_oklab,var(--alarm)_8%,transparent)] px-4 py-3"
            >
              <p className="d3-pip text-[var(--alarm)]">{FORM_COPY.error.heading}</p>
              <p className="d3-body mt-1.5 text-[0.8125rem] text-[var(--ink-2)]">
                {form.formError} {FORM_COPY.error.body}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-5 sm:gap-y-4">
            <button type="submit" className="d3-btn w-full sm:w-auto" disabled={busy} aria-busy={busy || undefined}>
              {busy ? FORM_COPY.submitting : FORM_COPY.submit}
              {!busy && <span aria-hidden>→</span>}
            </button>
            <p className="d3-body max-w-[34ch] text-[0.75rem] text-[var(--ink-2)] text-pretty">
              {FORM_COPY.microcopy.commitment}
            </p>
          </div>

          <p className="d3-body mt-5 max-w-[62ch] text-[0.75rem] text-[var(--ink-3)] text-pretty">
            {FORM_COPY.microcopy.privacy} {CONTRACT.model} terms are agreed on a call, not here.
          </p>

          <p className="d3-tag mt-5 text-[0.4375rem] text-[var(--ink-3)]">
            {FLEET.total} GPUs in the fleet · allocation by arrival order · {SITE.availability}
          </p>
        </div>
      </div>
    </form>
  );
}

function formatChosen(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !months[m - 1]) return iso;
  return `${months[m - 1]} ${y}`;
}

function Err({ id, message }: { id: string; message?: string }) {
  return (
    <p
      id={id}
      role={message ? "alert" : undefined}
      className="d3-tag mt-2 text-[0.5625rem] normal-case tracking-[0.04em]"
      style={{ color: "var(--alarm)" }}
    >
      {message}
    </p>
  );
}

export function Received({
  ref,
  onReset,
  reference,
  email,
  followupStatus = "idle",
  returnTo = "/",
}: {
  ref?: React.Ref<HTMLDivElement>;
  onReset?: () => void;
  /** From the server on the JS path, from the URL on the no-JS path. Null if an external endpoint gave none. */
  reference: string | null;
  /** Known on the JS path; asked for on the no-JS result page. */
  email: string | null;
  followupStatus?: "idle" | "saved" | "error";
  returnTo?: string;
}) {
  return (
    <div ref={ref} tabIndex={-1} role="status" className="d3-panel d3-ticks">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--rule-strong)] px-5 py-3 md:px-7">
        <p className="d3-pip text-[var(--accent)]">{FORM_COPY.success.pip}</p>
        <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{SITE.name}</p>
      </div>

      <div className="px-5 py-10 md:px-7 md:py-14">
        <h3 className="d3-display text-[clamp(2.25rem,6vw,4.5rem)]" style={{ ["--wght" as string]: 800 }}>
          {FORM_COPY.success.heading}
        </h3>

        {reference && (
          <div className="mt-6 inline-grid gap-1 border border-[var(--rule-strong)] px-5 py-4">
            <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{FOLLOWUP_COPY.referenceLabel}</p>
            <p className="d3-figure text-[clamp(1.5rem,3vw,2rem)] leading-none text-[var(--accent)]">{reference}</p>
            <p className="d3-body mt-1 max-w-[36ch] text-[0.75rem] text-[var(--ink-3)] text-pretty">
              {FOLLOWUP_COPY.referenceHelp}
            </p>
          </div>
        )}

        <p className="d3-voice mt-6 max-w-[40ch] text-[1.375rem] leading-[1.15] text-[var(--ink)] text-pretty md:text-[1.5rem]">
          {FORM_COPY.success.body}
        </p>
        <p className="d3-body mt-4 max-w-[52ch] text-[0.875rem] text-[var(--ink-3)] text-pretty">
          {FORM_COPY.success.detail}
        </p>

        <ol className="mt-9 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] md:grid-cols-3">
          {FORM_COPY.whatHappensNext.map((step, i) => (
            <li key={step} className="bg-[var(--surface)] p-5">
              <p className="d3-figure text-[0.6875rem] text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</p>
              <p className="d3-body mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">{step}</p>
            </li>
          ))}
        </ol>

        <Followup reference={reference} email={email} initialStatus={followupStatus} returnTo={returnTo} />

        {onReset && (
          <button type="button" onClick={onReset} className="d3-btn d3-btn-ghost mt-9">
            {FORM_COPY.success.again}
          </button>
        )}
      </div>
    </div>
  );
}
