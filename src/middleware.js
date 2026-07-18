import { NextResponse } from "next/server";

/**
 * Edge middleware — gatekeeps the admin/cashier area.
 *
 * We only do a lightweight presence check here (does a token cookie exist?)
 * because full JWT verification with `jsonwebtoken` is not available on the
 * Edge runtime. Deep verification (signature + role + page access) happens
 * inside each API route and server component via src/lib/auth.js.
 *
 * Anyone hitting /admin/* without a token cookie is bounced to /login.
 */
export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  if (pathname.startsWith("/admin") && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run the middleware on admin routes.
export const config = {
  matcher: ["/admin/:path*"],
};
