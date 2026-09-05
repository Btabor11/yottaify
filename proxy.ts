/**
 * PROXY — runs before any route renders.
 *
 * One job: keep /admin behind credentials. They come from ADMIN_USER and
 * ADMIN_PASSWORD. When either is unset the route answers 404, so an
 * unconfigured deploy has no admin surface to find rather than an admin
 * surface with a default password.
 *
 * Two ways in, same credentials:
 *   - HTTP Basic, for curl and the CSV export from a cron job
 *   - a session cookie set by /admin/login, for browsers — many embedded
 *     and mobile browsers never show the Basic auth dialog
 *
 * Right-sized for one team. Move to a real identity provider before more than
 * a handful of people need it. See DATA.md.
 */

import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/admin-token";

const LOGIN_PATH = "/admin/login";

export async function proxy(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (!user || !pass) {
    return new NextResponse(null, { status: 404 });
  }

  const { pathname } = request.nextUrl;
  if (pathname === LOGIN_PATH) return NextResponse.next();

  // 1. Basic auth header.
  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    let decoded = "";
    try {
      decoded = atob(encoded);
    } catch {
      /* malformed header: fall through to the other checks */
    }
    const i = decoded.indexOf(":");
    if (i > 0 && safeEqual(decoded.slice(0, i), user) && safeEqual(decoded.slice(i + 1), pass)) {
      return NextResponse.next();
    }
  }

  // 2. Session cookie from the login form.
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (cookie && safeEqual(cookie, await adminToken(user, pass))) {
    return NextResponse.next();
  }

  // A browser navigating gets the login page; everything else gets the
  // challenge, so `curl -u` and scripted exports keep working.
  const wantsHtml = (request.headers.get("accept") ?? "").includes("text/html");
  if (wantsHtml && request.method === "GET") {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = pathname !== "/admin" ? `?next=${encodeURIComponent(pathname)}` : "";
    return NextResponse.redirect(url, 303);
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
