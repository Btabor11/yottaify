import { NextResponse } from "next/server";
import { runRefresh } from "@/lib/market/refresh";
import { getMarketStore } from "@/lib/market/store";

/**
 * Daily refresh. Fired by Vercel Cron (see vercel.json) and by
 * `npm run market:refresh` locally. Protected by CRON_SECRET: Vercel sends it
 * as a Bearer token on scheduled invocations; nothing else can trigger a run.
 *
 * Fetches every source in parallel, digests, stores, and returns the day's
 * summary. A partial failure is still a successful run — the snapshot records
 * which sources failed, and the page shows that rather than hiding it.
 */
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret) return NextResponse.json({ ok: false, reason: "CRON_SECRET is not set" }, { status: 503 });
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const only = url.searchParams.get("only")?.split(",").filter(Boolean);
  const { results, snapshot } = await runRefresh({ only });
  await getMarketStore().saveRun(results, snapshot);

  return NextResponse.json({
    ok: true,
    day: snapshot.day,
    run: snapshot.run,
    legibility: snapshot.legibility,
    medianOnDemand: snapshot.medianOnDemand,
    lowestBookable: snapshot.lowestBookable,
    failed: snapshot.sources.filter((s) => s.state === "error").map((s) => ({ id: s.id, error: s.error })),
  });
}
