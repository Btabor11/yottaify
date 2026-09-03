import { NextResponse } from "next/server";
import { validateReservation } from "@/lib/validation";

/**
 * Local reservation endpoint. Exists so the round trip is exercisable and so
 * the form degrades to a native HTML POST when JavaScript never arrives.
 *
 * It validates with the SAME zod schema the client uses — there is one
 * definition of "valid" in this codebase, in lib/validation.ts.
 *
 * This does not persist anything. Real delivery (CRM, webhook, email) belongs
 * in lib/submitReservation.ts or behind this route; either way it is one file.
 */

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

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

  const result = validateReservation(data);

  if (!result.ok) {
    if (isForm) {
      // No-JS path: bounce back to the form with an error flag rather than
      // dumping JSON in the user's browser.
      const back = new URL(typeof data.returnTo === "string" ? data.returnTo : "/", request.url);
      back.searchParams.set("reservation", "invalid");
      back.hash = "reserve";
      return NextResponse.redirect(back, 303);
    }
    return NextResponse.json({ ok: false, reason: "validation", errors: result.errors }, { status: 422 });
  }

  console.info("[api/reservation] received", { ...result.data, receivedAt: new Date().toISOString() });

  if (isForm) {
    const back = new URL(typeof data.returnTo === "string" ? data.returnTo : "/", request.url);
    back.searchParams.set("reservation", "received");
    back.hash = "reserve";
    return NextResponse.redirect(back, 303);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
