import { createServiceClient } from "@/lib/supabase/service";

/** Best-effort audit log. No-op if the admin_audit table isn't set up yet. */
export async function logAudit(actor: string | null | undefined, action: string, detail: string) {
  try {
    const admin = createServiceClient();
    await admin.from("admin_audit").insert({ actor: actor ?? "admin", action, detail });
  } catch {
    /* table may not exist yet */
  }
}
