"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2, Mail, Search, Reply, Copy, Clock } from "lucide-react";
import {
  setResolved,
  deleteFeedback,
  setResolvedMany,
  deleteFeedbackMany,
} from "@/app/support/actions";
import { ConfirmButton } from "@/components/confirm-button";
import type { Feedback } from "@/lib/feedback";

export type { Feedback };

const ACCENT = "#bf502b";

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
      style={{ background: "#f2e6da", color: "#4b443b" }}
      title="Copy email address"
    >
      <Copy className="size-3.5" /> {copied ? "Copied!" : "Copy email"}
    </button>
  );
}

/**
 * Reusable triage list. `mode` picks the primary action per row and in bulk:
 *  - "open": Resolve (single + bulk) + delete
 *  - "resolved": Reopen (single + bulk) + delete
 * Items are expected to be pre-filtered to the matching status by the page.
 */
export function FeedbackList({ items, mode }: { items: Feedback[]; mode: "open" | "resolved" }) {
  const router = useRouter();
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

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (f) => f.message.toLowerCase().includes(q) || (f.email ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  // Selection restricted to currently-visible rows (respects search).
  const shownIds = React.useMemo(() => shown.map((f) => f.id), [shown]);
  const selectedVisible = React.useMemo(
    () => shownIds.filter((id) => selected.has(id)),
    [shownIds, selected],
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

  const emptyLabel =
    mode === "open" ? "No open feedback — inbox zero." : "Nothing in the resolved archive yet.";

  return (
    <div className="grid gap-4">
      {/* Search */}
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8a8073]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search message or email…"
          className="w-full rounded-lg border border-[#e6ded2] bg-[#fffdf9] py-1.5 pl-8 pr-2.5 text-xs text-[#4b443b] outline-none focus:border-[#bf502b]"
        />
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
                {mode === "open" ? (
                  <button
                    onClick={() => bulkSetResolved(true)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                    style={{ background: ACCENT, color: "#fff" }}
                  >
                    <Check className="size-3.5" /> Resolve selected
                  </button>
                ) : (
                  <button
                    onClick={() => bulkSetResolved(false)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                    style={{ background: ACCENT, color: "#fff" }}
                  >
                    <RotateCcw className="size-3.5" /> Reopen selected
                  </button>
                )}
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
            <span className="text-xs text-[#8a8073]">
              {mode === "open"
                ? "Select items to resolve or delete in bulk."
                : "Select items to reopen or delete in bulk."}
            </span>
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-sm text-[#8a8073]">
          {query.trim() ? "No matches for your search." : emptyLabel}
        </p>
      ) : (
        <div className="grid gap-2">
          {shown.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border p-3"
              style={{
                borderColor: selected.has(f.id) ? ACCENT : "#e6ded2",
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
                  style={f.resolved ? { background: "#f2e6da", color: "#4b443b" } : { background: ACCENT, color: "#fff" }}
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
                      style={{ border: "1px solid #e6c9bd", background: "#f7ece4", color: ACCENT }}
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
