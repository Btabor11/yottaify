"use client";

import { HEAVY_SCENE_IDLE, SceneMount } from "@/components/shared/SceneMount";

/** D1's node scene, gated by the shared WebGL/in-view/reduced-motion policy. */
export function NodeSceneMount({ children }: { children: React.ReactNode }) {
  return <SceneMount load={() => import("./NodeScene")} idleTimeout={HEAVY_SCENE_IDLE}>{children}</SceneMount>;
}
