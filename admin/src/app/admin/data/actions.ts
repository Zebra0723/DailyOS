"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

export const DATA_TABLES = [
  "inbox_items",
  "extracted_tasks",
  "calendar_events",
  "notes",
  "vault_items",
  "push_subscriptions",
  "reward_codes",
] as const;

export type DataTable = (typeof DATA_TABLES)[number];

/** Delete one row from an allow-listed table. */
export async function deleteRow(table: DataTable, id: string) {
  await requireAdminUser();
  if (!DATA_TABLES.includes(table)) return { ok: false as const };
  const admin = createServiceClient();
  await admin.from(table).delete().eq("id", id);
  revalidatePath("/admin/data");
  return { ok: true as const };
}
