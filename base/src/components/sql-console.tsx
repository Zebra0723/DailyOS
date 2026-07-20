"use client";

import * as React from "react";
import { Play, Loader2, Wand2, CheckCircle2, AlertTriangle, Star, History, Bookmark, Trash2 } from "lucide-react";
import {
  runSqlAction,
  applySetupAction,
  getSqlStoreAction,
  saveQueryAction,
  deleteQueryAction,
} from "@/app/base/sql/actions";
import { ConfirmButton } from "@/components/confirm-button";
import type { SqlResult } from "@/lib/management";
import type { SqlStore } from "@/lib/sql-store";

const teal = "#bf502b";

const SNIPPETS: { label: string; sql: string }[] = [
  {
    label: "Row counts (all tables)",
    sql: "select relname as table, n_live_tup as est_rows\n  from pg_stat_user_tables\n order by n_live_tup desc;",
  },
  {
    label: "Table sizes",
    sql: "select relname as table, pg_size_pretty(pg_total_relation_size(relid)) as size\n  from pg_stat_user_tables\n order by pg_total_relation_size(relid) desc;",
  },
  {
    label: "List policies",
    sql: "select schemaname, tablename, policyname, cmd, roles\n  from pg_policies\n order by tablename, policyname;",
  },
  {
    label: "Recent signups",
    sql: "select email, created_at, last_sign_in_at\n  from auth.users\n order by created_at desc\n limit 25;",
  },
  {
    label: "Biggest tables by rows",
    sql: "select schemaname, relname as table, n_live_tup as rows\n  from pg_stat_user_tables\n order by n_live_tup desc\n limit 20;",
  },
];

export function SqlConsole({
  configured,
  migrations,
}: {
  configured: boolean;
  migrations: string[];
}) {
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<SqlResult | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const [store, setStore] = React.useState<SqlStore>({ saved: [], history: [] });

  const isSelect = /^\s*select\b/i.test(query);

  const loadStore = React.useCallback(() => {
    getSqlStoreAction()
      .then(setStore)
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (configured) loadStore();
  }, [configured, loadStore]);

  async function run() {
    setBusy(true);
    setNote(null);
    setResult(null);
    try {
      const r = await runSqlAction(query);
      setResult(r);
      if (r.ok) loadStore();
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrent() {
    if (!query.trim()) return;
    const name = window.prompt("Name this query:");
    if (!name || !name.trim()) return;
    try {
      setStore(await saveQueryAction(name.trim(), query));
      setNote(`Saved query “${name.trim()}”.`);
    } catch {
      setNote("Couldn’t save the query.");
    }
  }

  async function removeSaved(name: string) {
    try {
      setStore(await deleteQueryAction(name));
    } catch {
      /* ignore */
    }
  }

  function fill(sql: string) {
    setQuery(sql);
    setResult(null);
    setNote(null);
  }

  async function applySetup() {
    setBusy(true);
    setNote(null);
    setResult(null);
    try {
      const r = await applySetupAction();
      setResult(r);
      if (r.ok) setNote("Setup applied ✓ — all DailyOS tables are now in place.");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-[#f0c4bd] bg-[#fbe9e7] p-4 text-sm text-[#9a3412]">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4" /> SQL runner not configured
        </p>
        <p className="mt-1">
          Add <code>SUPABASE_PROJECT_REF</code> and <code>SUPABASE_ACCESS_TOKEN</code>{" "}
          (a personal access token from supabase.com/dashboard/account/tokens) to this
          project&apos;s environment, then redeploy.
        </p>
      </div>
    );
  }

  const cols = result?.rows?.length ? Object.keys(result.rows[0]) : [];

  return (
    <div className="grid gap-4">
      {/* One-tap setup */}
      <div className="rounded-2xl border border-[#a7d8d3] bg-[#e0f2f1] p-4">
        <div className="flex items-center gap-2">
          <Wand2 className="size-4" style={{ color: teal }} />
          <h2 className="text-base font-bold">Apply DailyOS setup</h2>
        </div>
        <p className="mt-1 text-sm text-[#4b443b]">
          Creates every table DailyOS needs (idempotent — safe to run anytime):
        </p>
        <ul className="mt-2 grid gap-1 text-xs text-[#4b443b]">
          {migrations.map((m) => (
            <li key={m} className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 shrink-0" style={{ color: teal }} /> {m}
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <ConfirmButton
            label={busy ? "Working…" : "Apply setup"}
            style={{ background: teal, color: "#fff", border: 0, borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            title="Apply DailyOS setup?"
            message="Runs all setup migrations on your database. Existing tables are left untouched."
            confirmLabel="Apply setup"
            onConfirm={applySetup}
          />
        </div>
      </div>

      {/* Console */}
      <div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="mr-1 self-center text-xs font-semibold text-[#8a8073]">Snippets:</span>
          {SNIPPETS.map((s) => (
            <button
              key={s.label}
              onClick={() => { setQuery(s.sql); setResult(null); setNote(null); }}
              className="rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1 text-xs font-medium text-[#4b443b] hover:border-[#bf502b]"
            >
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="select * from inbox_items limit 20;"
          spellCheck={false}
          className="h-40 w-full rounded-xl border border-[#d9d2c6] bg-[#0f1720] p-3 font-mono text-sm text-[#f2e6da] outline-none"
        />
        <div className="mt-2 flex items-center gap-2">
          {isSelect || !query.trim() ? (
            <button
              onClick={run}
              disabled={busy || !query.trim()}
              style={{ background: teal, color: "#fff", border: 0, borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: busy || !query.trim() ? 0.6 : 1 }}
              className="inline-flex items-center gap-2"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run
            </button>
          ) : (
            <ConfirmButton
              label={<span className="inline-flex items-center gap-2"><Play className="size-4" /> Run (writes)</span>}
              style={{ display: "inline-flex", background: "#c0392b", color: "#fff", border: 0, borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              title="Run this write query?"
              message="This isn't a SELECT — it may change or delete data / schema."
              warn="Double-check it before running."
              confirmLabel="Run it"
              onConfirm={run}
            />
          )}
          <button
            onClick={saveCurrent}
            disabled={!query.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3 py-2 text-sm font-semibold text-[#4b443b] hover:border-[#bf502b] disabled:opacity-50"
          >
            <Bookmark className="size-4" /> Save
          </button>
          <span className="text-xs text-[#8a8073]">
            {isSelect || !query.trim() ? "Read-only query" : "⚠ Write query"}
          </span>
        </div>
      </div>

      {/* Saved queries + run history */}
      {(store.saved.length > 0 || store.history.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Star className="size-4" style={{ color: teal }} />
              <h3 className="text-sm font-bold">Saved</h3>
            </div>
            {store.saved.length === 0 ? (
              <p className="text-xs text-[#8a8073]">No saved queries yet. Write SQL and hit Save.</p>
            ) : (
              <ul className="grid gap-1.5">
                {store.saved.map((s) => (
                  <li key={s.name} className="flex items-center gap-1.5">
                    <button
                      onClick={() => fill(s.sql)}
                      title={s.sql}
                      className="flex-1 truncate rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1.5 text-left text-xs font-medium text-[#4b443b] hover:border-[#bf502b]"
                    >
                      {s.name}
                    </button>
                    <button
                      onClick={() => removeSaved(s.name)}
                      title="Delete saved query"
                      className="shrink-0 rounded-lg p-1.5 text-[#8a8073] hover:bg-[#f2e6da] hover:text-[#9a3412]"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <History className="size-4" style={{ color: teal }} />
              <h3 className="text-sm font-bold">Recent</h3>
            </div>
            {store.history.length === 0 ? (
              <p className="text-xs text-[#8a8073]">Successful runs show up here.</p>
            ) : (
              <ul className="grid gap-1.5">
                {store.history.map((h, i) => (
                  <li key={i}>
                    <button
                      onClick={() => fill(h.sql)}
                      title={h.sql}
                      className="block w-full truncate rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1.5 text-left font-mono text-[11px] text-[#6b6157] hover:border-[#bf502b]"
                    >
                      {h.sql.replace(/\s+/g, " ").trim()}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {note && (
        <div className="rounded-xl border border-[#a7d8d3] bg-[#e0f2f1] p-3 text-sm font-medium" style={{ color: "#a5401f" }}>
          {note}
        </div>
      )}

      {result && !result.ok && (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          {result.error}
        </div>
      )}

      {result?.ok && (
        <div className="overflow-x-auto rounded-xl border border-[#e6ded2]">
          {result.rows && result.rows.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f2e3d3]">
                <tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-semibold">{c}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={i} className="border-t border-[#efe6d8]">
                    {cols.map((c) => (
                      <td key={c} className="max-w-[240px] truncate px-2.5 py-1.5">
                        {r[c] === null ? "—" : typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-3 text-sm text-[#6b6157]">Done. No rows returned.</p>
          )}
        </div>
      )}
    </div>
  );
}
