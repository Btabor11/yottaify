"use client";

import { SceneMount } from "@/components/shared/SceneMount";
import { StageIndex } from "./StageIndex";

/**
 * The sticky stage. Owns nothing but the decision to mount the particle
 * field; `children` is the server-rendered drawing that is the stage's
 * resting state. Progress is measured against the story section the stage
 * is pinned inside, so the field's morph is the reader's position in the
 * story, not in the document.
 */
export function StoryStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="d3-stage">
      <SceneMount
        load={() => import("./StoryScene")}
        progressMode="pin"
        rootMargin="0px"
        idleTimeout={900}
        fadeMs={1200}
        className="h-full"
      >
        {children}
      </SceneMount>
      {/* The scrim under every chapter's text, so legibility is a CSS
          guarantee and not a property of where the particles happen to be. */}
      <div aria-hidden className="d3-stage-scrim" />
      <StageIndex />
    </div>
  );
}
