import { PROVIDER_SOURCES } from "./providers";
import { TRACKER_SOURCES } from "./trackers";
import type { Source } from "./base";

export type { Source } from "./base";
export { providerFromSlug } from "./trackers";

export const SOURCES: Source[] = [...PROVIDER_SOURCES, ...TRACKER_SOURCES];

export function sourceById(id: string): Source | undefined {
  return SOURCES.find((s) => s.meta.id === id);
}

/** Display names for every provider id, including ones we only see via trackers. */
export { PROVIDER_LABEL, SOURCE_META, SOURCE_ORDER } from "../catalog";
