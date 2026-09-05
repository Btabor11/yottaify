import { NextResponse } from "next/server";
import { getStore } from "@/lib/server/store";
import { rateLimit } from "@/lib/server/ratelimit";
import { requestFacts } from "@/lib/server/request";
import type { NewAnalyticsEventRow } from "@/lib/server/schema";

/**
 * First-party analytics sink. The client batches events and sends them with
 * `navigator.sendBeacon`, so this endpoint has to accept text/plain bodies
 * and answer fast. It never blocks on anything the visitor would notice.
 *
 * Only active when NEXT_PUBLIC_ANALYTICS_PROVIDER=firstparty; otherwise the
 * client never calls it. See lib/analytics.ts.
 */

export const runtime = "nodejs";

const ALLOWED = new Set([
  "page_view",
  "section_view",
  "reservation_start",
  "reservation_submit",
  "reservation_error",
  "followup_submit",
  "pricing_source_click",
  "cta_click",
  "estimator_change",
  "faq_open",
  "outbound_click",
  "page_leave",
]);

export async function POST(request: Request) {
  const facts = requestFacts(request);
  const rl = rateLimit(`ev:${facts.ipHash ?? "anon"}`, 240, 60_000);
  if (!rl.ok) return new NextResponse(null, { status: 429 });
  if (facts.deviceClass === "bot") return new NextResponse(null, { status: 204 });

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const b = body as { sessionId?: unknown; events?: unknown };
  if (typeof b?.sessionId !== "string" || !Array.isArray(b.events)) return new NextResponse(null, { status: 400 });
  const sessionId = b.sessionId.slice(0, 64);

  const rows: NewAnalyticsEventRow[] = [];
  for (const raw of b.events.slice(0, 50)) {
    const e = raw as { name?: unknown; props?: unknown; path?: unknown; referrer?: unknown; ts?: unknown };
    if (typeof e?.name !== "string" || !ALLOWED.has(e.name)) continue;
    const ts = typeof e.ts === "number" ? new Date(e.ts) : null;
    rows.push({
      sessionId,
      name: e.name,
      props: e.props && typeof e.props === "object" ? (e.props as Record<string, unknown>) : null,
      path: typeof e.path === "string" ? e.path.slice(0, 200) : null,
      referrer: typeof e.referrer === "string" ? e.referrer.slice(0, 500) : null,
      userAgent: facts.userAgent,
      ipHash: facts.ipHash,
      country: facts.country,
      clientTs: ts && !Number.isNaN(ts.getTime()) ? ts : null,
    });
  }
  if (!rows.length) return new NextResponse(null, { status: 204 });

  try {
    const store = await getStore();
    await store.recordAnalytics(rows);
  } catch (e) {
    // Analytics must never surface an error to a visitor.
    console.error("[api/event] store failure", e);
  }
  return new NextResponse(null, { status: 204 });
}
