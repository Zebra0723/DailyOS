import { createServiceClient } from "@/lib/supabase/server";
import { iconResponse } from "@/lib/app-icon";

// Per-user app icon, keyed by user id in the URL — so it resolves WITHOUT a
// login cookie. The (app) layout renders this as the apple-touch-icon while the
// user is signed in, so iOS uses their custom icon when they Add to Home Screen.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = createServiceClient();
    const { data } = await admin
      .from("user_state")
      .select("value")
      .eq("user_id", params.id)
      .eq("key", "appicon")
      .maybeSingle();
    return iconResponse(typeof data?.value === "string" ? data.value : null);
  } catch {
    return iconResponse(null);
  }
}
