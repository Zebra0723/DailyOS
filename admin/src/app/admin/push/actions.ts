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
