"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

export async function revokeCode(code: string) {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("reward_codes").delete().eq("code", code);
  revalidatePath("/admin/codes");
  return { ok: true as const };
}
