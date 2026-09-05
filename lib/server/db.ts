import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Postgres connection, created once per process and only if configured.
 *
 * Any Postgres URL works: Neon, Supabase, Vercel Postgres, RDS, a local
 * container. `postgres` (postgres.js) speaks plain TCP with TLS, so there is
 * no provider SDK to swap when the provider changes.
 *
 * Unset DATABASE_URL → `db()` returns null and the store falls back to the
 * file-backed implementation. Nothing else in the codebase checks the env.
 */

const url = process.env.DATABASE_URL;

type Db = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // Survive HMR in dev so we do not leak a connection per reload.
  var __b300_db: Db | undefined;
}

export function hasDatabase(): boolean {
  return Boolean(url);
}

export function db(): Db | null {
  if (!url) return null;
  if (!globalThis.__b300_db) {
    const client = postgres(url, {
      // Serverless-friendly: few connections, short idle, prepared statements
      // off because poolers (Neon, Supabase, PgBouncer) do not support them.
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
    globalThis.__b300_db = drizzle(client, { schema });
  }
  return globalThis.__b300_db;
}
