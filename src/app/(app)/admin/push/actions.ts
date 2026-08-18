"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import { broadcastToAll, pushConfigured } from "@/lib/push-server";

export async function sendPushBroadcast(
  title: string,
  body: string,
): Promise<{ ok: boolean; sent?: number; error?: string }> {
  // Admin guard
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return { ok: false, error: "Unauthorized." };
  }

  if (!pushConfigured()) {
    return {
      ok: false,
      error:
        "VAPID keys are not configured (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).",
    };
  }

  if (!title.trim() && !body.trim()) {
    return { ok: false, error: "Enter a title or message." };
  }

  const payload = {
    title: title.trim() || "DailyOS",
    body: body.trim(),
    url: "/today",
  };

  const sent = await broadcastToAll(payload);
  return { ok: true, sent };
}

export async function getPushStats(): Promise<{
  configured: boolean;
  totalSubscriptions: number;
}> {
  // Admin guard
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return { configured: false, totalSubscriptions: 0 };
  }

  const configured = pushConfigured();
  const admin = createServiceClient();
  const { count } = await admin
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true });

  return { configured, totalSubscriptions: count ?? 0 };
}
