"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/lib/market/types";
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

export function FloorMount({ snap, hover, onHover, onPin }: { snap: Snapshot; hover: string | null; onHover: (id: string | null) => void; onPin: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [inView, setInView] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cores = navigator.hardwareConcurrency ?? 8;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = Boolean(c.getContext("webgl2"));
    } catch { gl = false; }
    // `?scene=force` skips the device heuristics (never reduced motion or missing WebGL). For review on weak machines.
    const force = new URLSearchParams(window.location.search).get("scene") === "force";
    setAllowed(!reduce && gl && (force || (cores >= 4 && !saveData)));
  }, []);

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
