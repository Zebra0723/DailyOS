"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/admin-notify";

/** Submit user feedback → lands in the `feedback` table (DailyOS Support). */
export async function submitFeedback(message: string): Promise<{ ok: boolean; error?: string }> {
  const clean = message.trim();
  if (!clean) return { ok: false, error: "Write something first." };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    const admin = createServiceClient();
    const { error } = await admin.from("feedback").insert({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      message: clean.slice(0, 4000),
    });
    if (error) return { ok: false, error: error.message };
    // Alert the owner(s) on their devices that feedback just came in.
    await notifyAdmins({
      title: "🗣 New DailyOS feedback",
      body: clean.length > 140 ? `${clean.slice(0, 140)}…` : clean,
      url: "/settings",
      tag: "feedback",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
