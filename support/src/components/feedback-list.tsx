"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2, Mail, Search, Reply, Copy, Clock, Download } from "lucide-react";
import {
  setResolved,
  deleteFeedback,
  setResolvedMany,
  deleteFeedbackMany,
} from "@/app/support/actions";
import { ConfirmButton } from "@/components/confirm-button";

export interface Feedback {
  id: string;
  email: string | null;
  message: string;
  resolved: boolean;
  created_at: string;
}

const SKY = "#bf502b";
type Filter = "open" | "resolved" | "all";

/** Human "3h ago" style age from an ISO timestamp. */
function relativeTime(iso: string, now: number): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

function replyHref(f: Feedback): string {
  const subject = "Re: your DailyOS feedback";
  const quoted = f.message
    .split("\n")
    .map((l) => "> " + l)
    .join("\n");
  const body = `Hi,\n\nThanks for reaching out about DailyOS.\n\n---\nYou wrote:\n${quoted}`;
  return `mailto:${encodeURIComponent(f.email ?? "")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background: "#eef2f5", color: "#4b443b" }}
      title="Copy email address"
    >
      <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy email"}
    </button>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color: SKY }}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-[#8a8073]">{hint}</div>}
    </div>
  );
}

/** Escape a single CSV field per RFC 4180 (quote when it contains
 *  comma, quote, or newline; double up embedded quotes). */
function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(rows: Feedback[]): void {
  const header = ["email", "created_at", "resolved", "message"];
  const lines = [header.join(",")];
  for (const f of rows) {
    lines.push(
      [
        csvField(f.email ?? ""),
        csvField(f.created_at),
        csvField(f.resolved ? "resolved" : "open"),
        csvField(f.message),
      ].join(","),
    );
  }
  // Prepend BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feedback-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Bar histogram of feedback counts per day for the last `days` days. */
function FeedbackHistogram({ items, days = 14 }: { items: Feedback[]; days?: number }) {
  const buckets = React.useMemo(() => {
    const out: { key: string; label: string; count: number }[] = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(start.getDate() - i);
      out.push({
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count: 0,
      });
    }
    const index = new Map(out.map((b, i) => [b.key, i]));
    for (const f of items) {
      const key = new Date(f.created_at);
      if (Number.isNaN(key.getTime())) continue;
      const k = key.toISOString().slice(0, 10);
      const i = index.get(k);
      if (i !== undefined) out[i].count += 1;
    }
    return out;
  }, [items, days]);

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">
          Last {days} days
        </div>
        <div className="text-xs text-[#8a8073]">{total} received</div>
      </div>
      <div className="mt-3 flex h-20 items-end gap-1">
        {buckets.map((b) => (
          <div key={b.key} className="group relative flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full rounded-t-[3px] transition-colors"
              style={{
                height: `${(b.count / max) * 100}%`,
                minHeight: b.count > 0 ? 3 : 1,
                background: b.count > 0 ? SKY : "#ece4d8",
              }}
            />
            <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md bg-[#1c1a17] px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">
              {b.label}: {b.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedbackList({ items }: { items: Feedback[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("open");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  // Compute "now" only after mount to keep relative times out of SSR (avoids
  // hydration mismatch), then tick every minute so ages stay fresh.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const openCount = React.useMemo(() => items.filter((f) => !f.resolved).length, [items]);
  const resolvedCount = items.length - openCount;

  const oldestOpen = React.useMemo(() => {
    let oldest: Feedback | null = null;
    for (const f of items) {
      if (f.resolved) continue;
      if (!oldest || new Date(f.created_at).getTime() < new Date(oldest.created_at).getTime()) {
        oldest = f;
      }
    }
    return oldest;
  }, [items]);

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((f) => {
      if (filter === "open" && f.resolved) return false;
      if (filter === "resolved" && !f.resolved) return false;
      if (!q) return true;
      return (
        f.message.toLowerCase().includes(q) || (f.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  const oldestAge =
    oldestOpen && now !== null ? relativeTime(oldestOpen.created_at, now) : oldestOpen ? "—" : "None";

  // Selection restricted to currently-visible rows (respects filter + search).
  const shownIds = React.useMemo(() => shown.map((f) => f.id), [shown]);
  const selectedVisible = React.useMemo(
    () => shownIds.filter((id) => selected.has(id)),
    [shownIds, selected],
  );
  const selectedItems = React.useMemo(
    () => shown.filter((f) => selected.has(f.id)),
    [shown, selected],
  );
  const allVisibleSelected = shownIds.length > 0 && selectedVisible.length === shownIds.length;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) shownIds.forEach((id) => next.delete(id));
      else shownIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function bulkSetResolved(resolved: boolean) {
    if (selectedVisible.length === 0) return;
    setBusy(true);
    try {
      await setResolvedMany(selectedVisible, resolved);
      clearSelection();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function bulkDelete() {
    if (selectedVisible.length === 0) return;
    setBusy(true);
    try {
      await deleteFeedbackMany(selectedVisible);
      clearSelection();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      {/* Stats header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open" value={String(openCount)} />
        <StatCard label="Resolved" value={String(resolvedCount)} />
        <StatCard label="Total" value={String(items.length)} />
        <StatCard label="Oldest open" value={oldestAge} hint={oldestOpen ? "needs a reply" : "all clear"} />
      </div>

      {/* Feedback-over-time histogram */}
      <FeedbackHistogram items={items} />

      {/* Filter tabs + search */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-1.5">
          {(["open", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
              style={
                f === filter
                  ? { background: SKY, color: "#fff" }
                  : { border: "1px solid #e6ded2", background: "#fffdf9", color: "#4b443b" }
              }
            >
              {f}
              {f === "open" ? ` (${openCount})` : f === "resolved" ? ` (${resolvedCount})` : ` (${items.length})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => downloadCsv(shown)}
          disabled={shown.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
          style={{ border: "1px solid #e6ded2", background: "#fffdf9", color: "#4b443b" }}
          title="Download the filtered list as CSV"
        >
          <Download className="size-3.5" /> Export CSV
        </button>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8a8073]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search message or email…"
            className="w-full rounded-lg border border-[#e6ded2] bg-[#fffdf9] py-1.5 pl-8 pr-2.5 text-xs text-[#4b443b] outline-none focus:border-[#bf502b]"
          />
        </div>
      </div>

      {/* Select-all + bulk actions */}
      {shown.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e6ded2] bg-[#faf6ef] px-3 py-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4b443b]">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              ref={(el) => {
                if (el) el.indeterminate = selectedVisible.length > 0 && !allVisibleSelected;
              }}
              onChange={toggleAllVisible}
              className="size-4 accent-[#bf502b]"
            />
            Select all visible
          </label>
          {selectedVisible.length > 0 ? (
            <>
              <span className="text-xs text-[#8a8073]">{selectedVisible.length} selected</span>
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                <button
                  onClick={() => bulkSetResolved(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                  style={{ background: SKY, color: "#fff" }}
                >
                  <Check className="size-3.5" /> Resolve selected
                </button>
                <button
                  onClick={() => bulkSetResolved(false)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                  style={{ border: "1px solid #e6ded2", background: "#fffdf9", color: "#4b443b" }}
                >
                  <RotateCcw className="size-3.5" /> Reopen selected
                </button>
                <ConfirmButton
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Trash2 className="size-3.5" /> Delete selected ({selectedVisible.length})
                    </span>
                  }
                  style={{
                    display: "inline-flex",
                    background: "#fbe9e7",
                    color: "#9a3412",
                    border: "1px solid #f0c4bd",
                    borderRadius: 10,
                    padding: "5px 10px",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                    opacity: busy ? 0.5 : 1,
                  }}
                  title={`Delete ${selectedVisible.length} message${selectedVisible.length === 1 ? "" : "s"}?`}
                  message="This permanently removes the selected feedback."
                  warn="This can't be undone."
                  confirmLabel={`Delete ${selectedVisible.length}`}
                  onConfirm={bulkDelete}
                />
                <button
                  onClick={clearSelection}
                  disabled={busy}
                  className="text-xs font-semibold text-[#8a8073] underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <span className="text-xs text-[#8a8073]">Select items to resolve, reopen, or delete in bulk.</span>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-[#8a8073]">
          {query.trim() ? "No matches for your search." : "Nothing here."}
        </p>
      ) : (
        <div className="grid gap-2">
          {shown.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border p-3"
              style={{
                borderColor: selected.has(f.id) ? SKY : "#e6ded2",
                background: selected.has(f.id) ? "#fbf1e9" : "#fffdf9",
              }}
            >
              <div className="flex items-center gap-2 text-xs text-[#8a8073]">
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggleOne(f.id)}
                  className="size-4 shrink-0 accent-[#bf502b]"
                  aria-label="Select feedback"
                />
                {f.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3" /> {f.email}
                  </span>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5">
                  {now !== null && (
                    <span className="inline-flex items-center gap-1 text-[#a39a8c]">
                      <Clock className="size-3" /> {relativeTime(f.created_at, now)}
                    </span>
                  )}
                  <span>{new Date(f.created_at).toLocaleString()}</span>
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">{f.message}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={async () => {
                    await setResolved(f.id, !f.resolved);
                    router.refresh();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                  style={f.resolved ? { background: "#eef2f5", color: "#4b443b" } : { background: SKY, color: "#fff" }}
                >
                  {f.resolved ? (
                    <>
                      <RotateCcw className="size-3.5" /> Reopen
                    </>
                  ) : (
                    <>
                      <Check className="size-3.5" /> Resolve
                    </>
                  )}
                </button>
                {f.email && (
                  <>
                    <a
                      href={replyHref(f)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                      style={{ border: "1px solid #bae0f5", background: "#eaf6fd", color: SKY }}
                    >
                      <Reply className="size-3.5" /> Reply
                    </a>
                    <CopyEmailButton email={f.email} />
                  </>
                )}
                <ConfirmButton
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Trash2 className="size-3.5" /> Delete
                    </span>
                  }
                  style={{
                    display: "inline-flex",
                    background: "#fbe9e7",
                    color: "#9a3412",
                    border: "1px solid #f0c4bd",
                    borderRadius: 10,
                    padding: "5px 10px",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                  title="Delete this feedback?"
                  message="This permanently removes the message."
                  warn="This can't be undone."
                  onConfirm={async () => {
                    await deleteFeedback(f.id);
                    router.refresh();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
