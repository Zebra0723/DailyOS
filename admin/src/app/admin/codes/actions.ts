"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAudit } from "@/lib/audit";

export async function revokeCode(code: string) {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("reward_codes").delete().eq("code", code);
  await logAudit(user.email, "revoke-code", code);
  revalidatePath("/admin/codes");
  return { ok: true as const };
}

export async function issueCode(input: {
  kind: "discount" | "plan";
  percent?: number;
  tier?: "plus" | "pro";
  days?: number;
  recipientEmail?: string;
}): Promise<{ ok: boolean; code?: string; error?: string }> {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  const code = "ADM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const row: Record<string, unknown> = { code, kind: input.kind, used: false };
  if (input.kind === "discount") row.percent = input.percent ?? 10;
  else { row.plan_tier = input.tier ?? "plus"; row.plan_days = input.days ?? 0; }
  if (input.recipientEmail?.trim()) row.recipient_email = input.recipientEmail.trim();
  const { error } = await admin.from("reward_codes").insert(row);
  if (error) return { ok: false, error: error.message };
  await logAudit(user.email, "issue-code", `${code} (${input.kind})`);
  revalidatePath("/admin/codes");
  return { ok: true, code };
}
