"use server";

import type { User } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { effectiveTier } from "@/lib/plan";

/** Build a CSV of every account and return it to the client to download.
 *  Columns: email, created_at, plan (effective tier), admin, plan_exp. */
export async function exportUsersCsv(): Promise<string> {
  await requireAdminUser();
  const admin = createServiceClient();

  const users: User[] = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const batch = data?.users ?? [];
    if (error || batch.length === 0) break;
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  users.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const header = "email,created_at,plan,admin,plan_exp";
  const lines = users.map((u) => {
    const exp = u.user_metadata?.plan_exp;
    const expIso = exp == null || Number(exp) <= 0 ? "" : new Date(Number(exp)).toISOString();
    return [
      esc(u.email),
      esc(u.created_at),
      esc(effectiveTier(u)),
      esc(Boolean(u.user_metadata?.admin)),
      esc(expIso),
    ].join(",");
  });
  return [header, ...lines].join("\n");
}
