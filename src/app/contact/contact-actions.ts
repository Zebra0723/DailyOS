"use server";

import { createServiceClient } from "@/lib/supabase/server";

/** Public contact form → lands in the `feedback` table (DailyOS Support).
 *  Works without a login, so a stuck visitor always has a real channel. */
export async function submitContact(
  email: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  const cleanMsg = message.trim();
  const cleanEmail = email.trim();
  if (!cleanMsg) return { ok: false, error: "Please write a message first." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    return { ok: false, error: "Please enter a valid email so we can reply." };
  }
  try {
    const admin = createServiceClient();
    const { error } = await admin.from("feedback").insert({
      user_id: null,
      email: cleanEmail.slice(0, 320),
      message: `[Contact form] ${cleanMsg}`.slice(0, 4000),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
