"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAudit } from "@/lib/audit";
import { DATA_TABLES, type DataTable } from "./tables";

export async function deleteRow(table: DataTable, id: string) {
  const user = await requireAdminUser();
  if (!DATA_TABLES.includes(table)) return { ok: false as const };
  const admin = createServiceClient();
  await admin.from(table).delete().eq("id", id);
  await logAudit(user.email, "delete-row", `${table}/${id}`);
  revalidatePath("/admin/data");
  return { ok: true as const };
}
