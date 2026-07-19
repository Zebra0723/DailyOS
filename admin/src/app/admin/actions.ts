"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAudit } from "@/lib/audit";
import webpush from "web-push";

type Tier = "free" | "plus" | "pro";

export async function setUserPlan(userId: string, tier: Tier) {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(userId, { user_metadata: { ...meta, tier, plan: tier, pro: tier === "pro" } });
  await logAudit(user.email, "set-plan", `${data.user?.email ?? userId} → ${tier}`);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function setUserAdmin(userId: string, makeAdmin: boolean) {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(userId, { user_metadata: { ...meta, admin: makeAdmin } });
  await logAudit(user.email, "set-admin", `${data.user?.email ?? userId} → admin=${makeAdmin}`);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function setUserSuspended(userId: string, suspend: boolean) {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: suspend ? "876000h" : "none" });
  await logAudit(user.email, suspend ? "suspend" : "unsuspend", data.user?.email ?? userId);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

export async function deleteUser(userId: string) {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  await admin.auth.admin.deleteUser(userId);
  await logAudit(user.email, "delete-user", data.user?.email ?? userId);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

type PushRow = { endpoint: string; p256dh: string; auth: string };

export async function sendUserPush(userId: string, title: string, body: string): Promise<{ ok: boolean; sent?: number; error?: string }> {
  const user = await requireAdminUser();
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
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload); sent++; }
    catch (err: unknown) { const code = (err as { statusCode?: number })?.statusCode; if (code === 404 || code === 410) dead.push(s.endpoint); }
  }));
  if (dead.length) await admin.from("push_subscriptions").delete().in("endpoint", dead);
  await logAudit(user.email, "push-user", `${userId} → ${sent} device(s)`);
  return { ok: true, sent };
}
