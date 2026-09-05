import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-token";

/** POST /api/admin/logout — clears the session cookie. */
export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
