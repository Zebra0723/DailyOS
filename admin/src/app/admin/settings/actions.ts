"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAudit } from "@/lib/audit";

export async function saveConfig(announcement: string, maintenance: boolean) {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  const { error } = await admin.from("app_config").upsert({
    key: "global",
    value: { announcement: announcement.trim(), maintenance },
  });
  if (error) return { ok: false as const, error: error.message };
  await logAudit(user.email, "settings", `announcement="${announcement.trim().slice(0, 60)}" maintenance=${maintenance}`);
  revalidatePath("/admin/settings");
  return { ok: true as const };
}
