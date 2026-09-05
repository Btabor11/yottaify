/**
 * Store selection. See store-shared.ts for the interface and the reasoning.
 *
 *   DATABASE_URL set    → Postgres through Drizzle (store-pg.ts)
 *   unset               → JSON files under .data/ (store-file.ts)
 */

import { hasDatabase } from "./db";
import type { Store } from "./store-shared";

export type { ListFilter, Stats, Store } from "./store-shared";
export { computeStats, gpuLow, OPEN_LIST } from "./store-shared";

let instance: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  instance ??= (async () => {
    if (hasDatabase()) {
      const { PgStore } = await import("./store-pg");
      return new PgStore();
    }
    const { FileStore } = await import("./store-file");
    return new FileStore();
  })();
  return instance;
}
