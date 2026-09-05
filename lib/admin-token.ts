/**
 * Session token for the admin desk: a SHA-256 of the configured credentials
 * and the salt. Stateless — the proxy can check it at the edge without a
 * store, and rotating the password or salt invalidates every session.
 * Web Crypto only, so it runs in the proxy as well as in route handlers.
 */
export const ADMIN_COOKIE = "admin_session";
export const ADMIN_SESSION_S = 12 * 3600;

export async function adminToken(user: string, pass: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT ?? "";
  const data = new TextEncoder().encode(`${user}\n${pass}\n${salt}\nadmin-session-v1`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time-ish compare, so a wrong value takes as long as a right one. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
