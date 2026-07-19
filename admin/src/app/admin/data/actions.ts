"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { DATA_TABLES, type DataTable } from "./tables";

/** Delete one row from an allow-listed table. */
export async function deleteRow(table: DataTable, id: string) {
  await requireAdminUser();
  if (!DATA_TABLES.includes(table)) return { ok: false as const };
  const admin = createServiceClient();
  await admin.from(table).delete().eq("id", id);
  revalidatePath("/admin/data");
  return { ok: true as const };
}
