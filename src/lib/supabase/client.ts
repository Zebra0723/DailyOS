import { createBrowserClient } from "@supabase/ssr";

const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/**
 * Every Supabase request goes through this fetch, which aborts anything that
 * runs longer than the timeout. This matters because the client's session
 * init (getSession/getUser/every table query all await it) makes a network call
 * on load; if that one request stalls and never settles, `initializePromise`
 * never resolves and the ENTIRE client wedges — which is what left the whole
 * dashboard stuck while an independent fetch to Supabase worked fine. Aborting
 * turns an infinite hang into a fast error the app can recover from.
 */
function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else
      callerSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

/** Supabase client for use in Client Components (browser). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: fetchWithTimeout },
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
