/**
 * ANALYTICS — no-op by default.
 *
 * Ships before any ad spend so the plumbing exists when spend starts.
 * Provider is chosen by NEXT_PUBLIC_ANALYTICS_PROVIDER:
 *
 *   unset | "none"  → no-op (default; nothing loads, nothing is sent)
 *   "console"       → logs events, for verifying the call sites
 *   "firstparty"    → batched to /api/event and stored in our own database.
 *                     No third party, no cookie, session-scoped. This is the
 *                     one that lets us join "what did they read" to "did they
 *                     reserve" — see DATA.md.
 *   "plausible"     → window.plausible(name, { props })
 *   "vercel"        → window.va("event", { name, ...props })
 *
 * Adding a provider means adding a case here. Call sites never change.
 */

import { journey } from "./journey";

export type AnalyticsProvider = "none" | "console" | "firstparty" | "plausible" | "vercel";

export type AnalyticsEvent =
  | { name: "page_view"; props: { path: string } }
  | { name: "section_view"; props: { id: string } }
  | { name: "reservation_submit"; props: ReservationSubmitProps }
  | { name: "reservation_start"; props: { direction: string } }
  | { name: "reservation_error"; props: { direction: string; reason: string } }
  | { name: "followup_submit"; props: { fields: number } }
  | { name: "pricing_source_click"; props: { direction: string; sourceId: string } }
  | { name: "cta_click"; props: { direction: string; location: string } }
  | { name: "estimator_change"; props: { gpus: number; hours: number } }
  | { name: "faq_open"; props: { id: string } }
  | { name: "outbound_click"; props: { href: string } }
  | { name: "page_leave"; props: { path: string; ms: number } };

export interface ReservationSubmitProps {
  direction: string;
  /** Bucketed, not raw — these are the two fields that tier the lead. */
  gpuCount: string;
  workload: string;
  /** Month granularity only. We do not need the day in analytics. */
  startMonth: string;
  mode: "posted" | "stubbed";
}

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
    va?: (event: string, props?: Record<string, unknown>) => void;
  }
}

export function getProvider(): AnalyticsProvider {
  const raw = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER;
  if (raw === "console" || raw === "firstparty" || raw === "plausible" || raw === "vercel") return raw;
  return "none";
}

// --- first-party batching ----------------------------------------------------

interface Queued {
  name: string;
  props: Record<string, unknown>;
  path: string;
  referrer: string | null;
  ts: number;
}

let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let flushBound = false;

function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!queue.length) return;
  const j = journey();
  if (!j) {
    queue = [];
    return;
  }
  const body = JSON.stringify({ sessionId: j.sessionId, events: queue.splice(0, 50) });
  try {
    if (navigator.sendBeacon?.("/api/event", body)) return;
  } catch {
    /* fall through */
  }
  void fetch("/api/event", { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => undefined);
}

function enqueue(event: AnalyticsEvent) {
  queue.push({
    name: event.name,
    props: event.props as Record<string, unknown>,
    path: window.location.pathname,
    referrer: document.referrer || null,
    ts: Date.now(),
  });
  if (!flushBound) {
    flushBound = true;
    addEventListener("pagehide", flush);
    addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }
  // Submits and errors go now; everything else batches for a couple of seconds.
  if (event.name.startsWith("reservation_") || event.name === "followup_submit" || queue.length >= 20) flush();
  else timer ??= setTimeout(flush, 2500);
}

function send(event: AnalyticsEvent): void {
  const provider = getProvider();
  if (provider === "none" || typeof window === "undefined") return;

  switch (provider) {
    case "console":
      console.info("[analytics]", event.name, event.props);
      return;
    case "firstparty":
      enqueue(event);
      return;
    case "plausible":
      window.plausible?.(event.name, { props: event.props as Record<string, unknown> });
      return;
    case "vercel":
      window.va?.("event", { name: event.name, ...event.props });
      return;
  }
}

export function track(event: AnalyticsEvent): void {
  try {
    send(event);
  } catch {
    // Analytics must never break the form. Swallow and move on.
  }
}

/** Fired on successful submit. The event that matters. */
export function trackReservationSubmit(props: ReservationSubmitProps): void {
  track({ name: "reservation_submit", props });
}

export function trackReservationStart(direction: string): void {
  track({ name: "reservation_start", props: { direction } });
}

export function trackReservationError(direction: string, reason: string): void {
  track({ name: "reservation_error", props: { direction, reason } });
}

export function trackSourceClick(direction: string, sourceId: string): void {
  track({ name: "pricing_source_click", props: { direction, sourceId } });
}

export function trackCta(direction: string, location: string): void {
  track({ name: "cta_click", props: { direction, location } });
}

export function trackPageView(path: string): void {
  track({ name: "page_view", props: { path } });
}

export function trackSectionView(id: string): void {
  track({ name: "section_view", props: { id } });
}

export function trackEstimator(gpus: number, hours: number): void {
  track({ name: "estimator_change", props: { gpus, hours } });
}

export function trackFaqOpen(id: string): void {
  track({ name: "faq_open", props: { id } });
}

export function trackFollowup(fields: number): void {
  track({ name: "followup_submit", props: { fields } });
}

/** "2026-11-01" → "2026-11". Keeps day-level detail out of analytics. */
export function toMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}
