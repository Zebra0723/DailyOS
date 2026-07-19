"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

export async function addReminder(text: string) {
  const user = await requireAdminUser();
  if (!text.trim()) return { ok: false as const };
  const admin = createServiceClient();
  await admin.from("admin_reminders").insert({ text: text.trim(), created_by: user.email });
  revalidatePath("/admin/reminders");
  return { ok: true as const };
}

export async function toggleReminder(id: string, done: boolean) {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("admin_reminders").update({ done }).eq("id", id);
  revalidatePath("/admin/reminders");
  return { ok: true as const };
}

export async function deleteReminder(id: string) {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("admin_reminders").delete().eq("id", id);
  revalidatePath("/admin/reminders");
  return { ok: true as const };
}
