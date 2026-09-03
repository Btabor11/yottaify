"use client";

import dynamic from "next/dynamic";
import { SceneMount } from "@/components/shared/SceneMount";

const EngravingScene = dynamic(() => import("./EngravingScene"), { ssr: false });

/** D2's engraved node, gated by the shared WebGL/in-view/reduced-motion policy. */
export function EngravingMount({ children }: { children: React.ReactNode }) {
  return <SceneMount scene={EngravingScene} fadeMs={900}>{children}</SceneMount>;
}
