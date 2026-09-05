import { STORY } from "@/content";
import { Hero } from "../Hero";
import { Chapter } from "./Chapter";
import { StoryStage } from "./StoryStage";
import { StoryStill } from "./StoryStill";

/**
 * The story: the path of the current from the utility service to the die,
 * walked chapter by chapter over one stage.
 *
 * Layout is pure CSS. The stage is sticky and pulled back under the chapters
 * with a negative margin, so with JavaScript off the reader gets the same
 * sequence of chapters over the same drawing. The canvas, when it mounts,
 * paints into the stage and reads its progress from this section.
 */
export function Story() {
  return (
    <section className="d3-story" data-pin-host aria-label="The path of the current">
      <StoryStage>
        <StoryStill />
      </StoryStage>
      <Hero />
      {STORY.map((chapter) => (
        <Chapter key={chapter.id} chapter={chapter} />
      ))}
    </section>
  );
}
