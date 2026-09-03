/**
 * ANALYTICS — no-op by default.
 *
 * Ships before any ad spend so the plumbing exists when spend starts.
 * Provider is chosen by NEXT_PUBLIC_ANALYTICS_PROVIDER:
 *
 *   unset | "none"  → no-op (default; nothing loads, nothing is sent)
 *   "console"       → logs events, for verifying the call sites
 *   "plausible"     → window.plausible(name, { props })
 *   "vercel"        → window.va("event", { name, ...props })
 *
 * Adding a provider means adding a case here. Call sites never change.
 */

export type AnalyticsProvider = "none" | "console" | "plausible" | "vercel";

export type AnalyticsEvent =
  | { name: "reservation_submit"; props: ReservationSubmitProps }
  | { name: "reservation_start"; props: { direction: string } }
  | { name: "reservation_error"; props: { direction: string; reason: string } }
  | { name: "pricing_source_click"; props: { direction: string; sourceId: string } }
  | { name: "cta_click"; props: { direction: string; location: string } };

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
  if (raw === "console" || raw === "plausible" || raw === "vercel") return raw;
  return "none";
}

function send(event: AnalyticsEvent): void {
  const provider = getProvider();
  if (provider === "none" || typeof window === "undefined") return;

  switch (provider) {
    case "console":
      console.info("[analytics]", event.name, event.props);
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

/** "2026-11-01" → "2026-11". Keeps day-level detail out of analytics. */
export function toMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}
