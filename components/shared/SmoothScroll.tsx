"use client";

import { useLenis, type ScrollFeel } from "@/lib/motion";

/**
 * Mounts Lenis for the subtree it sits in. Lenis is loaded dynamically and
 * skipped entirely under `prefers-reduced-motion: reduce` — taking over the
 * scroll wheel is precisely what that preference asks us not to do.
 *
 * `feel` lets each direction set its own scroll weight.
 */
export function SmoothScroll({
  enabled = true,
  ...feel
}: { enabled?: boolean } & ScrollFeel) {
  useLenis(enabled, feel);
  return null;
}
