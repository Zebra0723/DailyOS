import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { sendToUser, type PushPayload } from "@/lib/push-server";

// Owner/admin accounts that should get operational push alerts (e.g. new
// feedback). Overridable via ADMIN_EMAILS (comma-separated); defaults to the
// same owners the behind-the-scenes admin apps are gated to.
const OWNER_EMAILS = (
  process.env.ADMIN_EMAILS ?? "arjunvirjain@icloud.com,leonardo.mcnicol@icloud.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Push a notification to every admin/owner device, via the app's existing Web
 * Push system (VAPID keys + push_subscriptions). Best-effort: never throws, and
 * silently does nothing if push isn't configured or no admin has a device.
 * Returns the number of devices delivered to.
 */
export async function notifyAdmins(payload: PushPayload): Promise<number> {
  try {
    const admin = createServiceClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = data?.users ?? [];
    const adminIds = users
      .filter(
        (u) =>
          (u.user_metadata as { admin?: boolean } | null)?.admin === true ||
          OWNER_EMAILS.includes((u.email ?? "").toLowerCase()),
      )
      .map((u) => u.id);

    let delivered = 0;
    for (const id of adminIds) delivered += await sendToUser(id, payload);
    return delivered;
  } catch {
    return 0;
  }
}
