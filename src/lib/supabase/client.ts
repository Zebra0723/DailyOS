import { createBrowserClient } from "@supabase/ssr";

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/**
 * No-op lock. Supabase serialises token refresh across tabs with the Web Locks
 * API (navigator.locks). In some Safari / installed-PWA contexts that lock is
 * never granted, so getSession(), getUser() and every table query that needs
 * the token hang until they time out — which is what left the dashboard widgets
 * stuck on "couldn't load" while server-rendered pages (which don't use this
 * client) worked fine. Running each auth operation without the cross-tab lock
 * trades a rare multi-tab refresh race for the client actually working.
 */
const noopLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>,
): Promise<R> => fn();

/** Supabase client for use in Client Components (browser). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { lock: noopLock },
      cookieOptions: {
        maxAge: COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax" as const,
        // HTTPS-only in production; off in local dev so http://localhost
        // doesn't silently drop the auth cookie. Mirrors the deadline cookie.
        secure: process.env.NODE_ENV === "production",
      },
    },
  );
}
