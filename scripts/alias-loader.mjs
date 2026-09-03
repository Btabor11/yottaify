/**
 * Teaches plain `node` the `@/` path alias from tsconfig, so scripts here can
 * import the real application modules instead of a copy of them.
 *
 *   node --experimental-strip-types --import ./scripts/alias-loader.mjs <script>
 *
 * Dev-only tooling. Not part of the shipped site.
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

const root = pathToFileURL(process.cwd() + "/").href;

register(
  "data:text/javascript," +
    encodeURIComponent(`
      const root = ${JSON.stringify(root)};
      const EXTS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

      export async function resolve(specifier, context, next) {
        // The "@/" alias from tsconfig.
        if (specifier.startsWith("@/")) {
          const base = root + specifier.slice(2);
          for (const ext of EXTS) {
            try { return await next(base + ext, context); } catch {}
          }
        }
        // TypeScript's extensionless relative imports.
        if (specifier.startsWith(".")) {
          try { return await next(specifier, context); } catch (err) {
            for (const ext of EXTS.slice(1)) {
              try { return await next(specifier + ext, context); } catch {}
            }
            throw err;
          }
        }
        return next(specifier, context);
      }
    `),
  import.meta.url,
);
