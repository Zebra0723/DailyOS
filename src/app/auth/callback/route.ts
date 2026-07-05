import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  SESSION_DEADLINE_COOKIE,
  deadlineFromNow,
  sessionMaxAgeSeconds,
} from "@/lib/session-expiry";

/**
 * Handles the email-confirmation / magic-link redirect. Exchanges the `code`
 * for a session cookie, then forwards the user into the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/today";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${redirect}`);
      // This path (email confirm / magic link) has no login form to tick
      // "Remember me", so a fresh arrival gets the full 4-week window. Without
      // a deadline cookie, middleware would sign them straight back out.
      res.cookies.set(
        SESSION_DEADLINE_COOKIE,
        String(deadlineFromNow(true, Date.now())),
        {
          path: "/",
          maxAge: sessionMaxAgeSeconds(true),
          sameSite: "lax",
          secure: origin.startsWith("https"),
        },
      );
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
