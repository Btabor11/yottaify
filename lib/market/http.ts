import { createHash } from "node:crypto";

/**
 * One fetch helper for every source: identifies itself, times out, retries
 * once on transport errors, and returns the body with a hash and a helper to
 * cut a human-readable excerpt around a match.
 *
 * The User-Agent names the tracker and links to the methodology page, so an
 * operator who sees us in their logs knows what we are and how to reach us.
 */

export const TRACKER_UA = "CluerMarketTracker/1.0 (+https://example.com/market; daily; one request per source)";

export interface Fetched {
  url: string;
  status: number;
  body: string;
  hash: string;
  readAt: string;
  ms: number;
  /** Cut ≤ 240 chars around the first match of `re`, whitespace-collapsed. */
  excerpt(re: RegExp | string, radius?: number): string;
}

export class HttpError extends Error {
  readonly url: string;
  readonly status: number;
  constructor(url: string, status: number) {
    super(`HTTP ${status} for ${url}`);
    this.url = url;
    this.status = status;
  }
}

export async function fetchText(
  url: string,
  init: RequestInit & { timeoutMs?: number; retries?: number; ua?: "tracker" | "browser" } = {},
): Promise<Fetched> {
  const { timeoutMs = 15_000, retries = 1, ua = "tracker", ...rest } = init;
  const headers = new Headers(rest.headers);
  if (!headers.has("user-agent")) {
    headers.set(
      "user-agent",
      ua === "browser"
        ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
        : TRACKER_UA,
    );
  }
  if (!headers.has("accept")) headers.set("accept", "application/json, text/html;q=0.9, */*;q=0.8");
  if (!headers.has("accept-encoding")) headers.set("accept-encoding", "gzip, br");

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const started = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...rest, headers, signal: ctrl.signal, redirect: "follow", cache: "no-store" });
      const body = await res.text();
      clearTimeout(timer);
      if (!res.ok) throw new HttpError(url, res.status);
      const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
      const readAt = new Date().toISOString();
      const ms = Date.now() - started;
      return {
        url,
        status: res.status,
        body,
        hash,
        readAt,
        ms,
        excerpt(re, radius = 120) {
          const m = typeof re === "string" ? body.indexOf(re) : body.search(re);
          if (m < 0) return "";
          const start = Math.max(0, m - radius);
          return body
            .slice(start, m + radius)
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 240);
        },
      };
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      // HTTP errors are final; transport errors (TLS reset, timeout) get one retry.
      if (e instanceof HttpError) throw e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function fetchJson<T = unknown>(url: string, init: Parameters<typeof fetchText>[1] = {}): Promise<Fetched & { json: T }> {
  const f = await fetchText(url, init);
  let json: T;
  try {
    json = JSON.parse(f.body) as T;
  } catch {
    throw new Error(`Response from ${url} is not JSON`);
  }
  return Object.assign(f, { json });
}

/** Pull the JSON out of a Next.js `<script id="__NEXT_DATA__">` block. */
export function nextData<T = unknown>(html: string): T | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as T;
  } catch {
    return null;
  }
}

/** All `application/ld+json` blocks, parsed. Malformed ones are skipped. */
export function ldJson(html: string): unknown[] {
  const out: unknown[] = [];
  for (const m of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      /* skip */
    }
  }
  return out;
}

export function money(s: string | number | null | undefined): number | null {
  if (s == null) return null;
  if (typeof s === "number") return Number.isFinite(s) ? s : null;
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function round(n: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
