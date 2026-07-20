import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

// Persists SQL-console saved queries + run history in the existing app_config
// key/value JSON table, under the single key `base_sql`. No schema change.
// value shape: { saved: [{name, sql}], history: [{sql, at}] }

const KEY = "base_sql";
const HISTORY_CAP = 20;

export interface SavedQuery {
  name: string;
  sql: string;
}
export interface HistoryEntry {
  sql: string;
  at: string;
}
export interface SqlStore {
  saved: SavedQuery[];
  history: HistoryEntry[];
}

function empty(): SqlStore {
  return { saved: [], history: [] };
}

function normalize(value: unknown): SqlStore {
  const v = (value ?? {}) as Partial<SqlStore>;
  const saved = Array.isArray(v.saved)
    ? v.saved
        .filter((s): s is SavedQuery => Boolean(s && typeof s.name === "string" && typeof s.sql === "string"))
        .map((s) => ({ name: s.name, sql: s.sql }))
    : [];
  const history = Array.isArray(v.history)
    ? v.history
        .filter((h): h is HistoryEntry => Boolean(h && typeof h.sql === "string" && typeof h.at === "string"))
        .map((h) => ({ sql: h.sql, at: h.at }))
    : [];
  return { saved, history };
}

/** Read the store. Never throws — returns an empty store on any failure
 *  (missing table, no config, RLS, etc.) so the console degrades gracefully. */
export async function readSqlStore(): Promise<SqlStore> {
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("app_config")
      .select("value")
      .eq("key", KEY)
      .maybeSingle();
    if (error || !data) return empty();
    return normalize(data.value);
  } catch {
    return empty();
  }
}

async function writeSqlStore(store: SqlStore): Promise<boolean> {
  try {
    const admin = createServiceClient();
    const { error } = await admin
      .from("app_config")
      .upsert(
        { key: KEY, value: store, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    return !error;
  } catch {
    return false;
  }
}

/** Save (or overwrite) a named query. Returns the updated store. */
export async function saveNamedQuery(name: string, sql: string): Promise<SqlStore> {
  const store = await readSqlStore();
  const trimmed = name.trim();
  if (!trimmed || !sql.trim()) return store;
  const saved = store.saved.filter((s) => s.name !== trimmed);
  saved.unshift({ name: trimmed, sql });
  const next = { ...store, saved };
  await writeSqlStore(next);
  return next;
}

/** Delete a saved query by name. Returns the updated store. */
export async function deleteNamedQuery(name: string): Promise<SqlStore> {
  const store = await readSqlStore();
  const next = { ...store, saved: store.saved.filter((s) => s.name !== name) };
  await writeSqlStore(next);
  return next;
}

/** Prepend a run to history, de-duping consecutive repeats, capped. */
export async function appendHistory(sql: string): Promise<SqlStore> {
  const store = await readSqlStore();
  const clean = sql.trim();
  if (!clean) return store;
  const rest = store.history.filter((h) => h.sql !== clean);
  const history = [{ sql: clean, at: new Date().toISOString() }, ...rest].slice(0, HISTORY_CAP);
  const next = { ...store, history };
  await writeSqlStore(next);
  return next;
}
