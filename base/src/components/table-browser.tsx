"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Trash2, Plus, Pencil, Save, Loader2, Download, Filter } from "lucide-react";
import {
  deleteRow,
  insertRow,
  updateRow,
  countByFilter,
  bulkDeleteByFilter,
} from "@/app/base/tables/actions";
import { ConfirmButton } from "@/components/confirm-button";

export type ColumnInfo = {
  name: string;
  type: string;
  nullable: boolean;
  hasDefault: boolean;
};

type Field = { value: string; isNull: boolean };

const teal = "#bf502b";

function preview(row: Record<string, unknown>): string {
  const keys = ["title", "content", "text", "email", "name", "summary", "code", "key"];
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.slice(0, 80);
  }
  return String(row.id ?? JSON.stringify(row)).slice(0, 80);
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** RFC-4180-ish CSV cell: always quote, escape embedded quotes by doubling. */
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}

function buildCsv(cols: string[], rows: Record<string, unknown>[]): string {
  const head = cols.map(csvCell).join(",");
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")).join("\r\n");
  return body ? `${head}\r\n${body}` : head;
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Guarded bulk-delete panel: preview the affected count, then confirm. */
function BulkDelete({
  table,
  columns,
  rows,
  onDone,
}: {
  table: string;
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  onDone: () => void;
}) {
  const colNames = React.useMemo(() => {
    if (columns.length) return columns.map((c) => c.name);
    return rows.length ? Object.keys(rows[0]) : [];
  }, [columns, rows]);

  const [open, setOpen] = React.useState(false);
  const [column, setColumn] = React.useState("");
  const [value, setValue] = React.useState("");
  const [count, setCount] = React.useState<number | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!column && colNames.length) setColumn(colNames[0]);
  }, [colNames, column]);

  // Any change to the filter invalidates a stale preview.
  React.useEffect(() => {
    setCount(null);
    setError(null);
  }, [column, value]);

  async function check() {
    setBusy(true);
    setError(null);
    try {
      const r = await countByFilter(table, column, value);
      if (!r.ok) setError(r.error ?? "Couldn’t count rows.");
      else setCount(r.count ?? 0);
    } finally {
      setBusy(false);
    }
  }

  if (colNames.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 text-left text-sm font-semibold text-[#4b443b]"
      >
        <Filter className="size-4" style={{ color: teal }} />
        Bulk delete by filter
        <span className="ml-auto text-xs font-normal text-[#8a8073]">{open ? "hide" : "show"}</span>
      </button>

      {open && (
        <div className="mt-3 grid gap-2">
          <p className="text-xs text-[#8a8073]">
            Deletes every row where <code>column = value</code>. Preview the count first.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              className="h-9 rounded-lg border border-[#d9d2c6] bg-white px-2 text-sm outline-none focus:border-[#bf502b]"
            >
              {colNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="text-sm text-[#8a8073]">=</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="value"
              className="h-9 flex-1 rounded-lg border border-[#d9d2c6] bg-white px-2.5 text-sm outline-none focus:border-[#bf502b]"
            />
            <button
              onClick={check}
              disabled={busy || !column}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3 text-sm font-semibold text-[#4b443b] hover:border-[#bf502b] disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Check count
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-2.5 text-sm text-[#9a3412]">
              {error}
            </div>
          )}

          {count !== null && !error && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#4b443b]">
                <strong>{count}</strong> row{count === 1 ? "" : "s"} match{count === 1 ? "es" : ""}{" "}
                <code>{column} = {value === "" ? "''" : value}</code>.
              </span>
              {count > 0 && (
                <ConfirmButton
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Trash2 className="size-4" /> Delete {count} row{count === 1 ? "" : "s"}
                    </span>
                  }
                  style={{ display: "inline-flex", alignItems: "center", background: "#c0392b", color: "#fff", border: 0, borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
                  title={`Delete ${count} row${count === 1 ? "" : "s"} from ${table}?`}
                  message={`This permanently deletes every row where ${column} = ${value === "" ? "''" : value} in ${table}.`}
                  warn="This can't be undone."
                  confirmLabel={`Delete ${count} row${count === 1 ? "" : "s"}`}
                  onConfirm={async () => {
                    const r = await bulkDeleteByFilter(table, column, value);
                    if (!r.ok) {
                      setError(r.error ?? "Delete failed.");
                      return;
                    }
                    setCount(null);
                    setValue("");
                    onDone();
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Modal form used for both INSERT (row = null) and EDIT (row = the row). */
function RowForm({
  table,
  columns,
  row,
  onClose,
  onSaved,
}: {
  table: string;
  columns: ColumnInfo[];
  row: Record<string, unknown> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = row !== null;

  // Which fields to show: prefer real columns; else fall back to row keys.
  const cols: ColumnInfo[] = React.useMemo(() => {
    if (columns.length) return columns;
    const keys = row ? Object.keys(row) : [];
    return keys.map((k) => ({ name: k, type: "", nullable: true, hasDefault: false }));
  }, [columns, row]);

  const initial = React.useMemo<Record<string, Field>>(() => {
    const out: Record<string, Field> = {};
    for (const c of cols) {
      const raw = row ? row[c.name] : undefined;
      out[c.name] = { value: toStr(raw), isNull: row ? raw === null : false };
    }
    return out;
  }, [cols, row]);

  const [fields, setFields] = React.useState<Record<string, Field>>(initial);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setFields(initial), [initial]);

  function set(name: string, patch: Partial<Field>) {
    setFields((f) => ({ ...f, [name]: { ...f[name], ...patch } }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      if (isEdit) {
        // Only send changed fields.
        const changed: Record<string, Field> = {};
        for (const c of cols) {
          if (c.name === "id") continue;
          const a = initial[c.name];
          const b = fields[c.name];
          if (a.isNull !== b.isNull || a.value !== b.value) changed[c.name] = b;
        }
        if (Object.keys(changed).length === 0) {
          onClose();
          return;
        }
        const res = await updateRow(table, String(row!.id), changed);
        if (!res.ok) { setError(res.error ?? "Update failed."); return; }
      } else {
        // Only send fields the user filled or explicitly nulled.
        const toInsert: Record<string, Field> = {};
        for (const c of cols) {
          const b = fields[c.name];
          if (b.isNull || b.value !== "") toInsert[c.name] = b;
        }
        const res = await insertRow(table, toInsert);
        if (!res.ok) { setError(res.error ?? "Insert failed."); return; }
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">{isEdit ? `Edit row in ${table}` : `New row in ${table}`}</h3>
          <button onClick={onClose} className="text-[#8a8073] hover:text-[#1c1a17]"><X className="size-5" /></button>
        </div>

        {cols.length === 0 ? (
          <p className="text-sm text-[#8a8073]">No column info available for this table.</p>
        ) : (
          <div className="grid gap-3">
            {cols.map((c) => {
              const f = fields[c.name] ?? { value: "", isNull: false };
              const idLocked = isEdit && c.name === "id";
              return (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">
                      {c.name}
                      {c.type ? <span className="ml-1.5 font-normal normal-case text-[#b0a89b]">{c.type}{c.hasDefault ? " · default" : ""}</span> : null}
                    </label>
                    {c.nullable && !idLocked && (
                      <button
                        type="button"
                        onClick={() => set(c.name, { isNull: !f.isNull })}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${f.isNull ? "bg-[#bf502b] text-white" : "border border-[#d9d2c6] text-[#8a8073]"}`}
                      >
                        null
                      </button>
                    )}
                  </div>
                  <input
                    value={f.isNull ? "" : f.value}
                    disabled={f.isNull || idLocked}
                    placeholder={f.isNull ? "NULL" : idLocked ? "(locked)" : c.hasDefault ? "leave blank for default" : ""}
                    onChange={(e) => set(c.name, { value: e.target.value })}
                    className="h-9 w-full rounded-lg border border-[#d9d2c6] bg-white px-2.5 text-sm outline-none focus:border-[#bf502b] disabled:bg-[#f3efe8] disabled:text-[#b0a89b]"
                  />
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{error}</div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-[#eae3d7] px-4 py-2 text-sm font-semibold text-[#1c1a17]">Cancel</button>
          <button
            onClick={save}
            disabled={busy || cols.length === 0}
            style={{ background: teal, opacity: busy ? 0.6 : 1 }}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isEdit ? "Save changes" : "Insert row"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TableBrowser({
  tables,
  current,
  rows,
  error,
  columns,
  canEdit,
}: {
  tables: string[];
  current: string;
  rows: Record<string, unknown>[];
  error: string | null;
  columns: ColumnInfo[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState<Record<string, unknown> | null>(null);
  const [form, setForm] = React.useState<null | { row: Record<string, unknown> | null }>(null);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
  }, [q, rows]);

  function exportCsv() {
    const source = filtered;
    if (source.length === 0) return;
    const cols = columns.length
      ? columns.map((c) => c.name)
      : Array.from(source.reduce<Set<string>>((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set()));
    downloadCsv(`${current}-${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(cols, source));
  }

  return (
    <div className="grid gap-4">
      {/* Table picker */}
      <div className="flex flex-wrap gap-1.5">
        {tables.map((t) => (
          <button
            key={t}
            onClick={() => router.push(`/base/tables?t=${t}`)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              t === current ? "bg-[#bf502b] text-white" : "border border-[#e6ded2] bg-[#fffdf9] text-[#4b443b] hover:border-[#bf502b]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          {error.includes("does not exist") || error.includes("schema cache")
            ? `The "${current}" table doesn't exist yet. Create it from the SQL tab.`
            : error}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8073]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${filtered.length} row${filtered.length === 1 ? "" : "s"}…`}
                className="h-10 w-full rounded-lg border border-[#d9d2c6] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#bf502b]"
              />
            </div>
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              title="Download the shown rows as CSV"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3 text-sm font-semibold text-[#4b443b] hover:border-[#bf502b] disabled:opacity-50"
            >
              <Download className="size-4" /> Export CSV
            </button>
            {canEdit ? (
              <button
                onClick={() => setForm({ row: null })}
                style={{ background: teal }}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white"
              >
                <Plus className="size-4" /> New row
              </button>
            ) : (
              <span className="shrink-0 text-xs text-[#8a8073]" title="Set SUPABASE_PROJECT_REF + SUPABASE_ACCESS_TOKEN to enable inserts/edits">
                Editing needs SQL token
              </span>
            )}
          </div>

          {canEdit && (
            <BulkDelete
              table={current}
              columns={columns}
              rows={rows}
              onDone={() => router.refresh()}
            />
          )}

          <div className="grid gap-1.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#8a8073]">No rows.</p>
            ) : (
              filtered.map((row, i) => (
                <button
                  key={(row.id as string) ?? i}
                  onClick={() => setOpen(row)}
                  className="flex items-center gap-2 rounded-xl border border-[#e6ded2] bg-[#fffdf9] px-3 py-2 text-left text-sm hover:border-[#bf502b]"
                >
                  <span className="flex-1 truncate">{preview(row)}</span>
                  {row.created_at ? (
                    <span className="shrink-0 text-xs text-[#8a8073]">
                      {new Date(String(row.created_at)).toLocaleDateString()}
                    </span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </>
      )}

      {/* Row detail */}
      {open && (
        <div onClick={() => setOpen(null)} className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold">{current}</h3>
              <button onClick={() => setOpen(null)} className="text-[#8a8073] hover:text-[#1c1a17]"><X className="size-5" /></button>
            </div>
            <div className="grid gap-2">
              {Object.entries(open).map(([k, v]) => (
                <div key={k} className="border-b border-[#efe6d8] pb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">{k}</div>
                  <div className="break-words text-sm">
                    {v === null ? <span className="text-[#b0a89b]">null</span> : typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {canEdit && (
                <button
                  onClick={() => { const r = open; setOpen(null); setForm({ row: r }); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#a7d8d3] bg-[#e0f2f1] px-4 py-2 text-sm font-semibold"
                  style={{ color: "#a5401f" }}
                >
                  <Pencil className="size-4" /> Edit
                </button>
              )}
              {typeof open.id === "string" && (
                <ConfirmButton
                  label={<span className="inline-flex items-center gap-1.5"><Trash2 className="size-4" /> Delete row</span>}
                  style={{ display: "inline-flex", alignItems: "center", background: "#fbe9e7", color: "#9a3412", border: "1px solid #f0c4bd", borderRadius: 10, padding: "8px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                  title="Delete this row?"
                  message={`This permanently deletes the row from ${current}.`}
                  warn="This can't be undone."
                  onConfirm={async () => {
                    await deleteRow(current, open.id as string);
                    setOpen(null);
                    router.refresh();
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Insert / edit form */}
      {form && (
        <RowForm
          table={current}
          columns={columns}
          row={form.row}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
