"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Feedback } from "@/lib/feedback";

const ACCENT = "#bf502b";
const DAY = 86_400_000;

function StatCard({ label, value, hint }: { label: string; value: string; hint?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">{label}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color: ACCENT }}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-[#8a8073]">{hint}</div>}
    </div>
  );
}

/** Bar histogram of feedback counts per day for the last `days` days. */
function Histogram({ items, now, days }: { items: Feedback[]; now: number; days: number }) {
  const buckets = React.useMemo(() => {
    const out: { key: string; label: string; count: number }[] = [];
    const start = new Date(now);
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
      const d = new Date(f.created_at);
      if (Number.isNaN(d.getTime())) continue;
      const i = index.get(d.toISOString().slice(0, 10));
      if (i !== undefined) out[i].count += 1;
    }
    return out;
  }, [items, now, days]);

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
      <div className="mt-3 flex h-28 items-end gap-1">
        {buckets.map((b) => (
          <div key={b.key} className="group relative flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full rounded-t-[3px] transition-colors"
              style={{
                height: `${(b.count / max) * 100}%`,
                minHeight: b.count > 0 ? 3 : 1,
                background: b.count > 0 ? ACCENT : "#ece4d8",
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

export function TrendsView({ items }: { items: Feedback[] }) {
  // Date math depends on "now"; defer to after mount to avoid hydration drift.
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => setNow(Date.now()), []);

  const stats = React.useMemo(() => {
    if (now === null) return null;
    const thisWeek = items.filter((f) => now - new Date(f.created_at).getTime() < 7 * DAY).length;
    const lastWeek = items.filter((f) => {
      const age = now - new Date(f.created_at).getTime();
      return age >= 7 * DAY && age < 14 * DAY;
    }).length;

    // Busiest calendar day across all history.
    const perDay = new Map<string, number>();
    for (const f of items) {
      const d = new Date(f.created_at);
      if (Number.isNaN(d.getTime())) continue;
      const k = d.toISOString().slice(0, 10);
      perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }
    let busiestKey = "";
    let busiestCount = 0;
    for (const [k, c] of perDay) {
      if (c > busiestCount) {
        busiestCount = c;
        busiestKey = k;
      }
    }

    const open = items.filter((f) => !f.resolved).length;
    const resolved = items.length - open;
    return { thisWeek, lastWeek, busiestKey, busiestCount, open, resolved };
  }, [items, now]);

  if (now === null || stats === null) {
    return <p className="text-sm text-[#8a8073]">Loading trends…</p>;
  }

  const delta = stats.thisWeek - stats.lastWeek;
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaText =
    stats.lastWeek === 0
      ? stats.thisWeek === 0
        ? "no change"
        : "new this week"
      : `${delta >= 0 ? "+" : ""}${delta} vs last week`;

  const busiestLabel = stats.busiestKey
    ? new Date(stats.busiestKey + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";

  const resolvedPct = items.length ? Math.round((stats.resolved / items.length) * 100) : 0;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="This week"
          value={String(stats.thisWeek)}
          hint={
            <span className="inline-flex items-center gap-1">
              <DeltaIcon className="size-3" /> {deltaText}
            </span>
          }
        />
        <StatCard label="Last week" value={String(stats.lastWeek)} hint="previous 7 days" />
        <StatCard
          label="Busiest day"
          value={busiestLabel}
          hint={stats.busiestCount ? `${stats.busiestCount} received` : "no data yet"}
        />
        <StatCard
          label="Open / resolved"
          value={`${stats.open} / ${stats.resolved}`}
          hint={`${resolvedPct}% resolved`}
        />
      </div>

      <Histogram items={items} now={now} days={30} />

      {/* Open vs resolved split bar */}
      <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">
          Open vs resolved
        </div>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-[#8a8073]">No feedback yet.</p>
        ) : (
          <>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[#f2e6da]">
              <div style={{ width: `${100 - resolvedPct}%`, background: ACCENT }} />
              <div style={{ width: `${resolvedPct}%`, background: "#d9c3b3" }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#6b6157]">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm" style={{ background: ACCENT }} />
                {stats.open} open
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm" style={{ background: "#d9c3b3" }} />
                {stats.resolved} resolved
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
