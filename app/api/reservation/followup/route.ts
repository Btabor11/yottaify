import { NextResponse } from "next/server";
import { parseFollowup } from "@/lib/server/context";
import { receiveFollowup } from "@/lib/server/pipeline";
import { rateLimit } from "@/lib/server/ratelimit";
import { requestFacts } from "@/lib/server/request";
import { isReference } from "@/lib/server/reference";

/**
 * The optional follow-up questionnaire. Authenticated by reference + email:
 * both are in the receipt the client just received, neither is guessable
 * together. Works as JSON or as a native form POST.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const facts = requestFacts(request);

  const rl = rateLimit(`fu:${facts.ipHash ?? "anon"}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });

  let data: Record<string, unknown>;
  if (isForm) {
    const form = await request.formData();
    data = {};
    for (const [k, v] of form.entries()) {
      // Multi-selects arrive as repeated keys.
      if (k in data) data[k] = ([] as string[]).concat(data[k] as string | string[], String(v));
      else data[k] = String(v);
    }
  } else {
    try {
      data = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, reason: "Malformed JSON body." }, { status: 400 });
    }
  }

  const back = (params: Record<string, string>) => {
    const url = new URL(typeof data.returnTo === "string" ? data.returnTo : "/", request.url);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.hash = "reserve";
    return NextResponse.redirect(url, 303);
  };

  const ref = typeof data.reference === "string" ? data.reference.toUpperCase().trim() : "";
  // Native round trips land back on the received state, flagged, so the
  // visitor keeps their reference in view whatever happened to the follow-up.
  const backReceived = (flag: string) => back({ reservation: "received", ref, followup: flag });

  if (!isReference(ref)) {
    if (isForm) return back({ reservation: "invalid" });
    return NextResponse.json({ ok: false, reason: "validation" }, { status: 422 });
  }

  const parsed = parseFollowup(data);
  if (!parsed.ok) {
    if (isForm) return backReceived("error");
    return NextResponse.json({ ok: false, reason: "validation" }, { status: 422 });
  }

  try {
    const r = await receiveFollowup(parsed.data);
    if (!r.ok) {
      if (isForm) return backReceived("error");
      return NextResponse.json({ ok: false, reason: r.reason }, { status: 404 });
    }
    if (isForm) return backReceived("saved");
    return NextResponse.json({ ok: true, reference: r.reservation.reference });
  } catch (e) {
    console.error("[api/reservation/followup] failure", e);
    if (isForm) return backReceived("error");
    return NextResponse.json({ ok: false, reason: "server" }, { status: 500 });
  }
}
