"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { runSql, type SqlResult } from "@/lib/management";
import { quoteIdent, literalFor, type FieldValue } from "@/lib/sql-format";

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

/** Insert a new row. Only fields present in `fields` are written; everything
 *  else falls back to the column's default. Built as an INSERT via runSql. */
export async function insertRow(
  table: string,
  fields: Record<string, FieldValue>,
): Promise<SqlResult> {
  await requireAdminUser();
  const cols = Object.keys(fields);
  if (cols.length === 0) return { ok: false, error: "Nothing to insert." };
  const columnList = cols.map(quoteIdent).join(", ");
  const valueList = cols.map((c) => literalFor(fields[c])).join(", ");
  const sql = `insert into public.${quoteIdent(table)} (${columnList}) values (${valueList});`;
  return runSql(sql);
}

/** Update one row by id. Only the fields in `fields` are changed. */
export async function updateRow(
  table: string,
  id: string,
  fields: Record<string, FieldValue>,
): Promise<SqlResult> {
  await requireAdminUser();
  const cols = Object.keys(fields);
  if (cols.length === 0) return { ok: false, error: "No changes to save." };
  const setClause = cols
    .map((c) => `${quoteIdent(c)} = ${literalFor(fields[c])}`)
    .join(", ");
  const sql = `update public.${quoteIdent(table)} set ${setClause} where ${quoteIdent(
    "id",
  )} = ${literalFor({ value: id, isNull: false })};`;
  return runSql(sql);
}
