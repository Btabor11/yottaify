/**
 * Browser-context options for reaching /admin in the harnesses.
 *
 * The desk's proxy answers an HTML GET with a redirect to its login page
 * rather than a 401, and a browser only sends Basic credentials *after* being
 * challenged — Playwright's `httpCredentials.send: "always"` covers API
 * requests, not page navigations. So the header is set directly.
 *
 * Credentials are read from the environment and never travel on a command
 * line: run a harness as
 *
 *   node --env-file=.env.local scripts/<harness>.mjs
 *
 * and this picks up ADMIN_USER / ADMIN_PASSWORD by itself. Nothing here
 * prints, returns or logs the values.
 *
 * Dev-only tooling. Not part of the shipped site.
 */

export function adminContext(extra = {}) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return extra;
  const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return {
    ...extra,
    httpCredentials: { username: user, password: pass },
    extraHTTPHeaders: { ...(extra.extraHTTPHeaders ?? {}), authorization: `Basic ${token}` },
  };
}

/** Whether the environment can reach /admin at all, without saying how. */
export function haveAdminCredentials() {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD);
}
