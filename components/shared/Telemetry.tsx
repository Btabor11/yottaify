"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { observeSections, onSectionSeen, track as journeyTrack } from "@/lib/journey";
import { trackPageView, trackSectionView } from "@/lib/analytics";

/**
 * Mounts once per route. Records the page in the session journey, starts
 * watching which sections come on screen, and fires page_view / section_view
 * if an analytics provider is on. Renders nothing; the page is identical
 * without it.
 */
export function Telemetry() {
  const pathname = usePathname();

  useEffect(() => {
    journeyTrack.page(pathname);
    trackPageView(pathname);
    const off = onSectionSeen(trackSectionView);
    observeSections();
    return off;
  }, [pathname]);

  return null;
}
