/**
 * POST /api/admin/login — the login form's target. Checks the credentials
 * against ADMIN_USER / ADMIN_PASSWORD, sets the session cookie, and sends the
 * browser on to the desk. Wrong credentials go back to the form with a flag.
 * Rate-limited per IP so the form cannot be brute-forced quietly.
 */

import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_S, adminToken, safeEqual } from "@/lib/admin-token";
import { rateLimit } from "@/lib/server/ratelimit";
import { requestFacts } from "@/lib/server/request";

export async function POST(request: Request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;
  if (!user || !pass) return new NextResponse(null, { status: 404 });

  const back = (flag: string) => NextResponse.redirect(new URL(`/admin/login?${flag}=1`, request.url), 303);

  const rl = rateLimit(`admin-login:${requestFacts(request).ipHash ?? "unknown"}`, 10, 60_000);
  if (!rl.ok) return back("limited");

  const form = await request.formData();
  const u = String(form.get("user") ?? "");
  const p = String(form.get("pass") ?? "");
  const next = String(form.get("next") ?? "");

  if (!safeEqual(u, user) || !safeEqual(p, pass)) return back("failed");

  const dest = next.startsWith("/admin") && !next.includes("//") ? next : "/admin";
  const res = NextResponse.redirect(new URL(dest, request.url), 303);
  res.cookies.set(ADMIN_COOKIE, await adminToken(user, pass), {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge: ADMIN_SESSION_S,
  });
  return res;
}
