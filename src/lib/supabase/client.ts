import { createBrowserClient } from "@supabase/ssr";

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/** Supabase client for use in Client Components (browser). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax" as const,
        // HTTPS-only in production; off in local dev so http://localhost
        // doesn't silently drop the auth cookie.
        secure: process.env.NODE_ENV === "production",
      },
    },
  );
}
