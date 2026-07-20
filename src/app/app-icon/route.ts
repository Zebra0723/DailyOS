import { createClient } from "@/lib/supabase/server";
import { iconResponse } from "@/lib/app-icon";

// Cookie-based app icon (used on non-app pages). Serves the signed-in user's
// custom icon if set, else the default. The per-user /app-icon/[id] route is
// what iOS actually uses for the installed icon (no cookie needed).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
      return iconResponse(typeof data?.value === "string" ? data.value : null);
    }
  } catch {
    /* fall through to default */
  }
  return iconResponse(null);
}
