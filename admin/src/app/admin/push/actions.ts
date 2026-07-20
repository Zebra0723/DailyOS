"use server";

import webpush from "web-push";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

type Row = { endpoint: string; p256dh: string; auth: string };

export async function sendBroadcast(
  title: string,
  body: string,
): Promise<{ ok: boolean; sent?: number; error?: string }> {
  await requireAdminUser();
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    return { ok: false, error: "VAPID keys aren't set on this project (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)." };
  }
  if (!title.trim() && !body.trim()) return { ok: false, error: "Enter a title or message." };

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "https://daily-os-lac.vercel.app",
    pub,
    priv,
  );

  const admin = createServiceClient();
  const { data } = await admin.from("push_subscriptions").select("endpoint,p256dh,auth");
  const subs = (data ?? []) as Row[];
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

export type ScheduledPush = {
  id: string;
  title: string;
  body: string;
  send_at: string;
};

/** Queue a broadcast to go out at a future time. The main app's cron scans the
 *  scheduled_pushes table every minute and sends any that are due. */
export async function scheduleBroadcast(
  title: string,
  body: string,
  sendAtIso: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdminUser();
  if (!title.trim() && !body.trim()) return { ok: false, error: "Enter a title or message." };
  const when = Date.parse(sendAtIso);
  if (!Number.isFinite(when)) return { ok: false, error: "Pick a valid date and time." };
  if (when < Date.now() - 60_000) return { ok: false, error: "That time is in the past." };

  const admin = createServiceClient();
  const { error } = await admin.from("scheduled_pushes").insert({
    title: title.trim() || "DailyOS",
    body: body.trim(),
    url: "/today",
    send_at: new Date(when).toISOString(),
    created_by: user.email ?? null,
  });
  if (error) {
    return {
      ok: false,
      error:
        "Couldn't schedule — is the scheduled_pushes table set up? (" +
        error.message +
        ")",
    };
  }
  return { ok: true };
}

/** Upcoming, not-yet-sent scheduled broadcasts (soonest first). */
export async function listScheduled(): Promise<ScheduledPush[]> {
  await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin
    .from("scheduled_pushes")
    .select("id,title,body,send_at")
    .eq("sent", false)
    .order("send_at", { ascending: true });
  return (data ?? []) as ScheduledPush[];
}

/** Cancel a queued broadcast before it sends. */
export async function cancelScheduled(id: string): Promise<{ ok: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  const { error } = await admin
    .from("scheduled_pushes")
    .delete()
    .eq("id", id)
    .eq("sent", false);
  return { ok: !error };
}
