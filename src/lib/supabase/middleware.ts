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
        secure: true,
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

  // Fetch the session and the global app config together — one round-trip.
  const [
    {
      data: { user },
    },
    cfgRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("app_config")
      .select("value")
      .eq("key", "global")
      .maybeSingle()
      .then(
        (r) => r.data,
        () => null,
      ),
  ]);

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // Maintenance mode: hold everyone at /maintenance except admins and the
  // owner-picked allowlist. This runs before the auth redirects so even a
  // logged-out visitor sees the maintenance screen instead of the login/
  // marketing pages — the old check lived in the app layout, which logged-out
  // visitors never reached.
  const cfg = (cfgRes?.value ?? {}) as {
    maintenance?: boolean;
    maintenanceAllowlist?: string[];
  };
  if (cfg.maintenance) {
    const allow = new Set(
      (cfg.maintenanceAllowlist ?? []).map((e) => e.toLowerCase()),
    );
    const exempt =
      Boolean(user) &&
      (isAdminUser(user) || allow.has((user!.email ?? "").toLowerCase()));
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
