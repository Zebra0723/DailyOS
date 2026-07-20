"use server";

import { createClient } from "@/lib/supabase/server";
import { sendToUser, pushConfigured } from "@/lib/push-server";

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
export type TestPushReason =
  | "ok"
  | "signed-out"
  | "not-configured"
  | "no-device"
  | "send-failed";

export async function sendTestPush(): Promise<{
  ok: boolean;
  sent: number;
  reason: TestPushReason;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, sent: 0, reason: "signed-out" };

  // The server needs BOTH VAPID keys to send anything.
  if (!pushConfigured()) return { ok: false, sent: 0, reason: "not-configured" };

  // Does the server actually have a subscription for this user/device?
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("user_id", user.id);
  if (!subs || subs.length === 0) {
    return { ok: false, sent: 0, reason: "no-device" };
  }

  const sent = await sendToUser(user.id, {
    title: "DailyOS notifications are on 🎉",
    body: "This is a test. You'll get nudges for reminders and expiring rewards here.",
    url: "/today",
    tag: "dailyos-test",
  });
  // Subscriptions exist but nothing delivered → almost always a VAPID key
  // mismatch (the public key that made the subscription no longer matches the
  // server's private key). Re-subscribing after fixing the keys resolves it.
  return {
    ok: sent > 0,
    sent,
    reason: sent > 0 ? "ok" : "send-failed",
  };
}
