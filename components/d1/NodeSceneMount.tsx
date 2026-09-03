"use client";

import dynamic from "next/dynamic";
import { SceneMount } from "@/components/shared/SceneMount";

const NodeScene = dynamic(() => import("./NodeScene"), { ssr: false });

/** D1's node scene, gated by the shared WebGL/in-view/reduced-motion policy. */
export function NodeSceneMount({ children }: { children: React.ReactNode }) {
  return <SceneMount scene={NodeScene}>{children}</SceneMount>;
}
