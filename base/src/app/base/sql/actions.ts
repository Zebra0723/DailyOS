"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { runSql, type SqlResult } from "@/lib/management";
import { SETUP_SQL } from "@/lib/migrations";
import {
  readSqlStore,
  saveNamedQuery,
  deleteNamedQuery,
  appendHistory,
  type SqlStore,
} from "@/lib/sql-store";

export async function runSqlAction(query: string): Promise<SqlResult> {
  await requireAdminUser();
  if (!query.trim()) return { ok: false, error: "Enter some SQL." };
  const res = await runSql(query);
  // Record successful runs to history; best-effort, never blocks the result.
  if (res.ok) {
    try {
      await appendHistory(query);
    } catch {
      /* history is a convenience — ignore failures */
    }
  }
  return res;
}

export async function applySetupAction(): Promise<SqlResult> {
  await requireAdminUser();
  return runSql(SETUP_SQL);
}

/** Load the saved-queries + history store for the console. */
export async function getSqlStoreAction(): Promise<SqlStore> {
  await requireAdminUser();
  return readSqlStore();
}

export async function saveQueryAction(name: string, sql: string): Promise<SqlStore> {
  await requireAdminUser();
  return saveNamedQuery(name, sql);
}

export async function deleteQueryAction(name: string): Promise<SqlStore> {
  await requireAdminUser();
  return deleteNamedQuery(name);
}
