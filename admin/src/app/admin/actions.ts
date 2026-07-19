"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import webpush from "web-push";

type Tier = "free" | "plus" | "pro";

/** Set a user's plan tier (mirrors what the DailyOS app reads from metadata). */
export async function setUserPlan(userId: string, tier: Tier) {
  await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, tier, plan: tier, pro: tier === "pro" },
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** Grant or revoke the in-app admin flag. */
export async function setUserAdmin(userId: string, makeAdmin: boolean) {
  await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, admin: makeAdmin },
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** Suspend (ban) or un-suspend an account. A suspended user can't sign in. */
export async function setUserSuspended(userId: string, suspend: boolean) {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.auth.admin.updateUserById(userId, {
    // ~100 years to suspend; "none" lifts it.
    ban_duration: suspend ? "876000h" : "none",
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** Permanently delete a user account. */
export async function deleteUser(userId: string) {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

type PushRow = { endpoint: string; p256dh: string; auth: string };

/** Send a push notification to one user's devices. */
export async function sendUserPush(
  userId: string,
  title: string,
  body: string,
): Promise<{ ok: boolean; sent?: number; error?: string }> {
  await requireAdminUser();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return { ok: false, error: "VAPID keys aren't set on this project." };
  if (!title.trim() && !body.trim()) return { ok: false, error: "Enter a title or message." };

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://daily-os-lac.vercel.app", pub, priv);
  const admin = createServiceClient();
  const { data } = await admin.from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", userId);
  const subs = (data ?? []) as PushRow[];
  const payload = JSON.stringify({ title: title.trim() || "DailyOS", body: body.trim(), url: "/today" });

  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );
  if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", dead);
  return { ok: true, sent };
}
