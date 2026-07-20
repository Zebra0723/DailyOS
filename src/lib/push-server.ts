import "server-only";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/server";

// Server-side Web Push sending. Configured from environment:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY   the VAPID public key (also used client-side)
//   VAPID_PRIVATE_KEY              the VAPID private key (secret)
//   VAPID_SUBJECT                  optional mailto:/https: contact (default below)
//
// If the keys aren't set, sending is a no-op — nothing throws.

export type PushPayload = {
  title: string;
  body: string;
  /** Where clicking the notification should take the user. */
  url?: string;
  /** Collapses/replaces notifications that share a tag. */
  tag?: string;
};

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  // VAPID "subject" is just a contact the push service can use. It must be a
  // mailto: or an https: URL — we default to the site URL (no email needed).
  const subject =
    process.env.VAPID_SUBJECT ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://daily-os-lac.vercel.app";
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

/** True once VAPID keys are present — lets callers tell "off" from "no devices". */
export function pushConfigured(): boolean {
  return ensureConfigured();
}

type SubRow = { endpoint: string; p256dh: string; auth: string };

/**
 * Send one notification to every device a user has opted in from. Returns the
 * number of devices successfully delivered to. Subscriptions the push service
 * reports as gone (404/410) are pruned so we stop trying them.
 */
export async function sendToUser(
  userId: string,
  payload: PushPayload,
): Promise<number> {
  if (!ensureConfigured()) return 0;
  const admin = createServiceClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("user_id", userId);
  if (!subs || subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let delivered = 0;
  const dead: string[] = [];

  await Promise.all(
    (subs as SubRow[]).map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          body,
        );
        delivered++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );

  if (dead.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", dead);
  }
  return delivered;
}

/**
 * Broadcast a notification to EVERY subscribed device (all users). Used for
 * admin-scheduled broadcasts. Returns the number delivered; prunes dead endpoints.
 */
export async function broadcastToAll(
  payload: PushPayload,
  onlyUserIds?: Set<string>,
): Promise<number> {
  if (!ensureConfigured()) return 0;
  const admin = createServiceClient();
  const { data } = await admin
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth,user_id");
  let subs = (data ?? []) as (SubRow & { user_id: string })[];
  // Restrict to a specific set of users (e.g. a plan-tier audience).
  if (onlyUserIds) subs = subs.filter((s) => onlyUserIds.has(s.user_id));
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let delivered = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        delivered++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );
  if (dead.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", dead);
  }
  return delivered;
}

/**
 * Send a notification to a user only once, ever, for a given dedupe key. Uses
 * the push_log ledger: we INSERT first and only send if the row was new, so a
 * cron running every hour can't send the same nudge twice. Returns true if it
 * actually sent.
 */
export async function sendOnce(
  userId: string,
  dedupeKey: string,
  payload: PushPayload,
): Promise<boolean> {
  if (!ensureConfigured()) return false;
  const admin = createServiceClient();
  // Claim the key. A duplicate (already sent) errors on the PK and we bail.
  const { error } = await admin
    .from("push_log")
    .insert({ user_id: userId, dedupe_key: dedupeKey });
  if (error) return false; // already logged → already sent
  const delivered = await sendToUser(userId, payload);
  if (delivered === 0) {
    // No live devices — drop the ledger row so it can fire once they subscribe.
    await admin
      .from("push_log")
      .delete()
      .eq("user_id", userId)
      .eq("dedupe_key", dedupeKey);
  }
  return delivered > 0;
}
