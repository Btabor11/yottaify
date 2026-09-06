"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/lib/market/types";
import { useReducedMotion, useWebGLSupported } from "@/lib/motion";
import { FloorStill } from "./FloorStill";
import { MARKET } from "@/content/market";

/**
 * Gate for the market floor. Same rules as components/shared/SceneMount:
 *   · the SVG still is the default render — server-rendered, zero JS
 *   · the canvas mounts only in view AND once the main thread is idle
 *   · never under reduced motion, without WebGL2, on < 4 cores, or with Data Saver
 *   · frameloop stops the moment the section leaves the viewport
 *   · the cross-fade waits for the scene's first real frame
 *
 * It is a separate component (not SceneMount itself) because this scene needs
 * data and hover callbacks that the shared SceneProps contract does not carry.
 */
const FloorScene = lazy(() => import("./FloorScene"));

/**
 * Cores and Data Saver, read once. Same conservative bar as SceneMount: the
 * canvas replaces a finished drawing, so skipping it costs nearly nothing and
 * running it on a tired laptop costs a stuttering page.
 */
function deviceCanAfford(): boolean {
  if (typeof navigator === "undefined") return false;
  if ((navigator.hardwareConcurrency ?? 8) < 4) return false;
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  // `?scene=force` skips the device heuristics. Reduced motion and missing
  // WebGL are still hard stops — those are correctness, not performance.
  return true;
}

function forced(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("scene") === "force";
}

export function FloorMount({ snap, hover, onHover, onPin }: { snap: Snapshot; hover: string | null; onHover: (id: string | null) => void; onPin: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  /**
   * Both are `useSyncExternalStore` hooks, so the answer is right on the first
   * client render instead of one commit late — and, unlike a probe in an
   * effect, they do not set state during the effect pass.
   */
  const reduced = useReducedMotion();
  const webgl = useWebGLSupported();
  const allowed = webgl === true && !reduced && (forced() || deviceCanAfford());

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!allowed || !inView || mounted) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let id: number | ReturnType<typeof setTimeout>;
    if (w.requestIdleCallback) {
      id = w.requestIdleCallback(() => setMounted(true), { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id as number);
    }
    id = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(id as ReturnType<typeof setTimeout>);
  }, [allowed, inView, mounted]);

  return (
    <div ref={box} className="d3-panel d3-ticks relative aspect-[16/9] min-h-[22rem] w-full overflow-hidden md:aspect-[21/9]" data-reveal-rule>
      {/* the still is the resting state; it fades out only when the canvas has drawn */}
      <div className="absolute inset-0" style={{ opacity: ready ? 0 : 1, transition: "opacity 700ms var(--ease-out-expo)" }} aria-hidden={ready}>
        <FloorStill snap={snap} hover={hover} />
      </div>

      {mounted && (
        <div className="absolute inset-0" style={{ opacity: ready ? 1 : 0, transition: "opacity 700ms var(--ease-out-expo)" }}>
          <Suspense fallback={null}>
            <FloorScene snap={snap} hover={hover} onHover={onHover} onPin={onPin} active={inView} onReady={() => setReady(true)} />
          </Suspense>
        </div>
      )}

      <ul className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-x-4 gap-y-1 d3-tag text-[var(--ink-3)]">
        <li><span className="text-[var(--ink)]">▮</span> {MARKET.floor.legend.published}</li>
        <li><span className="text-[var(--ink-2)]">◯</span> {MARKET.floor.legend.reported}</li>
        <li><span className="text-[var(--ink-2)]">▒</span> {MARKET.floor.legend.band}</li>
        <li><span className="text-[var(--accent)]">—</span> {MARKET.floor.legend.rail}</li>
      </ul>
      <p className="pointer-events-none absolute bottom-3 right-4 d3-tag text-[var(--ink-3)]">{ready ? "webgl" : allowed ? "loading" : "still"}</p>
    </div>
  );
}
