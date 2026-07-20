import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The magic link lands here; exchange the code for a session, then go to /support.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/support", url.origin));
  }
  return NextResponse.redirect(new URL("/verify?error=auth", url.origin));
}
