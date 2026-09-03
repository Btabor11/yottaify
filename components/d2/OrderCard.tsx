"use client";

/**
 * D2 RESERVATION FORM — the order card bound into the back of the prospectus.
 *
 * Ruled lines instead of boxes, tick-boxes instead of a segmented control, a
 * dotted-leader summary line, and a "received" state set as a printed
 * acknowledgement. Same hook, same validation, same submit path as every other
 * direction: this file is markup and style only.
 *
 * Progressive enhancement: real method/action, so a native POST reaches
 * /api/reservation if the client bundle never arrives.
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
  NODE,
} from "@/content";
import { useReservationForm } from "@/lib/useReservationForm";
import type { ReservationFormState } from "@/lib/validation";
import { Cite } from "./Cite";

const STANDARD_ORDER = ["company", "name", "email", "workload", "notes"] as const;

export function OrderCard() {
  const form = useReservationForm("d2");
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
    return <Acknowledgement ref={successRef} onReset={form.reset} />;
  }

  const errorCount = Object.values(form.errors).filter(Boolean).length;
  const chosenGpus = GPU_COUNT_OPTIONS.find((o) => o.value === form.values.gpuCount);

  return (
    <form
      method="post"
      action="/api/reservation"
      onSubmit={form.handleSubmit}
      noValidate
      aria-labelledby="reserve-heading"
      className="border border-[var(--ink)] bg-[var(--surface)]"
    >
      <input type="hidden" name="returnTo" value="/d2" />

      {/* --- card head ---------------------------------------------------- */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ink)] px-5 py-3 md:px-8">
        <p className="d2-caps text-[var(--ink)]">Order card — capacity reservation</p>
        <p className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
          {SITE.name} · No. 01 · Not yet submitted
        </p>
      </div>

      {/* --- the slot, taking shape --------------------------------------
          A dotted-leader line, filled in as the two tiering answers arrive.
          It is what makes this read as holding a slot rather than joining a
          list: the thing being reserved is specific before you submit.
      ------------------------------------------------------------------- */}
      <dl className="border-b border-[var(--rule-strong)] bg-[var(--bg)] px-5 py-4 md:px-8">
        {[
          { label: "Capacity requested", value: chosenGpus?.label ?? "—", set: Boolean(chosenGpus) },
          {
            label: "Target start",
            value: form.values.startDate ? formatChosen(form.values.startDate) : "—",
            set: Boolean(form.values.startDate),
          },
          { label: "On-demand rate", value: RATE.full, set: true },
          { label: "Terms", value: `${CONTRACT.model}, ${CONTRACT.termYears}`, set: true },
        ].map((line) => (
          <div key={line.label} className="d2-leader py-1">
            <dt className="d2-caps shrink-0 text-[0.5625rem] text-[var(--ink-3)]">{line.label}</dt>
            <dd
              className="d2-figure shrink-0 text-[0.8125rem]"
              style={{ color: line.set ? "var(--accent)" : "var(--ink-3)" }}
            >
              {line.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-9 px-5 py-7 md:px-8 md:py-9">
        {/* --- error summary --------------------------------------------- */}
        <div
          ref={summaryRef}
          tabIndex={-1}
          role={errorCount > 0 ? "alert" : undefined}
          aria-live="polite"
          className={
            errorCount > 0
              ? "border-l-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-4 py-3"
              : "sr-only"
          }
        >
          {errorCount > 0 && (
            <>
              <p className="d2-caps text-[var(--accent)]">
                {errorCount} {errorCount === 1 ? "entry needs" : "entries need"} attention
              </p>
              <ul className="mt-2 space-y-1">
                {FIELDS.filter((f) => form.errors[f.name as keyof ReservationFormState]).map((f) => (
                  <li key={f.name}>
                    <a href={`#d2-${f.name}`} className="d2-prose d2-link text-[0.875rem]">
                      {f.label} — {form.errors[f.name as keyof ReservationFormState]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* --- I. GPU count ---------------------------------------------- */}
        <fieldset aria-describedby="d2-gpuCount-help d2-gpuCount-error">
          <legend className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--ink)] pb-2">
            <span className="d2-caps text-[var(--ink)]">
              <span className="d2-figure mr-2 text-[var(--accent)]">I.</span>
              {field("gpuCount").label}
            </span>
            <span className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
              {FORM_COPY.requiredNote}
            </span>
          </legend>

          <p id="d2-gpuCount-help" className="d2-prose mt-3 text-[0.8125rem] text-[var(--ink-3)]">
            {field("gpuCount").help}
            <Cite sourceId="facility" />
          </p>

          <div className="mt-3">
            {GPU_COUNT_OPTIONS.map((opt) => (
              <label key={opt.value} className="d2-choice">
                <input
                  type="radio"
                  name="gpuCount"
                  value={opt.value}
                  checked={form.values.gpuCount === opt.value}
                  onChange={form.handleChange}
                  required
                />
                <span aria-hidden className="d2-choice-box">
                  ✓
                </span>
                <span>
                  <span className="d2-prose block text-[1rem] leading-snug">{opt.label}</span>
                  {opt.hint && (
                    <span className="d2-prose block text-[0.8125rem] text-[var(--ink-3)]">
                      {opt.hint}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>

          <Err id="d2-gpuCount-error" message={form.errors.gpuCount} />
        </fieldset>

        {/* --- II. start date -------------------------------------------- */}
        <div>
          <div className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--ink)] pb-2">
            <label htmlFor="d2-startDate" className="d2-caps text-[var(--ink)]">
              <span className="d2-figure mr-2 text-[var(--accent)]">II.</span>
              {field("startDate").label}
            </label>
            <span className="d2-caps text-[0.5rem] text-[var(--ink-3)]">
              {FORM_COPY.requiredNote}
            </span>
          </div>

          <p id="d2-startDate-help" className="d2-prose mt-3 text-[0.8125rem] text-[var(--ink-3)]">
            {field("startDate").help}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-end">
            <input
              id="d2-startDate"
              name="startDate"
              type="date"
              required
              min={TARGET_START_FLOOR}
              value={form.values.startDate}
              onChange={form.handleChange}
              onBlur={() => form.handleBlur("startDate")}
              aria-describedby="d2-startDate-help d2-startDate-error"
              aria-invalid={form.errors.startDate ? true : undefined}
              className="d2-input d2-figure"
            />
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {START_DATE_PRESETS.map((p) => {
                const active = form.values.startDate === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => form.setValue("startDate", p.value)}
                    aria-pressed={active}
                    className="d2-caps border-b pb-1 transition-colors"
                    style={{
                      color: active ? "var(--accent)" : "var(--ink-2)",
                      borderColor: active ? "var(--accent)" : "var(--rule-strong)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Err id="d2-startDate-error" message={form.errors.startDate} />
        </div>

        {/* --- III. who you are ------------------------------------------ */}
        <div>
          <div className="flex w-full items-baseline justify-between gap-4 border-b border-[var(--ink)] pb-2">
            <span className="d2-caps text-[var(--ink)]">
              <span className="d2-figure mr-2 text-[var(--ink-3)]">III.</span>
              Who you are
            </span>
          </div>

          <div className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {STANDARD_ORDER.map((name) => {
              const f = field(name);
              const err = form.errors[name as keyof ReservationFormState];
              const wide = f.type === "textarea";
              return (
                <div key={f.name} className={wide ? "sm:col-span-2" : undefined}>
                  <div className="d2-leader">
                    <label htmlFor={`d2-${f.name}`} className="d2-caps shrink-0 text-[var(--ink-2)]">
                      {f.label}
                    </label>
                    <span className="d2-caps shrink-0 text-[0.5rem] text-[var(--ink-3)]">
                      {f.required ? FORM_COPY.requiredNote : FORM_COPY.optionalNote}
                    </span>
                  </div>

                  {f.type === "select" ? (
                    <select
                      id={`d2-${f.name}`}
                      name={f.name}
                      required={f.required}
                      value={form.values[f.name as keyof ReservationFormState]}
                      onChange={form.handleChange}
                      onBlur={() => form.handleBlur(f.name as keyof ReservationFormState)}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={`d2-${f.name}-error`}
                      className="d2-input d2-select mt-1"
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
                      id={`d2-${f.name}`}
                      name={f.name}
                      rows={4}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder}
                      value={form.values[f.name as keyof ReservationFormState]}
                      onChange={form.handleChange}
                      aria-invalid={err ? true : undefined}
                      aria-describedby={`d2-${f.name}-help d2-${f.name}-error`}
                      className="d2-input d2-textarea mt-2"
                    />
                  ) : (
                    <input
                      id={`d2-${f.name}`}
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
                      aria-describedby={`d2-${f.name}-help d2-${f.name}-error`}
                      className="d2-input mt-1"
                    />
                  )}

                  {f.help && (
                    <p id={`d2-${f.name}-help`} className="d2-prose mt-2 text-[0.8125rem] text-[var(--ink-3)]">
                      {f.help}
                    </p>
                  )}
                  <Err id={`d2-${f.name}-error`} message={err} />
                </div>
              );
            })}
          </div>
        </div>

        {/* --- submit ----------------------------------------------------- */}
        <div className="border-t border-[var(--ink)] pt-6">
          {form.status === "error" && form.formError && (
            <div
              role="alert"
              className="mb-5 border-l-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] px-4 py-3"
            >
              <p className="d2-caps text-[var(--accent)]">{FORM_COPY.error.heading}</p>
              <p className="d2-prose mt-1.5 text-[0.875rem] text-[var(--ink-2)]">
                {form.formError} {FORM_COPY.error.body}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="submit" className="d2-btn" disabled={form.status === "submitting"}>
              {form.status === "submitting" ? FORM_COPY.submitting : FORM_COPY.submit}
              {form.status !== "submitting" && <span aria-hidden>→</span>}
            </button>
            <p className="d2-prose max-w-[36ch] text-[0.8125rem] text-[var(--ink-2)] text-pretty">
              {FORM_COPY.microcopy.commitment}
            </p>
          </div>

          <p className="d2-prose mt-5 max-w-[62ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty">
            {FORM_COPY.microcopy.privacy}
          </p>

          <p aria-live="polite" className="d2-caps mt-5 text-[var(--ink-3)]">
            <span className="d2-figure text-[var(--accent)]">
              {form.completion.filled}/{form.completion.total}
            </span>
            <span className="ml-2 normal-case tracking-[0.05em]">
              entries complete · {FLEET.total} GPUs in the fleet · {NODE.hbmGbFormatted} GB per node
            </span>
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
      className="d2-prose mt-2 text-[0.8125rem] italic"
      style={{ color: "var(--accent)" }}
    >
      {message}
    </p>
  );
}

function Acknowledgement({ ref, onReset }: { ref: React.Ref<HTMLDivElement>; onReset: () => void }) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="border border-[var(--ink)] bg-[var(--surface)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[var(--ink)] px-5 py-3 md:px-8">
        <p className="d2-caps text-[var(--ink)]">Acknowledgement of receipt</p>
        <p className="d2-caps text-[0.5rem] text-[var(--ink-3)]">{SITE.name} · No. 01</p>
      </div>

      <div className="px-5 py-9 md:px-8 md:py-12">
        <p className="d2-display text-[clamp(1.875rem,5vw,3.25rem)]">
          {FORM_COPY.success.heading}
        </p>
        <p className="d2-prose d2-measure-wide mt-5 text-[1.0625rem] text-[var(--ink-2)] text-pretty">
          {FORM_COPY.success.body}
        </p>
        <p className="d2-prose d2-measure-wide mt-3 text-[0.9375rem] text-[var(--ink-3)] text-pretty">
          {FORM_COPY.success.detail}
        </p>

        <ol className="mt-9 border-t border-[var(--ink)]">
          {FORM_COPY.whatHappensNext.map((step, i) => (
            <li
              key={step}
              className="grid grid-cols-[2rem_1fr] gap-3 border-b border-[var(--rule)] py-3"
            >
              <span className="d2-figure text-[0.75rem] text-[var(--accent)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="d2-prose text-[0.9375rem] text-[var(--ink-2)]">{step}</span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onReset} className="d2-btn d2-btn-outline mt-8">
          {FORM_COPY.success.again}
        </button>
      </div>
    </div>
  );
}
