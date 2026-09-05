"use client";

import type { ReactNode } from "react";
import { trackSourceClick } from "@/lib/analytics";
import { track as journey } from "@/lib/journey";

/**
 * An outbound citation link that records the click. Someone who clicks
 * through to a source is checking our work — the most engaged kind of visitor
 * there is, and worth knowing about on the lead that follows.
 */
export function SourceLink({
  href,
  sourceId,
  className,
  children,
}: {
  href: string;
  sourceId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={className}
      onClick={() => {
        trackSourceClick("d3", sourceId);
        journey.sourceClick();
      }}
    >
      {children}
    </a>
  );
}
