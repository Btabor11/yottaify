import { hashIp } from "./reference";

/**
 * What the server can learn about a request without the client telling it.
 * Vercel sets the geo headers; elsewhere they are simply absent and the
 * columns stay null.
 */
export interface RequestFacts {
  ip: string | null;
  ipHash: string | null;
  userAgent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  deviceClass: "mobile" | "tablet" | "desktop" | "bot" | null;
}

export function requestFacts(req: Request): RequestFacts {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : h.get("x-real-ip"))?.trim() || null;
  const ua = h.get("user-agent");
  return {
    ip,
    ipHash: hashIp(ip),
    userAgent: ua ? ua.slice(0, 400) : null,
    country: h.get("x-vercel-ip-country"),
    region: h.get("x-vercel-ip-country-region"),
    city: h.get("x-vercel-ip-city") ? decodeURIComponent(h.get("x-vercel-ip-city")!) : null,
    deviceClass: classify(ua),
  };
}

function classify(ua: string | null): RequestFacts["deviceClass"] {
  if (!ua) return null;
  if (/bot|crawl|spider|slurp|headless|lighthouse/i.test(ua)) return "bot";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}
