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

export async function setResolvedMany(
  ids: string[],
  resolved: boolean,
): Promise<{ ok: boolean; count: number }> {
  await requireAdminUser();
  if (ids.length === 0) return { ok: true, count: 0 };
  const admin = createServiceClient();
  await admin.from("feedback").update({ resolved }).in("id", ids);
  return { ok: true, count: ids.length };
}

export async function deleteFeedbackMany(
  ids: string[],
): Promise<{ ok: boolean; count: number }> {
  await requireAdminUser();
  if (ids.length === 0) return { ok: true, count: 0 };
  const admin = createServiceClient();
  await admin.from("feedback").delete().in("id", ids);
  return { ok: true, count: ids.length };
}
