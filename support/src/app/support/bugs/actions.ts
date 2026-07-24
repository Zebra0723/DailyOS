"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

/** Toggle a bug report between 'open' and 'resolved'. Admin-gated. */
export async function setBugStatus(id: string, status: "open" | "resolved"): Promise<{ ok: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("bug_reports").update({ status }).eq("id", id);
  return { ok: true };
}

/** Permanently delete a bug report. Admin-gated. */
export async function deleteBug(id: string): Promise<{ ok: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("bug_reports").delete().eq("id", id);
  return { ok: true };
}
