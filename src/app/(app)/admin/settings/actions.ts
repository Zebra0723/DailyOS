"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";

export async function saveConfig(
  announcement: string,
  maintenance: boolean,
  hiddenBanners?: string[],
  maintenanceAllowlist?: string[],
): Promise<{ ok: boolean; error?: string }> {
  // Admin guard
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return { ok: false, error: "Unauthorized." };
  }

  // Normalise the allowlist: lowercase, de-duped, blanks dropped. These are the
  // accounts that can still sign in while everyone else sees the maintenance
  // screen, so store them in a stable, comparable form.
  const allowlist = Array.from(
    new Set(
      (maintenanceAllowlist ?? [])
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const admin = createServiceClient();
  const { error } = await admin.from("app_config").upsert({
    key: "global",
    value: {
      announcement: announcement.trim(),
      maintenance,
      maintenanceAllowlist: allowlist,
      ...(hiddenBanners ? { hiddenBanners } : {}),
    },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true };
}
