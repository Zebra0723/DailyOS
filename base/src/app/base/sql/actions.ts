"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { runSql, type SqlResult } from "@/lib/management";
import { SETUP_SQL } from "@/lib/migrations";

export async function runSqlAction(query: string): Promise<SqlResult> {
  await requireAdminUser();
  if (!query.trim()) return { ok: false, error: "Enter some SQL." };
  return runSql(query);
}

export async function applySetupAction(): Promise<SqlResult> {
  await requireAdminUser();
  return runSql(SETUP_SQL);
}
