"use client";

/**
 * D3 RESERVATION FORM — a control console.
 *
 * GPU count is a bank of breakers: physical-feeling switches that close with a
 * contact travelling and a glow, so choosing 8 GPUs feels like energising
 * something. Target start is a scale with quick-set stops. Everything else is
 * a terminal field.
 *
 * Same hook, same zod schema, same submit path as D1 and D2 — this file is
 * markup and style only. It works with the WebGL scene dead, with the scroll
 * choreography dead, and with JavaScript off (native POST to /api/reservation).
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
  CONTRACT,
} from "@/content";
import { useReservationForm } from "@/lib/useReservationForm";
import type { ReservationFormState } from "@/lib/validation";

const STANDARD_ORDER = ["company", "name", "email", "workload", "notes"] as const;

export function Console() {
  const form = useReservationForm("d3");
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const [nativeSuccess, setNativeSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reservation") === "received") setNativeSuccess(true);
  }, []);

  useEffect(() => {
    if (form.attempted && form.firstErrorField) summaryRef.current?.focus();
  }, [form.attempted, form.firstErrorField]);

  useEffect(() => {
    if (form.status === "success") successRef.current?.focus();
  }, [form.status]);

  if (form.status === "success" || nativeSuccess) {
    return <Energised ref={successRef} onReset={form.reset} />;
  }

  const errorCount = Object.values(form.errors).filter(Boolean).length;
  const chosen = GPU_COUNT_OPTIONS.find((o) => o.value === form.values.gpuCount);
  const pct = Math.round((form.completion.filled / form.completion.total) * 100);

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

      {/* --- console head ------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[var(--rule-strong)] px-5 py-3 md:px-7">
        <p className="d3-pip text-[var(--accent)]">Reservation console</p>
        <div className="flex items-center gap-3">
          <span className="d3-tag text-[0.5rem] text-[var(--ink-3)]">
            {form.completion.filled}/{form.completion.total} set
          </span>
          <span aria-hidden className="h-1 w-24 bg-[var(--rule)]">
            <span
              className="block h-full transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: `${pct}%`,
                background: "var(--accent)",
                boxShadow: pct > 0 ? "0 0 10px -2px var(--accent)" : undefined,
              }}
            />
          </span>
        </div>
      </div>

      <div className="grid gap-9 px-5 py-7 md:px-7 md:py-9">
        {/* --- error summary --------------------------------------------- */}
        <div
          ref={summaryRef}
          tabIndex={-1}
          role={errorCount > 0 ? "alert" : undefined}
          aria-live="polite"
          className={
            errorCount > 0
              ? "border border-[var(--alarm)] bg-[color-mix(in_oklab,var(--alarm)_10%,transparent)] px-4 py-3"
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

        {/* --- 01 · breaker bank ----------------------------------------- */}
        <fieldset aria-describedby="d3-gpuCount-help d3-gpuCount-error">
          <legend className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2">
            <span className="d3-tag text-[var(--ink)]">
              <span className="d3-figure mr-2 text-[var(--accent)]">01</span>
              {field("gpuCount").label}
            </span>
            <span className="d3-tag text-[0.5rem] text-[var(--accent)]">
              {FORM_COPY.requiredNote}
            </span>
          </legend>

          <p id="d3-gpuCount-help" className="d3-body mt-3 text-[0.8125rem] text-[var(--ink-3)]">
            {field("gpuCount").help}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {GPU_COUNT_OPTIONS.map((opt, i) => (
              <label
                key={opt.value}
                className={`d3-breaker ${i === GPU_COUNT_OPTIONS.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <input
                  type="radio"
                  name="gpuCount"
                  value={opt.value}
                  checked={form.values.gpuCount === opt.value}
                  onChange={form.handleChange}
                  required
                />
                <span className="d3-figure block text-[0.9375rem] leading-none text-[var(--ink)]">
                  {opt.label}
                </span>
                {opt.hint && (
                  <span className="d3-body mt-1.5 block text-[0.6875rem] leading-snug text-[var(--ink-3)]">
                    {opt.hint}
                  </span>
                )}
              </label>
            ))}
          </div>

          <Err id="d3-gpuCount-error" message={form.errors.gpuCount} />
        </fieldset>

        {/* --- 02 · start date ------------------------------------------- */}
        <div>
          <div className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--rule-strong)] pb-2">
            <label htmlFor="d3-startDate" className="d3-tag text-[var(--ink)]">
              <span className="d3-figure mr-2 text-[var(--accent)]">02</span>
              {field("startDate").label}
            </label>
            <span className="d3-tag text-[0.5rem] text-[var(--accent)]">
              {FORM_COPY.requiredNote}
            </span>
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
              min={TARGET_START_FLOOR}
              value={form.values.startDate}
              onChange={form.handleChange}
              onBlur={() => form.handleBlur("startDate")}
              aria-describedby="d3-startDate-help d3-startDate-error"
              aria-invalid={form.errors.startDate ? true : undefined}
              className="d3-input d3-figure max-w-[11rem]"
            />
            <div className="flex flex-wrap gap-2">
              {START_DATE_PRESETS.map((p) => {
                const active = form.values.startDate === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => form.setValue("startDate", p.value)}
                    aria-pressed={active}
                    className="d3-tag border px-2.5 py-1.5 text-[0.5625rem] transition-colors"
                    style={{
                      borderColor: active ? "var(--accent)" : "var(--edge)",
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

          <Err id="d3-startDate-error" message={form.errors.startDate} />
        </div>

        {/* --- 03 · identification --------------------------------------- */}
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
                    <p
                      id={`d3-${f.name}-help`}
                      className="d3-body mt-2 text-[0.75rem] text-[var(--ink-3)]"
                    >
                      {f.help}
                    </p>
                  )}
                  <Err id={`d3-${f.name}-error`} message={err} />
                </div>
              );
            })}
          </div>
        </div>

        {/* --- readout + submit ------------------------------------------ */}
        <div className="border-t border-[var(--rule-strong)] pt-6">
          {/* What is actually being held, assembled from the two answers. */}
          <dl className="mb-6 grid gap-px bg-[var(--rule)] sm:grid-cols-3">
            {[
              { k: "Capacity", v: chosen?.label ?? "Not set", set: Boolean(chosen) },
              {
                k: "From",
                v: form.values.startDate ? formatChosen(form.values.startDate) : "Not set",
                set: Boolean(form.values.startDate),
              },
              { k: "At", v: RATE.fullShort, set: true },
            ].map((cell) => (
              <div key={cell.k} className="bg-[var(--bg)] px-4 py-3">
                <dt className="d3-tag text-[0.4375rem] text-[var(--ink-3)]">{cell.k}</dt>
                <dd
                  className="d3-figure mt-1.5 text-[0.9375rem]"
                  style={{ color: cell.set ? "var(--accent)" : "var(--ink-3)" }}
                >
                  {cell.v}
                </dd>
              </div>
            ))}
          </dl>

          {form.status === "error" && form.formError && (
            <div
              role="alert"
              className="mb-5 border border-[var(--alarm)] bg-[color-mix(in_oklab,var(--alarm)_10%,transparent)] px-4 py-3"
            >
              <p className="d3-pip text-[var(--alarm)]">{FORM_COPY.error.heading}</p>
              <p className="d3-body mt-1.5 text-[0.8125rem] text-[var(--ink-2)]">
                {form.formError} {FORM_COPY.error.body}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="submit" className="d3-btn" disabled={form.status === "submitting"}>
              {form.status === "submitting" ? FORM_COPY.submitting : FORM_COPY.submit}
              {form.status !== "submitting" && <span aria-hidden>→</span>}
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

function Energised({ ref, onReset }: { ref: React.Ref<HTMLDivElement>; onReset: () => void }) {
  return (
    <div ref={ref} tabIndex={-1} role="status" className="d3-panel d3-ticks">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--rule-strong)] px-5 py-3 md:px-7">
        <p className="d3-pip text-[var(--accent)]">Received</p>
        <p className="d3-tag text-[0.5rem] text-[var(--ink-3)]">{SITE.name}</p>
      </div>

      <div className="px-5 py-10 md:px-7 md:py-14">
        <h3 className="d3-display text-[clamp(1.875rem,5vw,3.5rem)]" style={{ ["--wdth" as string]: 118 }}>
          {FORM_COPY.success.heading}
        </h3>
        <p className="d3-body mt-5 max-w-[52ch] text-[1rem] text-[var(--ink-2)] text-pretty">
          {FORM_COPY.success.body}
        </p>
        <p className="d3-body mt-3 max-w-[52ch] text-[0.875rem] text-[var(--ink-3)] text-pretty">
          {FORM_COPY.success.detail}
        </p>

        <ol className="mt-9 grid gap-px bg-[var(--rule)] md:grid-cols-3">
          {FORM_COPY.whatHappensNext.map((step, i) => (
            <li key={step} className="bg-[var(--surface)] p-5">
              <p className="d3-figure text-[0.6875rem] text-[var(--accent)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="d3-body mt-2 text-[0.8125rem] text-[var(--ink-2)] text-pretty">{step}</p>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onReset} className="d3-btn d3-btn-ghost mt-9">
          {FORM_COPY.success.again}
        </button>
      </div>
    </div>
  );
}
