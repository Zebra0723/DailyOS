import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { sendToUser, pushConfigured, type PushPayload } from "@/lib/push-server";

// Owner/admin accounts that should get operational push alerts (e.g. new
// feedback). Overridable via ADMIN_EMAILS (comma-separated); defaults to the
// same owners the behind-the-scenes admin apps are gated to.
const OWNER_EMAILS = (
  process.env.ADMIN_EMAILS ?? "arjunvirjain@icloud.com,leonardo.mcnicol@icloud.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

type Admin = ReturnType<typeof createServiceClient>;

/** The user ids of every admin/owner account (by admin flag or the email list). */
async function adminUserIds(admin: Admin): Promise<string[]> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const users = data?.users ?? [];
  return users
    .filter(
      (u) =>
        (u.user_metadata as { admin?: boolean } | null)?.admin === true ||
        OWNER_EMAILS.includes((u.email ?? "").toLowerCase()),
    )
    .map((u) => u.id);
}

/**
 * Push a notification to every admin/owner device, via the app's existing Web
 * Push system (VAPID keys + push_subscriptions). Best-effort: never throws, and
 * silently does nothing if push isn't configured or no admin has a device.
 * Returns the number of devices delivered to.
 */
export async function notifyAdmins(payload: PushPayload): Promise<number> {
  try {
    const admin = createServiceClient();
    const ids = await adminUserIds(admin);
    let delivered = 0;
    for (const id of ids) delivered += await sendToUser(id, payload);
    return delivered;
  } catch {
    return 0;
  }
}

export interface AdminPushDiagnostics {
  vapidConfigured: boolean;
  adminAccounts: number;
  subscribedDevices: number;
  delivered: number;
  error?: string;
}

/**
 * Diagnose the feedback-alert pipeline AND fire a test push. Surfaces exactly
 * where it breaks: VAPID keys missing, no admin account matched, no device
 * subscribed, or delivered=0 (dead subscription).
 */
export async function testAdminPush(): Promise<AdminPushDiagnostics> {
  const vapidConfigured = pushConfigured();
  try {
    const admin = createServiceClient();
    const ids = await adminUserIds(admin);
    let subscribedDevices = 0;
    if (ids.length > 0) {
      const { data } = await admin
        .from("push_subscriptions")
        .select("user_id")
        .in("user_id", ids);
      subscribedDevices = data?.length ?? 0;
    }
    let delivered = 0;
    for (const id of ids) {
      delivered += await sendToUser(id, {
        title: "🔔 DailyOS test alert",
        body: "If you can see this, new-feedback alerts will reach you too.",
        url: "/settings",
        tag: "feedback",
      });
    }
    return { vapidConfigured, adminAccounts: ids.length, subscribedDevices, delivered };
  } catch (e) {
    return {
      vapidConfigured,
      adminAccounts: 0,
      subscribedDevices: 0,
      delivered: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
