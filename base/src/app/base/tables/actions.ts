"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { runSql, type SqlResult } from "@/lib/management";
import { quoteIdent, quoteLiteral, literalFor, type FieldValue } from "@/lib/sql-format";

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

/** How many rows match a simple `column = value` filter? Preview before a
 *  bulk delete. Value is compared as text (::text) so it works for any type. */
export async function countByFilter(
  table: string,
  column: string,
  value: string,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  await requireAdminUser();
  if (!column) return { ok: false, error: "Pick a column." };
  const sql = `select count(*)::int as n from public.${quoteIdent(table)} where ${quoteIdent(
    column,
  )}::text = ${quoteLiteral(value)};`;
  const res = await runSql(sql);
  if (!res.ok) return { ok: false, error: res.error };
  const n = res.rows?.[0]?.n;
  return { ok: true, count: typeof n === "number" ? n : Number(n ?? 0) };
}

/** Delete every row matching a simple `column = value` filter. */
export async function bulkDeleteByFilter(
  table: string,
  column: string,
  value: string,
): Promise<SqlResult> {
  await requireAdminUser();
  if (!column) return { ok: false, error: "Pick a column." };
  const sql = `delete from public.${quoteIdent(table)} where ${quoteIdent(
    column,
  )}::text = ${quoteLiteral(value)};`;
  return runSql(sql);
}
