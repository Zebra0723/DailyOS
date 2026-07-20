import "server-only";

// Minimal, safe-enough SQL literal helpers for Base's admin-only, single-user
// row editor. We build DML strings for runSql() (the Management API). These are
// NOT a general injection defense — they exist so a stray quote in a value
// can't break (or escape) the statement. Admin-only surface; still, escape.

/** Quote a Postgres identifier (table/column) with double quotes. */
export function quoteIdent(name: string): string {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

/** Quote a value as a SQL literal. `null` → NULL. Everything else becomes a
 *  single-quoted text literal (Postgres implicitly coerces the unknown-typed
 *  literal to the column's real type on INSERT/UPDATE). */
export function quoteLiteral(value: string | null): string {
  if (value === null) return "null";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

/** A single editable field: either an explicit value string, or NULL. */
export type FieldValue = { value: string; isNull: boolean };

export function literalFor(field: FieldValue): string {
  return quoteLiteral(field.isNull ? null : field.value);
}
