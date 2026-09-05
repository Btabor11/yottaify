import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * ESLint 9 flat config.
 *
 * Until this file existed, `npm run lint` exited with a config error rather
 * than linting anything — so nothing in this repo had ever been linted.
 *
 * eslint-config-next 16 ships flat-config arrays directly from its subpath
 * exports, so they are spread in as-is. Do NOT route these through FlatCompat:
 * the eslintrc bridge fails on this version with a circular-structure error
 * while trying to serialise its own validation failure.
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "shots/**",
      "lighthouse/**",
      "next-env.d.ts",
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      // Unused vars are an error, but a leading underscore is an explicit
      // "I know — it is part of the signature."
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },

  {
    // Dev tooling: plain node scripts that print to stdout by design, and are
    // never bundled into the site.
    files: ["scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
];

export default eslintConfig;
