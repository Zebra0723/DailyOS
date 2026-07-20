"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Trash2 } from "lucide-react";
import { deleteRow } from "@/app/base/tables/actions";
import { ConfirmButton } from "@/components/confirm-button";

function preview(row: Record<string, unknown>): string {
  const keys = ["title", "content", "text", "email", "name", "summary", "code", "key"];
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.slice(0, 80);
  }
  return String(row.id ?? JSON.stringify(row)).slice(0, 80);
}

export function TableBrowser({
  tables,
  current,
  rows,
  error,
}: {
  tables: string[];
  current: string;
  rows: Record<string, unknown>[];
  error: string | null;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState<Record<string, unknown> | null>(null);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
  }, [q, rows]);

  return (
    <div className="grid gap-4">
      {/* Table picker */}
      <div className="flex flex-wrap gap-1.5">
        {tables.map((t) => (
          <button
            key={t}
            onClick={() => router.push(`/base/tables?t=${t}`)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              t === current ? "bg-[#0d9488] text-white" : "border border-[#e6ded2] bg-[#fffdf9] text-[#4b443b] hover:border-[#0d9488]"
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a8073]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${filtered.length} row${filtered.length === 1 ? "" : "s"}…`}
              className="h-10 w-full rounded-lg border border-[#d9d2c6] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#0d9488]"
            />
          </div>

          <div className="grid gap-1.5">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#8a8073]">No rows.</p>
            ) : (
              filtered.map((row, i) => (
                <button
                  key={(row.id as string) ?? i}
                  onClick={() => setOpen(row)}
                  className="flex items-center gap-2 rounded-xl border border-[#e6ded2] bg-[#fffdf9] px-3 py-2 text-left text-sm hover:border-[#0d9488]"
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
            {typeof open.id === "string" && (
              <div className="mt-4 flex justify-end">
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
