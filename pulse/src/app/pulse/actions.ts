"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { runCron } from "@/lib/main";

export async function runCronAction(): Promise<{ ok: boolean; status?: number; error?: string }> {
  await requireAdminUser();
  return runCron();
}

/** Save the app-wide announcement banner + maintenance mode (app_config.global). */
export async function saveOpsConfig(
  announcement: string,
  maintenance: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createServiceClient();
  const { error } = await admin
    .from("app_config")
    .upsert({ key: "global", value: { announcement: announcement.trim(), maintenance } });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
