/**
 * Soft per-process rate limit. On serverless this is per-instance, so it is a
 * speed bump for a naive bot, not a wall. It is deliberately not a dependency
 * on Redis or Upstash: a forty-eight-GPU fleet does not need distributed rate
 * limiting to protect a lead form. If that changes, swap the Map for KV here
 * and nothing else moves.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterS: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic sweep so the map cannot grow without bound.
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    return { ok: true, retryAfterS: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfterS: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfterS: 0 };
}
