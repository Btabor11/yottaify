"use client";

/**
 * D1 RESERVATION FORM — styled as a requisition, not a mailing-list signup.
 *
 * All logic lives in useReservationForm → submitReservation. This file is
 * markup and style only. It has no dependency on GSAP, Lenis, or WebGL, and it
 * is never gated on a scroll trigger — it is the point of the site.
 *
 * Progressive enhancement: the <form> has a real method/action, so if the
 * client bundle never arrives the browser POSTs natively to /api/reservation
 * and comes back with ?reservation=received.
 */

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/config/site";
import {
  FIELDS,
  FORM_COPY,
  GPU_COUNT_OPTIONS,
  START_DATE_PRESETS,
  TARGET_START_FLOOR,
  field,
  FLEET,
  RATE,
} from "@/content";
import { useReservationForm } from "@/lib/useReservationForm";
import type { ReservationFormState } from "@/lib/validation";

const STANDARD_ORDER = ["company", "name", "email", "workload", "notes"] as const;

export function ReservationForm() {
  const form = useReservationForm("d1");
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [nativeSuccess, setNativeSuccess] = useState(false);

  // Recognise the no-JS round trip. Read from location rather than
  // useSearchParams so the page stays statically renderable.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reservation") === "received") setNativeSuccess(true);
  }, []);

  // Move focus to the error summary so a keyboard or screen-reader user is
  // told what went wrong instead of silently re-reading the form.
  useEffect(() => {
    if (form.attempted && form.firstErrorField) summaryRef.current?.focus();
  }, [form.attempted, form.firstErrorField]);

  useEffect(() => {
    if (form.status === "success") successRef.current?.focus();
  }, [form.status]);

  if (form.status === "success" || nativeSuccess) {
    return <SuccessPanel ref={successRef} onReset={form.reset} />;
  }

  const errorCount = Object.values(form.errors).filter(Boolean).length;

  return (
    <form
      method="post"
      action="/api/reservation"
      onSubmit={form.handleSubmit}
      noValidate
      className="grid gap-8"
      aria-labelledby="reserve-heading"
    >
      <input type="hidden" name="returnTo" value="/d1" />

      {/* --- the slot, taking shape --------------------------------------
          Updates as the two tiering fields get answered. This is what makes
          the form feel like holding a slot rather than joining a list: the
          thing being reserved is visible and specific before you submit.
      ------------------------------------------------------------------- */}
      <div className="d1-ticked border border-[var(--rule-strong)] bg-[var(--surface)]">
        <div className="flex items-baseline justify-between gap-4 border-b border-[var(--rule)] px-4 py-2.5">
          <span className="d1-label text-[var(--ink-3)]">Reservation draft</span>
          <span className="d1-label text-[var(--ink-3)]">Not yet submitted</span>
        </div>
        <dl className="grid grid-cols-3">
          {[
            {
              label: "Capacity",
              value:
                GPU_COUNT_OPTIONS.find((o) => o.value === form.values.gpuCount)?.label ?? "—",
              set: Boolean(form.values.gpuCount),
            },
            {
              label: "From",
              value: form.values.startDate ? formatChosenDate(form.values.startDate) : "—",
              set: Boolean(form.values.startDate),
            },
            { label: "Rate", value: RATE.fullShort, set: true },
          ].map((cell) => (
            <div key={cell.label} className="border-r border-[var(--rule)] px-4 py-3 last:border-r-0">
              <dt className="d1-label text-[var(--ink-3)]">{cell.label}</dt>
              <dd
                className="d1-figure mt-1.5 text-[0.875rem] leading-tight"
                style={{ color: cell.set ? "var(--accent)" : "var(--ink-3)" }}
              >
                {cell.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* --- error summary ------------------------------------------------ */}
      <div
        ref={summaryRef}
        tabIndex={-1}
        role={errorCount > 0 ? "alert" : undefined}
        aria-live="polite"
        className={errorCount > 0 ? "border border-[var(--hot)] p-4" : "sr-only"}
        style={errorCount > 0 ? { background: "color-mix(in oklab, var(--hot) 8%, transparent)" } : undefined}
      >
        {errorCount > 0 && (
          <>
            <p className="d1-label" style={{ color: "var(--hot)" }}>
              {errorCount} {errorCount === 1 ? "field needs" : "fields need"} attention
            </p>
            <ul className="mt-2.5 space-y-1">
              {FIELDS.filter((f) => form.errors[f.name as keyof ReservationFormState]).map((f) => (
                <li key={f.name}>
                  <a href={`#d1-${f.name}`} className="d1-body text-[0.8125rem] underline decoration-[var(--hot)] decoration-1 underline-offset-2">
                    {f.label} — {form.errors[f.name as keyof ReservationFormState]}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* --- PRIMARY: GPU count ------------------------------------------ */}
      <fieldset
        aria-describedby="d1-gpuCount-help d1-gpuCount-error"
        aria-invalid={form.errors.gpuCount ? true : undefined}
      >
        <legend className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2.5">
          <span className="d1-label text-[var(--ink)]">
            <span className="d1-figure mr-2 text-[var(--accent)]">01</span>
            {field("gpuCount").label}
          </span>
          <span className="d1-label text-[var(--ink-3)]">{FORM_COPY.requiredNote}</span>
        </legend>

        <p id="d1-gpuCount-help" className="d1-label mt-3 normal-case tracking-[0.03em] text-[var(--ink-3)]">
          {field("gpuCount").help}
        </p>

        {/* Five options in two columns, with the last spanning — a 3-column
            grid leaves an empty cell that reads as a missing option. */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {GPU_COUNT_OPTIONS.map((opt, i) => (
            <label
              key={opt.value}
              className={`d1-seg${i === GPU_COUNT_OPTIONS.length - 1 ? " sm:col-span-2" : ""}`}
            >
              <input
                type="radio"
                name="gpuCount"
                value={opt.value}
                checked={form.values.gpuCount === opt.value}
                onChange={form.handleChange}
                required
              />
              <span className="d1-figure block text-[1rem] leading-none">{opt.label}</span>
              {opt.hint && (
                <span className="d1-label mt-2 block normal-case tracking-[0.03em] text-[var(--ink-3)]">
                  {opt.hint}
                </span>
              )}
            </label>
          ))}
        </div>

        <FieldError id="d1-gpuCount-error" message={form.errors.gpuCount} />
      </fieldset>

      {/* --- PRIMARY: start date ----------------------------------------- */}
      <div>
        <div className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2.5">
          <label htmlFor="d1-startDate" className="d1-label text-[var(--ink)]">
            <span className="d1-figure mr-2 text-[var(--accent)]">02</span>
            {field("startDate").label}
          </label>
          <span className="d1-label text-[var(--ink-3)]">{FORM_COPY.requiredNote}</span>
        </div>

        <p id="d1-startDate-help" className="d1-label mt-3 normal-case tracking-[0.03em] text-[var(--ink-3)]">
          {field("startDate").help}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-start">
          <input
            id="d1-startDate"
            name="startDate"
            type="date"
            required
            min={TARGET_START_FLOOR}
            value={form.values.startDate}
            onChange={form.handleChange}
            onBlur={() => form.handleBlur("startDate")}
            aria-describedby="d1-startDate-help d1-startDate-error"
            aria-invalid={form.errors.startDate ? true : undefined}
            className="d1-field d1-figure"
          />

          <div className="flex flex-wrap gap-1.5">
            {START_DATE_PRESETS.map((p) => {
              const active = form.values.startDate === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => form.setValue("startDate", p.value)}
                  aria-pressed={active}
                  className="d1-label border px-2.5 py-2 transition-colors"
                  style={{
                    borderColor: active ? "var(--accent)" : "var(--rule-strong)",
                    color: active ? "var(--accent)" : "var(--ink-2)",
                    background: active
                      ? "color-mix(in oklab, var(--accent) 10%, transparent)"
                      : "transparent",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <FieldError id="d1-startDate-error" message={form.errors.startDate} />
      </div>

      {/* --- STANDARD FIELDS --------------------------------------------- */}
      <div>
        <div className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2.5">
          <span className="d1-label text-[var(--ink)]">
            <span className="d1-figure mr-2 text-[var(--ink-3)]">03</span>
            Who you are
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {STANDARD_ORDER.map((name) => {
            const f = field(name);
            const err = form.errors[name as keyof ReservationFormState];
            const wide = f.type === "textarea";
            return (
              <div key={f.name} className={wide ? "sm:col-span-2" : undefined}>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={`d1-${f.name}`} className="d1-label text-[var(--ink-2)]">
                    {f.label}
                  </label>
                  {!f.required && (
                    <span className="d1-label text-[var(--ink-3)]">{FORM_COPY.optionalNote}</span>
                  )}
                </div>

                {f.type === "select" ? (
                  <select
                    id={`d1-${f.name}`}
                    name={f.name}
                    required={f.required}
                    value={form.values[f.name as keyof ReservationFormState]}
                    onChange={form.handleChange}
                    onBlur={() => form.handleBlur(f.name as keyof ReservationFormState)}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={`d1-${f.name}-error`}
                    className="d1-field d1-select mt-2"
                  >
                    <option value="">Choose one…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    id={`d1-${f.name}`}
                    name={f.name}
                    rows={4}
                    maxLength={f.maxLength}
                    placeholder={f.placeholder}
                    value={form.values[f.name as keyof ReservationFormState]}
                    onChange={form.handleChange}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={`d1-${f.name}-help d1-${f.name}-error`}
                    className="d1-field mt-2 resize-y"
                  />
                ) : (
                  <input
                    id={`d1-${f.name}`}
                    name={f.name}
                    type={f.type}
                    required={f.required}
                    maxLength={f.maxLength}
                    autoComplete={f.autoComplete}
                    placeholder={f.placeholder}
                    value={form.values[f.name as keyof ReservationFormState]}
                    onChange={form.handleChange}
                    onBlur={() => form.handleBlur(f.name as keyof ReservationFormState)}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={`d1-${f.name}-help d1-${f.name}-error`}
                    className="d1-field mt-2"
                  />
                )}

                {f.help && (
                  <p
                    id={`d1-${f.name}-help`}
                    className="d1-label mt-2 normal-case tracking-[0.03em] text-[var(--ink-3)]"
                  >
                    {f.help}
                  </p>
                )}
                <FieldError id={`d1-${f.name}-error`} message={err} />
              </div>
            );
          })}
        </div>
      </div>

      {/* --- SUBMIT ------------------------------------------------------- */}
      <div className="border-t border-[var(--rule-strong)] pt-6">
        {form.status === "error" && form.formError && (
          <div
            role="alert"
            className="mb-5 border border-[var(--hot)] p-4"
            style={{ background: "color-mix(in oklab, var(--hot) 8%, transparent)" }}
          >
            <p className="d1-label" style={{ color: "var(--hot)" }}>
              {FORM_COPY.error.heading}
            </p>
            <p className="d1-body mt-2 text-[0.8125rem] text-[var(--ink-2)]">
              {form.formError} {FORM_COPY.error.body}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <button type="submit" className="d1-btn" disabled={form.status === "submitting"}>
            {form.status === "submitting" ? FORM_COPY.submitting : FORM_COPY.submit}
            {form.status !== "submitting" && <span aria-hidden>→</span>}
          </button>

          <p className="d1-label max-w-[26rem] normal-case tracking-[0.03em] text-[var(--ink-3)]">
            {FORM_COPY.microcopy.commitment}
          </p>
        </div>

        <p className="d1-label mt-5 max-w-[52ch] normal-case tracking-[0.03em] text-[var(--ink-3)]">
          {FORM_COPY.microcopy.privacy}
        </p>

        {/* Live progress. Framed as a checklist, not a progress bar — the aim
            is "you are three answers from holding a slot". */}
        <p aria-live="polite" className="d1-label mt-5 text-[var(--ink-3)]">
          <span className="d1-figure text-[var(--accent)]">
            {form.completion.filled}/{form.completion.total}
          </span>
          <span className="ml-2">required answers · {FLEET.total} GPUs in the fleet</span>
        </p>
      </div>
    </form>
  );
}

/** "2026-11-01" → "Nov 2026". Month granularity is what the draft needs. */
function formatChosenDate(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!y || !m || !months[m - 1]) return iso;
  return `${months[m - 1]} ${y}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p
      id={id}
      role={message ? "alert" : undefined}
      className="d1-label mt-2 normal-case tracking-[0.03em]"
      style={{ color: "var(--hot)", minHeight: message ? undefined : 0 }}
    >
      {message}
    </p>
  );
}

function SuccessPanel({
  ref,
  onReset,
}: {
  ref: React.Ref<HTMLDivElement>;
  onReset: () => void;
}) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="d1-ticked border border-[var(--accent)] p-6 md:p-10"
      style={{ background: "color-mix(in oklab, var(--accent) 6%, transparent)" }}
    >
      <p className="d1-label" style={{ color: "var(--accent)" }}>
        {SITE.name} · Reservation
      </p>
      <h3 className="d1-display mt-4 text-[clamp(1.75rem,5vw,3rem)]">
        {FORM_COPY.success.heading}
      </h3>
      <p className="d1-body mt-5 max-w-[52ch] text-[0.9375rem] text-[var(--ink-2)] text-pretty">
        {FORM_COPY.success.body}
      </p>
      <p className="d1-body mt-3 max-w-[52ch] text-[0.875rem] text-[var(--ink-3)] text-pretty">
        {FORM_COPY.success.detail}
      </p>

      <ol className="mt-8 grid gap-px border border-[var(--rule-strong)] bg-[var(--rule)] sm:grid-cols-3">
        {FORM_COPY.whatHappensNext.map((step, i) => (
          <li key={step} className="bg-[var(--bg)] p-4">
            <span className="d1-figure text-[0.625rem] text-[var(--accent)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="d1-body mt-2 text-[0.8125rem] text-[var(--ink-2)]">{step}</p>
          </li>
        ))}
      </ol>

      <button type="button" onClick={onReset} className="d1-btn d1-btn-ghost mt-8">
        {FORM_COPY.success.again}
      </button>
    </div>
  );
}
