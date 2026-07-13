import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_DEADLINE_COOKIE,
  isSessionExpired,
  deadlineFromNow,
  sessionMaxAgeSeconds,
} from "@/lib/session-expiry";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/welcome",
  "/today",
  "/assistant",
  "/homeos",
  "/build-day",
  "/interests",
  "/mindfulness",
  "/world-clock",
  "/inbox",
  "/notes",
  "/calendar",
  "/tasks",
  "/vault",
  "/settings",
  "/subscriptions",
  "/admin",
];

const AUTH_ROUTES = ["/login", "/signup"];

/**
 * Refreshes the Supabase session on every request and guards protected routes.
 */
export async function updateSession(request: NextRequest) {
  // Let the sign-out route clear cookies without the middleware refreshing the
  // session underneath it. The public calendar feed is token-authorised and
  // must be reachable without a session.
  const p = request.nextUrl.pathname;
  if (p === "/auth/signout" || p.startsWith("/api/calendar/")) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // A logged-in session that has outlived its window gets signed out. Only sign
  // out when the deadline cookie is PRESENT and in the past — a *missing* cookie
  // is re-stamped below instead of logging you out, so a valid session that
  // simply lost its deadline cookie (tab close, storage eviction) survives.
  const deadlineVal = request.cookies.get(SESSION_DEADLINE_COOKIE)?.value;
  const deadlineExpired =
    Boolean(user) &&
    deadlineVal !== undefined &&
    isSessionExpired(deadlineVal, Date.now());

  if (deadlineExpired) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signout";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Valid session but no deadline cookie (never set, or dropped by the browser)
  // → re-stamp a fresh window rather than signing them out. Keeps people logged
  // in across tab closes / storage quirks.
  if (user && deadlineVal === undefined) {
    supabaseResponse.cookies.set(
      SESSION_DEADLINE_COOKIE,
      String(deadlineFromNow(false, Date.now())),
      {
        path: "/",
        maxAge: sessionMaxAgeSeconds(false),
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      },
    );
  }

  // Never let the browser serve a stale HTML shell — that leaves old cached
  // JS wired to new markup and breaks buttons after a deploy. Hashed JS/CSS
  // chunks under _next/static are excluded by the matcher, so they stay cached.
  supabaseResponse.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate",
  );
  return supabaseResponse;
}
