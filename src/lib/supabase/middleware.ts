import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_DEADLINE_COOKIE,
  isSessionExpired,
  deadlineFromNow,
  sessionMaxAgeSeconds,
} from "@/lib/session-expiry";
import { isAdminUser } from "@/lib/admin-user";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// While maintenance mode is on, non-exempt visitors (logged out OR logged in)
// are sent to /maintenance. These paths stay open so an authorised account can
// still sign in, and so the maintenance/login pages can load their assets.
const MAINTENANCE_OPEN_PREFIXES = [
  "/maintenance",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/",
  "/api/",
  "/_next/",
  "/manifest",
];

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/welcome",
  "/today",
  "/assistant",
  "/homeos",
  "/build-day",
  "/interests",
  "/world-clock",
  "/journal",
  "/inbox",
  "/notes",
  "/calendar",
  "/tasks",
  "/vault",
  "/settings",
  "/subscriptions",
  "/review",
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

  const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
      },
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

  // getUser() MUST run first, and alone. It may rotate the refresh token and
  // write new auth cookies via setAll; running another query alongside it (an
  // earlier version used Promise.all here) races that refresh and drops the new
  // cookies — which logged people out in a new tab and made auth hang. Await it
  // fully before touching anything else on this client.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Then read the global config (public-read table) for maintenance mode.
  const cfgRes = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "global")
    .maybeSingle()
    .then(
      (r) => r.data,
      () => null,
    );

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // Maintenance mode: the app is closed to every SIGNED-IN account except
  // admins and the owner-picked allowlist — those users are held at
  // /maintenance. Logged-out visitors are deliberately left alone so the public
  // site stays live; they just get a prominent notice (see MaintenanceNotice).
  const cfg = (cfgRes?.value ?? {}) as {
    maintenance?: boolean;
    maintenanceAllowlist?: string[];
  };

  // Stamp the live maintenance state into a (non-HttpOnly) cookie the client
  // banner reads. Refreshed every request, so it works on static pages too and
  // clears the moment maintenance is switched off.
  supabaseResponse.cookies.set("dailyos-maint", cfg.maintenance ? "1" : "0", {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 3600,
  });

  if (cfg.maintenance && user) {
    const allow = new Set(
      (cfg.maintenanceAllowlist ?? []).map((e) => e.toLowerCase()),
    );
    const exempt =
      isAdminUser(user) || allow.has((user.email ?? "").toLowerCase());
    const open = MAINTENANCE_OPEN_PREFIXES.some((p) => pathname.startsWith(p));
    if (!exempt && !open) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

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
