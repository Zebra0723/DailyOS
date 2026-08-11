"use client";

import * as React from "react";
import { BookOpen, Flame, Pencil, Trash2, Loader2 } from "lucide-react";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JournalEntry {
  date: string;
  text: string;
  ts: number;
}

const STORAGE_KEY = "journal-v1";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function calcStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = new Set(entries.map((e) => e.date));
  let streak = 0;
  const d = new Date();
  if (!dates.has(toDateStr(d))) d.setDate(d.getDate() - 1);
  while (dates.has(toDateStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function longestStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const sorted = [...new Set(entries.map((e) => e.date))].sort();
  let max = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00");
    const curr = new Date(sorted[i] + "T12:00:00");
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (Math.round(diff) === 1) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 1;
    }
  }
  return max;
}

function onThisDayEntries(entries: JournalEntry[], today: string): JournalEntry[] {
  const dd = today.slice(8, 10);
  return entries
    .filter((e) => e.date.slice(8, 10) === dd && e.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function calendarWeeks(year: number, month: number, entryDates: Set<string>) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const today = toDateStr(new Date());
  const weeks: { date: string; day: number; has: boolean; isToday: boolean; inMonth: boolean }[][] = [];
  let week: typeof weeks[0] = [];

  for (let i = 0; i < first.getDay(); i++) {
    week.push({ date: "", day: 0, has: false, isToday: false, inMonth: false });
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const ds = toDateStr(new Date(year, month, d));
    week.push({ date: ds, day: d, has: entryDates.has(ds), isToday: ds === today, inMonth: true });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ date: "", day: 0, has: false, isToday: false, inMonth: false });
    }
    weeks.push(week);
  }
  return weeks;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function JournalManager({ userId }: { userId: string }) {
  const [entries, setEntries] = React.useState<JournalEntry[] | null>(null);
  const [draft, setDraft] = React.useState("");
  const [editingDate, setEditingDate] = React.useState<string | null>(null);
  const [calMonth, setCalMonth] = React.useState(() => new Date().getMonth());
  const [calYear, setCalYear] = React.useState(() => new Date().getFullYear());
  const hydratedRef = React.useRef(false);

  const pushRemote = React.useMemo(
    () => debounce((v: JournalEntry[]) => void saveRemote(STORAGE_KEY, v), 800),
    [],
  );

  React.useEffect(() => {
    let active = true;
    hydratedRef.current = false;
    (async () => {
      let local: JournalEntry[] = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) local = JSON.parse(raw) as JournalEntry[];
      } catch {}
      if (!active) return;
      setEntries(local);

      const remote = await loadRemote<JournalEntry[]>(STORAGE_KEY);
      if (!active) return;
      if (Array.isArray(remote) && remote.length > 0) {
        setEntries(remote);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); } catch {}
      } else if (local.length > 0) {
        void saveRemote(STORAGE_KEY, local);
      }

      const today = toDateStr(new Date());
      const todayEntry = (Array.isArray(remote) && remote.length > 0 ? remote : local).find(
        (e) => e.date === today,
      );
      if (todayEntry) setDraft(todayEntry.text);
      hydratedRef.current = true;
    })();
    return () => { active = false; };
  }, []);

  function persist(next: JournalEntry[]) {
    setEntries(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    if (hydratedRef.current) pushRemote(next);
  }

  function saveToday() {
    if (!entries) return;
    const text = draft.trim();
    if (!text) return;
    const today = toDateStr(new Date());
    const existing = entries.find((e) => e.date === today);
    if (existing) {
      persist(entries.map((e) => (e.date === today ? { ...e, text, ts: Date.now() } : e)));
    } else {
      persist([{ date: today, text, ts: Date.now() }, ...entries]);
    }
    setEditingDate(null);
  }

  function remove(date: string) {
    if (!entries) return;
    persist(entries.filter((e) => e.date !== date));
    if (date === toDateStr(new Date())) setDraft("");
  }

  if (entries === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Journal" description="One line a day. Your life in sentences." />
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </div>
    );
  }

  const today = toDateStr(new Date());
  const todayEntry = entries.find((e) => e.date === today);
  const streak = calcStreak(entries);
  const longest = longestStreak(entries);
  const totalDays = new Set(entries.map((e) => e.date)).size;
  const entryDates = new Set(entries.map((e) => e.date));
  const weeks = calendarWeeks(calYear, calMonth, entryDates);
  const lookbacks = onThisDayEntries(entries, today);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Journal"
        description="One line a day. Your life in sentences."
      />

      {/* Today's entry */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveToday()}
              placeholder="How was today in one line?"
              className="text-sm"
            />
            <Button onClick={saveToday} disabled={!draft.trim()}>
              <Pencil className="size-4" /> {todayEntry ? "Update" : "Save"}
            </Button>
          </div>
          {todayEntry && (
            <p className="mt-2 text-xs text-muted-foreground">
              Last saved at{" "}
              {new Date(todayEntry.ts).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="flex items-center gap-1 text-2xl font-bold text-orange-500">
              <Flame className="size-5" /> {streak}
            </span>
            <span className="text-xs text-muted-foreground">Current streak</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-primary">{longest}</span>
            <span className="text-xs text-muted-foreground">Longest streak</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-4">
            <span className="text-2xl font-bold text-primary">{totalDays}</span>
            <span className="text-xs text-muted-foreground">Total entries</span>
          </CardContent>
        </Card>
      </div>

      {/* Calendar heatmap */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
                else setCalMonth(calMonth - 1);
              }}
              className="rounded px-2 py-1 text-sm hover:bg-muted"
            >
              &larr;
            </button>
            <span className="text-sm font-medium">
              {MONTHS[calMonth]} {calYear}
            </span>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
                else setCalMonth(calMonth + 1);
              }}
              className="rounded px-2 py-1 text-sm hover:bg-muted"
            >
              &rarr;
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((d, i) => (
              <span key={i} className="text-[10px] font-medium text-muted-foreground">
                {d}
              </span>
            ))}
            {weeks.flat().map((cell, i) => (
              <div
                key={i}
                className={cn(
                  "grid size-8 place-items-center rounded-md text-xs transition-colors",
                  !cell.inMonth && "opacity-0",
                  cell.inMonth && !cell.has && "text-muted-foreground",
                  cell.has && "bg-primary/20 font-semibold text-primary",
                  cell.isToday && "ring-2 ring-primary/40",
                )}
              >
                {cell.inMonth ? cell.day : ""}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* On This Day */}
      {lookbacks.length > 0 && (
        <Card className="mb-5">
          <CardContent className="pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="size-4 text-primary" /> On This Day
            </h3>
            <div className="space-y-3">
              {lookbacks.map((e) => (
                <div key={e.date} className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {new Date(e.date + "T12:00:00").toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-sm italic text-foreground/80">
                    &ldquo;{e.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All entries */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <BookOpen className="size-6 text-primary" />
            Write your first line above. Come back tomorrow and keep the streak going.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">All entries</h3>
          {sorted.map((e) => (
            <Card key={e.date}>
              <CardContent className="flex items-start gap-3 py-3">
                <div className="flex-1">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {new Date(e.date + "T12:00:00").toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-sm">{e.text}</p>
                </div>
                <button
                  onClick={() => remove(e.date)}
                  className="mt-1 grid size-6 shrink-0 place-items-center text-muted-foreground hover:text-destructive"
                  aria-label="Delete entry"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
