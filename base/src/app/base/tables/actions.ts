"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

/** Delete one row by its `id`. Only works on tables that have an `id` column. */
export async function deleteRow(
  table: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createServiceClient();
  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
