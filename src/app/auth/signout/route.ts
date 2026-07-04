import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side sign-out. Signing out here clears the auth cookies on this
 * response before the redirect, so /login can't see a stale session and bounce
 * the user back to /today. Reached by navigating the browser to /auth/signout.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
