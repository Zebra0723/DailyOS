import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Serves the home-screen app icon. If the signed-in user has set a custom one
// (stored in user_state.appicon as a data URL), we return that; otherwise the
// default DailyOS red/white icon. Referenced as the apple-touch-icon, so iOS
// picks up a user's custom icon when they Add to Home Screen.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_state")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", "appicon")
        .maybeSingle();
      const dataUrl = typeof data?.value === "string" ? data.value : null;
      const m = dataUrl ? /^data:([^;]+);base64,(.*)$/s.exec(dataUrl) : null;
      if (m) {
        const bytes = Buffer.from(m[2], "base64");
        return new NextResponse(new Uint8Array(bytes), {
          headers: { "Content-Type": m[1], "Cache-Control": "no-store" },
        });
      }
    }
  } catch {
    /* fall through to the default icon */
  }

  // Default DailyOS icon (static asset).
  const res = await fetch(new URL("/app-icon-default.png", request.url));
  return new NextResponse(res.body, {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
