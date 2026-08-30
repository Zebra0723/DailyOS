"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAudit } from "@/lib/audit";

export async function saveConfig(
  announcement: string,
  maintenance: boolean,
  maintenanceAllowlist?: string[],
) {
  const user = await requireAdminUser();
  const admin = createServiceClient();

  // Merge onto the existing config, don't replace it. The main app writes other
  // keys to this same row (hiddenBanners, etc.); a blind upsert of just
  // {announcement, maintenance} silently wiped them.
  const { data: existing } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "global")
    .maybeSingle();
  const current = (existing?.value ?? {}) as Record<string, unknown>;

  // Only these accounts can still sign in while maintenance is on — normalised
  // (lowercased, de-duped, blanks dropped) so the app's email check is stable.
  const allowlist = Array.from(
    new Set(
      (maintenanceAllowlist ?? [])
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const { error } = await admin.from("app_config").upsert({
    key: "global",
    value: {
      ...current,
      announcement: announcement.trim(),
      maintenance,
      maintenanceAllowlist: allowlist,
    },
  });
  if (error) return { ok: false as const, error: error.message };
  await logAudit(
    user.email,
    "settings",
    `announcement="${announcement.trim().slice(0, 60)}" maintenance=${maintenance} allowlist=${allowlist.length}`,
  );
  revalidatePath("/admin/settings");
  return { ok: true as const };
}
