"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { MAIN_APP_URL } from "@/lib/hub";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/** Fire the live app's push cron endpoint on demand. Requires CRON_SECRET. */
export async function runCronNow(): Promise<ActionResult> {
  await requireAdminUser();
  const key = process.env.CRON_SECRET;
  if (!key) return { ok: false, message: "CRON_SECRET is not set — cron trigger disabled." };
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/push/run?key=${encodeURIComponent(key)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const text = (await res.text()).trim().slice(0, 300);
    if (!res.ok) return { ok: false, message: `HTTP ${res.status}${text ? ` — ${text}` : ""}` };
    return { ok: true, message: text || "Cron ran." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Request failed." };
  }
}

/** Flip the global maintenance flag in app_config → returns the new state. */
export async function toggleMaintenance(): Promise<ActionResult & { maintenance: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  try {
    const { data } = await admin.from("app_config").select("value").eq("key", "global").maybeSingle();
    const value = (data?.value ?? {}) as Record<string, unknown>;
    const next = !value.maintenance;
    const { error } = await admin
      .from("app_config")
      .upsert({ key: "global", value: { ...value, maintenance: next } }, { onConflict: "key" });
    if (error) return { ok: false, maintenance: !next, message: error.message };
    revalidatePath("/hub");
    return { ok: true, maintenance: next, message: next ? "Maintenance mode is now ON." : "Maintenance mode is now off." };
  } catch (e) {
    return { ok: false, maintenance: false, message: e instanceof Error ? e.message : "Update failed." };
  }
}
