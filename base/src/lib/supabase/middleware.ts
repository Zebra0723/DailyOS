import { NextResponse, type NextRequest } from "next/server";

// Password-based admin gate. The signed cookie is created on /verify and fully
// verified (HMAC) server-side in requireAdminUser. Middleware runs on the edge,
// so it only checks the cookie is PRESENT. Everything except /verify and /auth
// requires the cookie.
export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic = path === "/verify" || path.startsWith("/verify/") || path.startsWith("/auth");
  if (!isPublic && !request.cookies.get("dos_admin")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
