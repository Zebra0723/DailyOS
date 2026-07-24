"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2, Mail, Search, Clock, Link2, Tag, Monitor } from "lucide-react";
import { setBugStatus, deleteBug } from "@/app/support/bugs/actions";
import { ConfirmButton } from "@/components/confirm-button";
import type { BugReport } from "@/lib/bugs";

const ACCENT = "#bf502b";

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

/** Trim a URL to something readable while keeping the full value in `title`. */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = (u.pathname + u.search).replace(/\/$/, "");
    return u.host + (path === "" ? "" : path);
  } catch {
    return url;
  }
}

export function BugList({ items }: { items: BugReport[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("open");
  const [busy, setBusy] = React.useState(false);

  // Compute "now" only after mount to avoid SSR hydration mismatch, then tick.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.description.toLowerCase().includes(q) || (b.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, filter, query]);

  async function toggleStatus(b: BugReport) {
    setBusy(true);
    try {
      await setBugStatus(b.id, b.status === "open" ? "resolved" : "open");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "resolved", label: "Resolved" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="grid gap-4">
      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-[#e6ded2] bg-[#fffdf9] p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-md px-3 py-1 text-xs font-semibold transition-colors"
              style={
                filter === f.key
                  ? { background: ACCENT, color: "#fff" }
                  : { background: "transparent", color: "#6b6157" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8a8073]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search description or email…"
            className="w-full rounded-lg border border-[#e6ded2] bg-[#fffdf9] py-1.5 pl-8 pr-2.5 text-xs text-[#4b443b] outline-none focus:border-[#bf502b]"
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-[#8a8073]">
          {query.trim()
            ? "No matches for your search."
            : filter === "open"
              ? "No open bug reports — all clear."
              : filter === "resolved"
                ? "Nothing resolved yet."
                : "No bug reports yet."}
        </p>
      ) : (
        <div className="grid gap-2">
          {shown.map((b) => {
            const resolved = b.status === "resolved";
            return (
              <div
                key={b.id}
                className="rounded-xl border p-3"
                style={{ borderColor: "#e6ded2", background: resolved ? "#faf6ef" : "#fffdf9" }}
              >
                <div className="flex items-center gap-2 text-xs text-[#8a8073]">
                  {b.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3" /> {b.email}
                    </span>
                  )}
                  {resolved && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: "#f2e6da", color: "#4b443b" }}
                    >
                      Resolved
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1.5">
                    {now !== null && (
                      <span className="inline-flex items-center gap-1 text-[#a39a8c]">
                        <Clock className="size-3" /> {relativeTime(b.created_at, now)}
                      </span>
                    )}
                    <span>{new Date(b.created_at).toLocaleString()}</span>
                  </span>
                </div>

                <p className="mt-1.5 whitespace-pre-wrap text-sm">{b.description}</p>

                {/* Captured context */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8a8073]">
                  {b.page_url && (
                    <a
                      href={b.page_url}
                      target="_blank"
                      rel="noreferrer"
                      title={b.page_url}
                      className="inline-flex max-w-full items-center gap-1 truncate font-medium text-[#bf502b] underline-offset-2 hover:underline"
                    >
                      <Link2 className="size-3 shrink-0" /> {shortUrl(b.page_url)}
                    </a>
                  )}
                  {b.app_version && (
                    <span className="inline-flex items-center gap-1">
                      <Tag className="size-3" /> v{b.app_version}
                    </span>
                  )}
                  {b.user_agent && (
                    <span
                      className="inline-flex max-w-full items-center gap-1 truncate text-[#a39a8c]"
                      title={b.user_agent}
                    >
                      <Monitor className="size-3 shrink-0" /> {b.user_agent}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleStatus(b)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                    style={resolved ? { background: "#f2e6da", color: "#4b443b" } : { background: ACCENT, color: "#fff" }}
                  >
                    {resolved ? (
                      <>
                        <RotateCcw className="size-3.5" /> Reopen
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" /> Resolve
                      </>
                    )}
                  </button>
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
                    title="Delete this bug report?"
                    message="This permanently removes the bug report and its captured context."
                    warn="This can't be undone."
                    onConfirm={async () => {
                      await deleteBug(b.id);
                      router.refresh();
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
