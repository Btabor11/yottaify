"use client";

import { useEffect, useRef } from "react";
import { STORY, STORY_OPENING } from "@/content";
import { prefersReducedMotion } from "@/lib/motion";
import { subscribeScroll } from "@/lib/scroll-runtime";
import { mountStoryFrame, STORY_FRAME } from "./frame";

/**
 * The stage's instrument strip: which figure the field is forming and how far
 * through the story the reader is. Pinned to the right edge of the sticky
 * stage on wide screens, hidden where the text needs the width.
 *
 * Server-rendered in its resting state (Fig. 00, phase 0.000), so a reader
 * without JS still sees a complete instrument; the client only moves the
 * needle. Under reduced motion it stays where the server left it — a stopped
 * gauge is still a gauge.
 *
 * Progress here is the same number the shader morphs by, so the strip and the
 * field never disagree about where the current is.
 */
export function StageIndex() {
  const rootRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLSpanElement>(null);
  const stops = [
    { index: "00", shape: STORY_OPENING.shape as string, id: "main" },
    ...STORY.map((c) => ({ index: c.index, shape: c.shape as string, id: `chapter-${c.id}` })),
  ];
  const last = stops.length - 1;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = rootRef.current;
    if (!el) return;

    let activeWritten = -1;
    let phaseWritten = "";
    const releaseStory = mountStoryFrame();
    // Pure writer. Everything it needs was measured once at the head of the
    // frame, which is also what guarantees the needle and the field can never
    // disagree about where the current is.
    const releaseScroll = subscribeScroll({
      write: () => {
        if (!STORY_FRAME.map) return;
        const text = STORY_FRAME.progress.toFixed(3);
        if (phaseRef.current && text !== phaseWritten) {
          phaseWritten = text;
          phaseRef.current.textContent = text;
        }
        // Shape index counts the device as zero; the stops start at the horizon.
        const active = Math.min(last, Math.max(0, Math.round(STORY_FRAME.shapeIndex - 1)));
        if (active !== activeWritten) {
          activeWritten = active;
          el.dataset.active = String(active);
        }
      },
    });
    return () => {
      releaseScroll();
      releaseStory();
    };
  }, [last]);

  return (
    <div ref={rootRef} className="d3-stageindex" data-active="0" aria-hidden>
      <p className="d3-stageindex-phase d3-tag">
        <span className="text-[var(--ink-3)]">{STORY_OPENING.phaseWord}</span>
        <span ref={phaseRef} className="d3-figure text-[var(--live)]">
          0.000
        </span>
      </p>
      <ol className="d3-stageindex-stops">
        {stops.map((s, i) => (
          <li key={s.index} className="d3-stageindex-stop" data-i={i}>
            <a href={`#${s.id}`} tabIndex={-1} className="d3-stageindex-link">
              <span className="d3-stageindex-tick" />
              <span className="d3-tag d3-stageindex-label">
                <span className="d3-stageindex-fig">
                  {STORY_OPENING.figureWord} {s.index}
                </span>
                <span className="d3-stageindex-shape">{s.shape}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
