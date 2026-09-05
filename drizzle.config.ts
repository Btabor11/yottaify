import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads the schema and either pushes it straight to the database
 * (`npm run db:push`, fine for a fresh Neon branch) or writes SQL migrations
 * to ./drizzle (`npm run db:generate`, then `npm run db:migrate`).
 */
export default defineConfig({
  schema: "./lib/server/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
