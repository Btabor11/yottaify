import { NextResponse, after } from "next/server";
import { validateReservation } from "@/lib/validation";
import { parseContext } from "@/lib/server/context";
import { notify, receiveReservation } from "@/lib/server/pipeline";
import { rateLimit } from "@/lib/server/ratelimit";
import { requestFacts } from "@/lib/server/request";

/**
 * The reservation endpoint. Accepts JSON from the enhanced form and a native
 * form POST when JavaScript never arrived; both validate with the SAME zod
 * schema the client uses (lib/validation.ts), then go through the same
 * pipeline (lib/server/pipeline.ts).
 *
 * Deliveries run in `after()`, so the visitor's confirmation does not wait
 * on a mail provider. The row is already durable by then.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data");
  const facts = requestFacts(request);

  // Ten submissions a minute from one address is generous for a human and
  // tight for a script. Never rate-limit the no-JS path harder than the JS one.
  const rl = rateLimit(`res:${facts.ipHash ?? "anon"}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, reason: "rate_limited", message: "Too many submissions. Wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterS) } },
    );
  }

  let data: Record<string, unknown>;
  if (isForm) {
    const form = await request.formData();
    data = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
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

  const result = validateReservation(data);
  if (!result.ok) {
    if (isForm) return back({ reservation: "invalid" });
    return NextResponse.json({ ok: false, reason: "validation", errors: result.errors }, { status: 422 });
  }

  const context = parseContext(typeof data.context === "object" && data.context ? data.context : data);

  try {
    const { reservation, duplicate } = await receiveReservation({ form: result.data, context, facts, jsEnabled: !isForm });

    if (!duplicate) after(() => notify(reservation));

    // The reference goes in the URL; the email does not. The no-JS follow-up
    // form asks for it again rather than leaking it into history and logs.
    if (isForm) return back({ reservation: "received", ref: reservation.reference });
    return NextResponse.json({ ok: true, reference: reservation.reference, duplicate }, { status: duplicate ? 200 : 201 });
  } catch (e) {
    console.error("[api/reservation] store failure", e);
    if (isForm) return back({ reservation: "error" });
    return NextResponse.json(
      { ok: false, reason: "server", message: "We could not save the reservation. Nothing was lost on your side — try again." },
      { status: 500 },
    );
  }
}
