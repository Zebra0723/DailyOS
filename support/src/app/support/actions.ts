"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

export async function setResolved(id: string, resolved: boolean): Promise<{ ok: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("feedback").update({ resolved }).eq("id", id);
  return { ok: true };
}

export async function deleteFeedback(id: string): Promise<{ ok: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("feedback").delete().eq("id", id);
  return { ok: true };
}
