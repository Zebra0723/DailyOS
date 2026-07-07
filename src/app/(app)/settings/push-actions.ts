"use server";

import { createClient } from "@/lib/supabase/server";
import { sendToUser } from "@/lib/push-server";

/** Store (or refresh) a device's push subscription for the signed-in user. */
export async function savePushSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  try {
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint: sub.endpoint,
        user_id: user.id,
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
      { onConflict: "endpoint" },
    );
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/** Forget a device's push subscription. */
export async function deletePushSubscription(
  endpoint: string,
): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);
    return { ok: !error };
  } catch {
    return { ok: false };
  }
}

/** Send a test notification to all of this user's devices. Lets someone confirm
 *  push is really working right after they turn it on. */
export async function sendTestPush(): Promise<{ ok: boolean; sent: number }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, sent: 0 };
  const sent = await sendToUser(user.id, {
    title: "DailyOS notifications are on 🎉",
    body: "This is a test. You'll get nudges for reminders and expiring rewards here.",
    url: "/today",
    tag: "dailyos-test",
  });
  return { ok: sent > 0, sent };
}
