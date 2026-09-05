import { NextResponse } from "next/server";
import { getMarketStore } from "@/lib/market/store";

/**
 * Public read of the tracker: the latest snapshot and up to 90 days of history.
 * Cached for an hour at the edge; the data changes once a day.
 */
export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(request: Request) {
  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 90) || 90));
  const store = getMarketStore();
  const [latest, history] = await Promise.all([store.latest(), store.history(days)]);
  return NextResponse.json(
    { latest, history },
    { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
