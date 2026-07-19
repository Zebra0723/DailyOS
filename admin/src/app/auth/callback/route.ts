import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The magic link lands here; exchange the code for a session, then go to /admin.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
