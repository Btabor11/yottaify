"use client";

/**
 * The gate in front of the sounding field's WebGL scene.
 *
 * The desk's own, rather than the site's SceneMount, because the site's gate
 * measures scroll progress against a pinned host and drives itself from the
 * page's scroll runtime — neither of which exists here, and neither of which
 * this scene wants.
 *
 * The rules are the same, and they are the important part:
 *
 *  · `children` — the server-rendered SVG — is the default render. It is the
 *    finished picture, not a placeholder, so nothing is lost by never getting
 *    past this component.
 *  · `prefers-reduced-motion` is a hard stop. So is no WebGL, and so is a
 *    machine that has told us it would rather not (few cores, Data Saver).
 *  · three.js is loaded only once the chart is in view and the main thread
 *    has gone idle, and only then is the module fetched at all.
 *  · The cross-fade waits for the scene's first real frame, and falls back to
 *    keeping the still if that frame never arrives.
 */

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useInView, useReducedMotion, useWebGLSupported } from "@/lib/motion";
import type { Field } from "@/app/admin/derive";
import { subscribe } from "./hold";
import type { SoundingSceneProps } from "./SoundingScene";

/** Long enough that we only mount on a thread that has genuinely settled. */
const IDLE_TIMEOUT = 2600;

function deviceCanAfford(): boolean {
  if (typeof navigator === "undefined") return false;
  if ((navigator.hardwareConcurrency ?? 8) < 4) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData;
}

function onIdle(fn: () => void, timeout: number): () => void {
  type IdleWindow = Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 360);
  return () => window.clearTimeout(id);
}

export function ChartMount({
  field,
  oldest,
  children,
}: {
  field: Field;
  /** Age of the oldest sounding, for the scene's own copy of the time axis. */
  oldest: number;
  children: React.ReactNode;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "200px" });
  const reduced = useReducedMotion();
  const webgl = useWebGLSupported();
  const [Scene, setScene] = useState<ComponentType<SoundingSceneProps> | null>(null);
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);
  const mounted = Scene !== null;

  // Nothing to enhance: an empty board has no soundings to stand up.
  const worth = field.points.length > 0;
  const enabled = webgl === true && !reduced && worth;

  useEffect(() => {
    if (!enabled || !inView || mounted) return;
    if (!deviceCanAfford()) return;
    let cancelled = false;
    const cancel = onIdle(async () => {
      const m = await import("./SoundingScene");
      if (!cancelled) setScene(() => m.default);
    }, IDLE_TIMEOUT);
    return () => {
      cancelled = true;
      cancel();
    };
  }, [enabled, inView, mounted]);

  /* The still's end of the hold channel. Only useful before the scene takes
     over — after that the still is at zero opacity and the scene lights its
     own bead — but before that it is the only mark there is, and on a machine
     that never gets a scene it is the only one there will ever be. */
  const still = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let last: Element | null = null;
    return subscribe((reference) => {
      last?.removeAttribute("data-held");
      last = reference ? (still.current?.querySelector(`[data-sounding="${CSS.escape(reference)}"]`) ?? null) : null;
      last?.setAttribute("data-held", "true");
    });
  }, []);

  // A scene that never reports a frame leaves the still in place rather than
  // fading it out into an empty canvas.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!mounted || ready) return;
    timer.current = window.setTimeout(() => setReady(true), 1400);
    return () => window.clearTimeout(timer.current);
  }, [mounted, ready]);

  return (
    <div ref={ref} className="relative h-full">
      <div
        ref={still}
        className="relative h-full transition-opacity duration-700"
        style={{ opacity: ready ? 0 : 1 }}
        aria-hidden={ready || undefined}
      >
        {children}
      </div>
      {Scene && (
        <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: ready ? 1 : 0 }} aria-hidden>
          <Scene field={field} oldest={oldest} active={inView} onReady={handleReady} />
        </div>
      )}
    </div>
  );
}
