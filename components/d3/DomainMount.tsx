"use client";

import { HEAVY_SCENE_IDLE, SceneMount } from "@/components/shared/SceneMount";

/** D3's memory domain, gated by the shared WebGL/in-view/reduced-motion policy. */
export function DomainMount({ children }: { children: React.ReactNode }) {
  return (
    <SceneMount load={() => import("./DomainScene")} fadeMs={900} idleTimeout={HEAVY_SCENE_IDLE}>
      {children}
    </SceneMount>
  );
}
