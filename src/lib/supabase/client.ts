import { createBrowserClient } from "@supabase/ssr";

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/**
 * No-op lock. auth-js (2.65) serialises every auth call — including the session
 * init that getSession/getUser/each query all wait on — through the Web Locks
 * API (navigator.locks). On some devices/PWAs that lock is never granted (a
 * stuck or unavailable lock), so init waits on it forever and the whole client
 * wedges, even though the network is fine. The tell was that the *local*
 * getSession timed out — a local read can only hang on a lock, not the network.
 * Running each auth op without the cross-tab lock trades a rare multi-tab
 * refresh race for the client actually initialising.
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
        // doesn't silently drop the auth cookie.
        secure: process.env.NODE_ENV === "production",
      },
    },
  );
}
