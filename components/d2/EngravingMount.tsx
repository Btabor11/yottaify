"use client";

import { HEAVY_SCENE_IDLE, SceneMount } from "@/components/shared/SceneMount";

/** D2's engraved node, gated by the shared WebGL/in-view/reduced-motion policy. */
export function EngravingMount({ children }: { children: React.ReactNode }) {
  return (
    <SceneMount load={() => import("./EngravingScene")} fadeMs={900} idleTimeout={HEAVY_SCENE_IDLE}>
      {children}
    </SceneMount>
  );
}
