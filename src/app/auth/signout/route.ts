import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SESSION_DEADLINE_COOKIE } from "@/lib/session-expiry";

/**
 * Server-side sign-out. Signing out here clears the auth cookies on this
 * response before the redirect, so /login can't see a stale session and bounce
 * the user back to /today. Reached by navigating the browser to /auth/signout.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  const res = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
  // Drop the session-deadline cookie too, so a lapsed one can't linger.
  res.cookies.set(SESSION_DEADLINE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
