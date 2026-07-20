"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2, Mail, Search, Reply, Copy, Clock } from "lucide-react";
import { setResolved, deleteFeedback } from "@/app/support/actions";
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

export function FeedbackList({ items }: { items: Feedback[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("open");
  const [query, setQuery] = React.useState("");

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

  return (
    <div className="grid gap-4">
      {/* Stats header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open" value={String(openCount)} />
        <StatCard label="Resolved" value={String(resolvedCount)} />
        <StatCard label="Total" value={String(items.length)} />
        <StatCard label="Oldest open" value={oldestAge} hint={oldestOpen ? "needs a reply" : "all clear"} />
      </div>

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

      {shown.length === 0 ? (
        <p className="text-sm text-[#8a8073]">
          {query.trim() ? "No matches for your search." : "Nothing here."}
        </p>
      ) : (
        <div className="grid gap-2">
          {shown.map((f) => (
            <div key={f.id} className="rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-3">
              <div className="flex items-center gap-2 text-xs text-[#8a8073]">
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
