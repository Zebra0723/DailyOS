"use client";

import * as React from "react";
import { BookOpen, Flame, ArrowRight } from "lucide-react";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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
  // If no entry today, start from yesterday.
  if (!dates.has(toDateStr(d))) d.setDate(d.getDate() - 1);
  while (dates.has(toDateStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function onThisDay(entries: JournalEntry[], today: string): JournalEntry | null {
  const dd = today.slice(8, 10);
  const mm = today.slice(5, 7);
  return (
    entries.find((e) => e.date.slice(8, 10) === dd && e.date.slice(5, 7) === mm && e.date !== today) ??
    null
  );
}

export function MicroJournalWidget({ userId }: { userId?: string }) {
  const today = toDateStr(new Date());
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [draft, setDraft] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  // Per-account local cache; the remote copy is already scoped to the account.
  const localKey = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;

  const pushRemote = React.useMemo(
    () => debounce((v: JournalEntry[]) => void saveRemote(STORAGE_KEY, v), 600),
    [],
  );

  React.useEffect(() => {
    (async () => {
      let local: JournalEntry[] = [];
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) local = JSON.parse(raw) as JournalEntry[];
      } catch {}
      setEntries(local);

      const remote = await loadRemote<JournalEntry[]>(STORAGE_KEY);
      if (Array.isArray(remote) && remote.length > 0) {
        setEntries(remote);
        local = remote;
      } else if (local.length > 0) {
        void saveRemote(STORAGE_KEY, local);
      }

      const todayEntry = local.find((e) => e.date === toDateStr(new Date()));
      if (todayEntry) setDraft(todayEntry.text);
      setLoaded(true);
    })();
  }, [localKey]);

  function save() {
    const text = draft.trim();
    if (!text) return;
    const existing = entries.find((e) => e.date === today);
    let next: JournalEntry[];
    if (existing) {
      next = entries.map((e) => (e.date === today ? { ...e, text, ts: Date.now() } : e));
    } else {
      next = [{ date: today, text, ts: Date.now() }, ...entries];
    }
    setEntries(next);
    try { localStorage.setItem(localKey, JSON.stringify(next)); } catch {}
    pushRemote(next);
  }

  const todayEntry = entries.find((e) => e.date === today);
  const streak = calcStreak(entries);
  const lookback = onThisDay(entries, today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="size-4 text-primary" /> One Line a Day
          {streak > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs font-normal text-orange-500">
              <Flame className="size-3" /> {streak}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loaded ? (
          <>
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder={todayEntry ? todayEntry.text : "How was today in one line?"}
                className="text-sm"
              />
            </div>
            {todayEntry && (
              <p className="mt-2 text-xs text-muted-foreground">
                Saved for {new Date(todayEntry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {lookback && (
              <div className="mt-3 rounded-lg border bg-muted/30 p-2.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  On this day &middot; {new Date(lookback.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </p>
                <p className="mt-1 text-sm italic text-foreground/80">
                  &ldquo;{lookback.text}&rdquo;
                </p>
              </div>
            )}
            <Link
              href="/journal"
              className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all entries <ArrowRight className="size-3" />
            </Link>
          </>
        ) : (
          <div className="h-10 animate-pulse rounded bg-muted" />
        )}
      </CardContent>
    </Card>
  );
}
