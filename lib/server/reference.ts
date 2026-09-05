import { randomBytes, createHash } from "node:crypto";

/**
 * Reference codes: R-7K3M2X. Six characters from an alphabet with no 0/O,
 * 1/I/L, so it survives being read aloud on a call. ~1.1 billion codes;
 * the store retries on the (astronomically unlikely) collision.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newReference(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `R-${out}`;
}

export function isReference(v: unknown): v is string {
  return typeof v === "string" && /^R-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(v);
}

/**
 * Salted hash of a client IP. We keep the hash so repeat submissions from one
 * address can be correlated; we never keep the address. Set IP_HASH_SALT in
 * production so the hash cannot be reversed by brute force over IPv4 space.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "dev-salt-not-for-production";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
