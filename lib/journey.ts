/**
 * THE JOURNEY — what we can learn about a visit without asking.
 *
 * Session-scoped (sessionStorage, no cookie, gone when the tab closes), first
 * party, and never sent anywhere until the visitor submits the form or the
 * first-party analytics provider is on. Everything here is attached to the
 * reservation row so the person reading it knows which page the lead landed
 * on, what they read, whether they ran the estimator and with what numbers,
 * and how long they took over the form.
 *
 * Nothing in this file can throw into the page: every entry point is wrapped.
 */

const KEY = "b300.journey";

export interface Journey {
  sessionId: string;
  startedAt: number;
  landingPath: string;
  referrer: string | null;
  utm: Partial<Record<"source" | "medium" | "campaign" | "term" | "content", string>>;
  pagesViewed: string[];
  sectionsViewed: string[];
  sourceClicks: number;
  estimator: { gpus: number; hours: number } | null;
  formStartedAt: number | null;
  validationFailures: number;
}

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.sessionStorage);
  } catch {
    return false;
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function fresh(): Journey {
  const url = new URL(window.location.href);
  const utm: Journey["utm"] = {};
  for (const k of ["source", "medium", "campaign", "term", "content"] as const) {
    const v = url.searchParams.get(`utm_${k}`);
    if (v) utm[k] = v.slice(0, 120);
  }
  return {
    sessionId: uuid(),
    startedAt: Date.now(),
    landingPath: url.pathname,
    referrer: document.referrer || null,
    utm,
    pagesViewed: [url.pathname],
    sectionsViewed: [],
    sourceClicks: 0,
    estimator: null,
    formStartedAt: null,
    validationFailures: 0,
  };
}

let cache: Journey | null = null;

export function journey(): Journey | null {
  if (!hasStorage()) return null;
  if (cache) return cache;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Journey) : fresh();
    // A later visit in the same session can carry new UTM parameters (a
    // second ad click). Later wins, so attribution follows the last touch.
    const url = new URL(window.location.href);
    for (const k of ["source", "medium", "campaign", "term", "content"] as const) {
      const v = url.searchParams.get(`utm_${k}`);
      if (v) cache.utm[k] = v.slice(0, 120);
    }
    persist();
    return cache;
  } catch {
    return null;
  }
}

function persist() {
  if (!cache || !hasStorage()) return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked. The in-memory copy still works for this page.
  }
}

function update(fn: (j: Journey) => void) {
  const j = journey();
  if (!j) return;
  try {
    fn(j);
    persist();
  } catch {
    /* never into the page */
  }
}

const sectionListeners = new Set<(id: string) => void>();

/** Be told the first time each section comes on screen. Returns an unsubscribe. */
export function onSectionSeen(fn: (id: string) => void): () => void {
  sectionListeners.add(fn);
  return () => sectionListeners.delete(fn);
}

export const track = {
  page(path: string) {
    update((j) => {
      if (j.pagesViewed[j.pagesViewed.length - 1] !== path) j.pagesViewed = [...j.pagesViewed, path].slice(-40);
    });
  },
  section(id: string) {
    let first = false;
    update((j) => {
      if (!j.sectionsViewed.includes(id)) {
        j.sectionsViewed = [...j.sectionsViewed, id].slice(-40);
        first = true;
      }
    });
    if (first) for (const fn of sectionListeners) fn(id);
  },
  sourceClick() {
    update((j) => {
      j.sourceClicks += 1;
    });
  },
  estimator(gpus: number, hours: number) {
    update((j) => {
      j.estimator = { gpus, hours };
    });
  },
  formStarted() {
    update((j) => {
      j.formStartedAt ??= Date.now();
    });
  },
  validationFailed() {
    update((j) => {
      j.validationFailures += 1;
    });
  },
};

/** One-shot: begin observing sections on this page. Safe to call more than once. */
let observing = false;
export function observeSections(): void {
  if (observing || typeof window === "undefined" || !("IntersectionObserver" in window)) return;
  observing = true;
  try {
    const els = document.querySelectorAll<HTMLElement>("main section[id], main [data-chapter][id]");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).id;
          if (id) track.section(id);
          io.unobserve(e.target);
        }
      },
      { threshold: 0.35 },
    );
    els.forEach((el) => io.observe(el));
  } catch {
    observing = false;
  }
}

/**
 * The context object sent with a reservation. Shape mirrors
 * lib/server/context.ts — every field is optional there, so a browser that
 * blocks any of this still submits fine.
 */
export function submissionContext(submissionId: string): Record<string, unknown> {
  const j = journey();
  const now = Date.now();
  const ctx: Record<string, unknown> = { submissionId };
  try {
    ctx.path = window.location.pathname;
    ctx.locale = navigator.language;
    ctx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    ctx.viewportW = window.innerWidth;
    ctx.viewportH = window.innerHeight;
    ctx.screenW = window.screen?.width;
    ctx.screenH = window.screen?.height;
    ctx.dpr = String(window.devicePixelRatio ?? 1);
    ctx.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? null;
    ctx.colorScheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    // The honeypot is uncontrolled, so the form hook never sees it. Read it
    // off the DOM here so a JS-running bot that fills every field is caught
    // on this path too, not only on the native POST.
    const trap = document.querySelector<HTMLInputElement>('form input[name="website"]');
    if (trap?.value) ctx.website = trap.value;
  } catch {
    /* partial context is fine */
  }
  if (j) {
    ctx.sessionId = j.sessionId;
    ctx.referrer = j.referrer;
    ctx.landingPath = j.landingPath;
    ctx.utmSource = j.utm.source;
    ctx.utmMedium = j.utm.medium;
    ctx.utmCampaign = j.utm.campaign;
    ctx.utmTerm = j.utm.term;
    ctx.utmContent = j.utm.content;
    ctx.timeOnPageMs = now - j.startedAt;
    ctx.formFillMs = j.formStartedAt ? now - j.formStartedAt : null;
    ctx.validationFailures = j.validationFailures;
    ctx.estimatorGpus = j.estimator?.gpus ?? null;
    ctx.estimatorHours = j.estimator?.hours ?? null;
    ctx.sectionsViewed = j.sectionsViewed;
    ctx.pagesViewed = j.pagesViewed;
    ctx.sourceClicks = j.sourceClicks;
  }
  return ctx;
}

export function newSubmissionId(): string {
  return uuid();
}
