"use client";

import * as React from "react";
import { Smile } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MOODS = [
  { emoji: "\u{1F614}", label: "Rough", color: "bg-red-100 dark:bg-red-500/15" },
  { emoji: "\u{1F615}", label: "Meh", color: "bg-amber-100 dark:bg-amber-500/15" },
  { emoji: "\u{1F642}", label: "Okay", color: "bg-yellow-100 dark:bg-yellow-500/15" },
  { emoji: "\u{1F60A}", label: "Good", color: "bg-emerald-100 dark:bg-emerald-500/15" },
  { emoji: "\u{1F929}", label: "Great", color: "bg-sky-100 dark:bg-sky-500/15" },
];

const STORAGE_KEY = "widget-mood";

export function MoodTrackerWidget() {
  const today = new Date().toISOString().slice(0, 10);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [history, setHistory] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<Record<string, number>>(STORAGE_KEY);
      if (remote) { setHistory(remote); setSelected(remote[today] ?? null); return; }
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) { const p = JSON.parse(local); setHistory(p); setSelected(p[today] ?? null); }
      } catch {}
    })();
  }, [today]);

  function pick(idx: number) {
    setSelected(idx);
    const next = { ...history, [today]: idx };
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saveRemote(STORAGE_KEY, next);
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Smile className="size-4 text-primary" /> Mood
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">How are you feeling today?</p>
        <div className="flex justify-between gap-1">
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => pick(i)} className={cn("flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-all", selected === i ? m.color + " ring-2 ring-primary/30 scale-110" : "hover:bg-muted")}>
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-1">
          {last7.map((d) => {
            const val = history[d];
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <div className="text-sm">{val != null ? MOODS[val].emoji : "\u{2022}"}</div>
                <span className="text-[9px] text-muted-foreground">{d.slice(8)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
