"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

type Tier = "free" | "plus" | "pro";

/** Set a user's plan tier (mirrors what the DailyOS app reads from metadata). */
export async function setUserPlan(userId: string, tier: Tier) {
  await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, tier, plan: tier, pro: tier === "pro" },
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** Grant or revoke the in-app admin flag. */
export async function setUserAdmin(userId: string, makeAdmin: boolean) {
  await requireAdminUser();
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const meta = data.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...meta, admin: makeAdmin },
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** Suspend (ban) or un-suspend an account. A suspended user can't sign in. */
export async function setUserSuspended(userId: string, suspend: boolean) {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.auth.admin.updateUserById(userId, {
    // ~100 years to suspend; "none" lifts it.
    ban_duration: suspend ? "876000h" : "none",
  });
  revalidatePath("/admin/users");
  return { ok: true as const };
}

/** Permanently delete a user account. */
export async function deleteUser(userId: string) {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
  return { ok: true as const };
}
