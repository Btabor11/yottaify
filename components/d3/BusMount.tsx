"use client";

import { SceneMount } from "@/components/shared/SceneMount";
import { BusStill } from "./BusStill";

/**
 * The hero field, gated by the shared WebGL / in-view / reduced-motion policy.
 * A long fade, because this sits behind the headline and a hard cut under live
 * text is the cheapest-looking thing a page can do.
 */
export function BusMount() {
  return (
    <div className="absolute inset-0 [&>div]:h-full [&>div>div]:h-full">
      <SceneMount load={() => import("./BusScene")} fadeMs={1200} rootMargin="0px">
        <BusStill />
      </SceneMount>
    </div>
  );
}
