"use client";

/**
 * Shared gate for every WebGL scene in every direction.
 *
 * Rules, applied identically in d1/d2/d3:
 *  · `children` (an SVG drawing) is the DEFAULT render — server-rendered,
 *    zero JS, and what everyone without WebGL or with reduced motion sees.
 *  · The canvas mounts only once the container has been in view.
 *  · frameloop flips to "never" the moment it leaves the viewport, so nothing
 *    burns GPU off-screen.
 *  · Section-relative scroll progress is written to a ref, so the scene reads
 *    it inside its own frame loop and React never re-renders on scroll.
 *  · Nothing here can stop the section's content from being complete.
 */

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useInView, useReducedMotion, useWebGLSupported } from "@/lib/motion";

export interface SceneProps {
  progressRef: React.RefObject<number>;
  active: boolean;
}

export function SceneMount({
  children,
  scene: Scene,
  fadeMs = 700,
  rootMargin = "300px",
}: {
  children: React.ReactNode;
  scene: ComponentType<SceneProps>;
  fadeMs?: number;
  rootMargin?: string;
}) {
  const [wrapRef, inView] = useInView<HTMLDivElement>({ rootMargin });
  const reduced = useReducedMotion();
  const webgl = useWebGLSupported();
  const progressRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  const enabled = webgl === true && !reduced;

  useEffect(() => {
    if (enabled && inView) setMounted(true);
  }, [enabled, inView]);

  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const span = rect.height + window.innerHeight;
      progressRef.current = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / span));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mounted, wrapRef]);

  return (
    <div ref={wrapRef} className="relative">
      <div
        className="transition-opacity"
        style={{ opacity: ready ? 0 : 1, transitionDuration: `${fadeMs}ms` }}
        aria-hidden={ready || undefined}
      >
        {children}
      </div>

      {mounted && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{ opacity: ready ? 1 : 0, transitionDuration: `${fadeMs}ms` }}
          aria-hidden
        >
          <Scene progressRef={progressRef} active={inView} />
        </div>
      )}
    </div>
  );
}
