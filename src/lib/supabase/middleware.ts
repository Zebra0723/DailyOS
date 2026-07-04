import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/welcome",
  "/today",
  "/homeos",
  "/build-day",
  "/interests",
  "/world-clock",
  "/inbox",
  "/notes",
  "/calendar",
  "/tasks",
  "/vault",
  "/mindfulness",
  "/mood",
  "/nudges",
  "/wellbeing",
  "/settings",
  "/admin",
];

const AUTH_ROUTES = ["/login", "/signup"];

/**
 * Refreshes the Supabase session on every request and guards protected routes.
 */
export async function updateSession(request: NextRequest) {
  // Let the sign-out route clear cookies without the middleware refreshing the
  // session underneath it.
  if (request.nextUrl.pathname === "/auth/signout") {
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

  // Never let the browser serve a stale HTML shell — that leaves old cached
  // JS wired to new markup and breaks buttons after a deploy. Hashed JS/CSS
  // chunks under _next/static are excluded by the matcher, so they stay cached.
  supabaseResponse.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate",
  );
  return supabaseResponse;
}
