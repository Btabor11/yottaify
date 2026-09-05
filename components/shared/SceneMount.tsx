"use client";

/**
 * Shared gate for every WebGL scene in every direction.
 *
 * Rules:
 *  · `children` (an SVG drawing) is the DEFAULT render — server-rendered,
 *    zero JS, and what everyone without WebGL or with reduced motion sees.
 *  · The canvas mounts only once the container has been in view AND the main
 *    thread has gone idle. three.js is ~600 KB to parse and compile; doing
 *    that during the load window costs more than the scene is worth, and the
 *    drawing underneath is already the finished picture.
 *  · Machines that will not enjoy it never pay for it: fewer than four cores,
 *    or Data Saver on, and the SVG simply stays.
 *  · frameloop flips to "never" the moment it leaves the viewport, so nothing
 *    burns GPU off-screen.
 *  · The cross-fade waits for the scene's first real frame, so it never
 *    reveals a blank canvas mid-transition.
 *  · Section-relative scroll progress is written to a ref, so the scene reads
 *    it inside its own frame loop and React never re-renders on scroll.
 *  · Nothing here can stop the section's content from being complete.
 */

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useInView, useReducedMotion, useWebGLSupported } from "@/lib/motion";
import { subscribeScroll } from "@/lib/scroll-runtime";

/**
 * Idle budget for a scene built on three.js.
 *
 * Long enough that we effectively only mount these on a main thread that has
 * genuinely settled. If a machine stays busy for eight seconds it has already
 * told us it would rather not render a decorative 3D scene, and the SVG it
 * would have replaced is the same picture.
 */
export const HEAVY_SCENE_IDLE = 8000;

export interface SceneProps {
  progressRef: React.RefObject<number>;
  active: boolean;
  /** Called on the scene's first rendered frame. Drives the cross-fade. */
  onReady?: () => void;
}

/**
 * Whether this machine should be asked to run a WebGL scene at all.
 *
 * Deliberately conservative. The 3D is an enhancement over a complete drawing,
 * so the cost of skipping it is nearly zero and the cost of running it on a
 * four-year-old laptop is a page that stutters — which, on a site arguing that
 * we are competent operators, is the worst thing it could do.
 */
function deviceCanAfford(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency ?? 8;
  if (cores < 4) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return true;
}

/**
 * Hand the main thread back to the browser before doing the next expensive
 * thing.
 *
 * Evaluating a scene module and then building its scene are two heavy pieces
 * of work, and awaiting a promise does not separate them — a microtask
 * continuation runs in the same task, so they fuse into one long block. A
 * macrotask boundary is the cheapest thing that genuinely splits them, which
 * lets the browser paint and answer input in between.
 */
function yieldToBrowser(): Promise<void> {
  type Scheduler = { yield?: () => Promise<void> };
  const s = (globalThis as { scheduler?: Scheduler }).scheduler;
  if (typeof s?.yield === "function") return s.yield();
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

/** requestIdleCallback where it exists, a timeout where it does not. */
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
  const id = window.setTimeout(fn, 320);
  return () => window.clearTimeout(id);
}

export function SceneMount({
  children,
  load,
  fadeMs = 700,
  rootMargin = "300px",
  idleTimeout = 2000,
  progressMode = "reveal",
  className,
}: {
  children: React.ReactNode;
  /**
   * How progress is measured.
   *  · "reveal": this element's own travel through the viewport, 0 as its top
   *    enters at the bottom, 1 as its bottom leaves at the top.
   *  · "pin": the element is sticky inside its parent; progress is how far
   *    the parent has scrolled past its pinned top, 0..1 over the parent's
   *    height less one viewport. This is what a scroll-driven story wants.
   */
  progressMode?: "reveal" | "pin";
  className?: string;
  /**
   * A bare `() => import("./Scene")`, called only once we have decided to
   * mount. Deliberately not `next/dynamic`: that emits a preload hint into the
   * document, so the chunk lands during the load window and the deferral buys
   * nothing. Passing the thunk keeps the fetch where the decision is.
   */
  load: () => Promise<{ default: ComponentType<SceneProps> }>;
  fadeMs?: number;
  rootMargin?: string;
  /**
   * How long to wait for a genuinely idle main thread before giving up on
   * patience and loading anyway. Scenes that cost little can force the issue;
   * a scene that costs half a megabyte to compile should keep waiting, since
   * the drawing it would replace is already finished.
   */
  idleTimeout?: number;
}) {
  const [wrapRef, inView] = useInView<HTMLDivElement>({ rootMargin });
  const reduced = useReducedMotion();
  const webgl = useWebGLSupported();
  const progressRef = useRef(0);
  const [Scene, setScene] = useState<ComponentType<SceneProps> | null>(null);
  const [ready, setReady] = useState(false);
  const mounted = Scene !== null;

  /**
   * Stable across renders, and it has to be.
   *
   * A scene keeps its GPU resources in an effect keyed on its props. Passing a
   * fresh closure here re-ran that effect on every render of this component —
   * including the render caused by the scene reporting itself ready — which
   * tore down the WebGL context immediately after the first frame and left a
   * dead canvas showing whatever was in the buffer.
   */
  const handleReady = useCallback(() => setReady(true), []);

  const enabled = webgl === true && !reduced;

  useEffect(() => {
    if (!enabled || !inView || mounted) return;
    if (!deviceCanAfford()) return;
    let cancelled = false;
    const cancelIdle = onIdle(async () => {
      const m = await load();
      if (cancelled) return;
      // The module has just been parsed and compiled. Let the browser breathe
      // before asking React to build the scene and compile its shaders,
      // otherwise the two land in one task long enough to be felt as a stall.
      await yieldToBrowser();
      if (!cancelled) setScene(() => m.default);
    }, idleTimeout);
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [enabled, inView, mounted, load, idleTimeout]);

  // Belt and braces on the cross-fade: if a scene never reports a first frame
  // — a lost context, a driver refusing the shader — the SVG stays rather than
  // fading out into nothing.
  useEffect(() => {
    if (!mounted || ready) return;
    const id = window.setTimeout(() => setReady(true), 1200);
    return () => window.clearTimeout(id);
  }, [mounted, ready]);

  // Progress is measured in the shared read phase, alongside every other
  // measurement the frame needs, so it costs no layout of its own. It lands
  // in a ref: the scene reads it inside its own loop and React never renders
  // on scroll.
  useEffect(() => {
    if (!mounted) return;
    return subscribeScroll({
      read: (frame) => {
        const el = wrapRef.current;
        if (!el) return;
        if (progressMode === "pin") {
          const host = el.closest<HTMLElement>("[data-pin-host]") ?? el.parentElement ?? el;
          const rect = host.getBoundingClientRect();
          const span = Math.max(1, rect.height - frame.vh);
          progressRef.current = Math.min(1, Math.max(0, -rect.top / span));
          return;
        }
        const rect = el.getBoundingClientRect();
        const span = rect.height + frame.vh;
        progressRef.current = Math.min(1, Math.max(0, (frame.vh - rect.top) / span));
      },
    });
  }, [mounted, wrapRef, progressMode]);

  return (
    <div ref={wrapRef} className={className ? `relative ${className}` : "relative"}>
      <div
        className="h-full transition-opacity"
        style={{ opacity: ready ? 0 : 1, transitionDuration: `${fadeMs}ms` }}
        aria-hidden={ready || undefined}
      >
        {children}
      </div>

      {Scene && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{ opacity: ready ? 1 : 0, transitionDuration: `${fadeMs}ms` }}
          aria-hidden
        >
          <Scene progressRef={progressRef} active={inView} onReady={handleReady} />
        </div>
      )}
    </div>
  );
}
