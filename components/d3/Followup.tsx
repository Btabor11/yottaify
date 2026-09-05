"use client";

/**
 * THE FOLLOW-UP — the optional questions, shown once the reservation is in.
 *
 * The reservation form is kept short so it converts. This is where the rich
 * data comes from, asked at the one moment a visitor is most willing to give
 * it: they have just committed, they have a reference code in hand, and every
 * question is framed as making their own call shorter.
 *
 * Works three ways:
 *   - enhanced: fetch to /api/reservation/followup, states inline
 *   - native POST (JavaScript off): same endpoint, redirect back with a flag
 *   - external endpoint (no reference returned): renders nothing at all
 *
 * Authentication is reference + email. When the email is known (JS path) it
 * rides as a hidden field; when it is not (no-JS result page) it is asked.
 */

import { useId, useState } from "react";
import { FOLLOWUP_COPY, FOLLOWUP_FIELDS, type FollowupField } from "@/content";
import { trackFollowup } from "@/lib/analytics";

type Status = "idle" | "submitting" | "saved" | "error";

export function Followup({
  reference,
  email,
  initialStatus = "idle",
  returnTo = "/",
}: {
  reference: string | null;
  /** Known on the JS path; null on the no-JS result page, where it is asked. */
  email: string | null;
  initialStatus?: Status;
  returnTo?: string;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [answered, setAnswered] = useState(0);
  const uid = useId();

  if (!reference) return null;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = { reference };
    let count = 0;
    for (const f of FOLLOWUP_FIELDS) {
      if (f.type === "multiselect") {
        const vals = fd.getAll(f.name).map(String).filter(Boolean);
        if (vals.length) {
          body[f.name] = vals;
          count++;
        }
      } else {
        const v = String(fd.get(f.name) ?? "").trim();
        if (v) {
          body[f.name] = v;
          count++;
        }
      }
    }
    body.email = email ?? String(fd.get("email") ?? "");
    setStatus("submitting");
    try {
      const res = await fetch("/api/reservation/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(String(res.status));
      setAnswered(count);
      trackFollowup(count);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  if (status === "saved") {
    return (
      <div role="status" className="mt-9 border-t border-[var(--rule-strong)] pt-7">
        <p className="d3-pip text-[var(--accent)]">{FOLLOWUP_COPY.saved.heading}</p>
        <p className="d3-body mt-2 max-w-[52ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">
          {FOLLOWUP_COPY.saved.body}
          {answered > 0 && (
            <>
              {" "}
              <span className="d3-figure text-[var(--ink-3)]">
                {answered} {answered === 1 ? "answer" : "answers"} saved.
              </span>
            </>
          )}
        </p>
      </div>
    );
  }

  const busy = status === "submitting";

  return (
    <form
      method="post"
      action="/api/reservation/followup"
      onSubmit={onSubmit}
      noValidate
      aria-labelledby={`${uid}-heading`}
      className="mt-9 border-t border-[var(--rule-strong)] pt-7"
    >
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {email && <input type="hidden" name="email" value={email} />}

      <p className="d3-tag text-[var(--ink-3)]">{FOLLOWUP_COPY.eyebrow}</p>
      <h4 id={`${uid}-heading`} className="d3-display mt-3 text-[clamp(1.375rem,3vw,2rem)]">
        {FOLLOWUP_COPY.heading}
      </h4>
      <p className="d3-body mt-3 max-w-[56ch] text-[0.875rem] text-[var(--ink-2)] text-pretty">{FOLLOWUP_COPY.body}</p>

      {status === "error" && (
        <div
          role="alert"
          className="mt-5 border border-[var(--alarm)] bg-[color-mix(in_oklab,var(--alarm)_10%,transparent)] px-4 py-3"
        >
          <p className="d3-pip text-[var(--alarm)]">{FOLLOWUP_COPY.error.heading}</p>
          <p className="d3-body mt-1.5 text-[0.8125rem] text-[var(--ink-2)]">{FOLLOWUP_COPY.error.body}</p>
        </div>
      )}

      <fieldset disabled={busy} className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <legend className="sr-only">{FOLLOWUP_COPY.heading}</legend>

        {!email && (
          <div>
            <label htmlFor={`${uid}-email`} className="d3-tag text-[0.5625rem] text-[var(--ink-2)]">
              The email you reserved with
            </label>
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              autoComplete="email"
              required
              className="d3-input mt-2"
            />
          </div>
        )}

        {FOLLOWUP_FIELDS.map((f) => (
          <Field key={f.name} f={f} uid={uid} />
        ))}
      </fieldset>

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button type="submit" className="d3-btn d3-btn-ghost" disabled={busy}>
          {busy ? FOLLOWUP_COPY.submitting : FOLLOWUP_COPY.submit}
        </button>
        <p className="d3-body text-[0.75rem] text-[var(--ink-3)]">
          {FOLLOWUP_COPY.referenceLabel}{" "}
          <span className="d3-figure text-[var(--ink-2)]">{reference}</span>
        </p>
      </div>
    </form>
  );
}

function Field({ f, uid }: { f: FollowupField; uid: string }) {
  const id = `${uid}-${f.name}`;
  const wide = f.type === "textarea" || f.type === "multiselect";
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      {f.type === "multiselect" ? (
        <fieldset>
          <legend className="d3-tag text-[0.5625rem] text-[var(--ink-2)]">{f.label}</legend>
          {f.help && <p className="d3-body mt-1.5 text-[0.75rem] text-[var(--ink-3)]">{f.help}</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {f.options?.map((o) => (
              <label key={o.value} className="d3-ticket">
                <input type="checkbox" name={f.name} value={o.value} />
                <span className="d3-body block text-[0.8125rem] leading-snug text-[var(--ink)]">{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <>
          <label htmlFor={id} className="d3-tag text-[0.5625rem] text-[var(--ink-2)]">
            {f.label}
          </label>
          {f.type === "select" ? (
            <select id={id} name={f.name} defaultValue="" className="d3-input d3-select mt-2">
              <option value="">—</option>
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              id={id}
              name={f.name}
              rows={3}
              maxLength={f.maxLength}
              placeholder={f.placeholder}
              className="d3-input d3-textarea mt-2"
            />
          ) : (
            <input
              id={id}
              name={f.name}
              type={f.type}
              maxLength={f.maxLength}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              className="d3-input mt-2"
            />
          )}
          {f.help && <p className="d3-body mt-2 text-[0.75rem] text-[var(--ink-3)]">{f.help}</p>}
        </>
      )}
    </div>
  );
}
