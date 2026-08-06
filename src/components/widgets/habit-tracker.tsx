"use client";

import * as React from "react";
import { Flame, Plus, X, Check } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HabitData {
  habits: { name: string; days: Record<string, boolean> }[];
}

const STORAGE_KEY = "widget-habits";

export function HabitTrackerWidget() {
  const [data, setData] = React.useState<HabitData>({ habits: [] });
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const today = new Date().toISOString().slice(0, 10);

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<HabitData>(STORAGE_KEY);
      if (remote?.habits) { setData(remote); return; }
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) setData(JSON.parse(local));
      } catch {}
    })();
  }, []);

  function persist(next: HabitData) {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saveRemote(STORAGE_KEY, next);
  }

  function addHabit() {
    const name = newName.trim();
    if (!name) return;
    persist({ habits: [...data.habits, { name, days: {} }] });
    setNewName("");
    setAdding(false);
  }

  function toggle(idx: number) {
    const habits = data.habits.map((h, i) => {
      if (i !== idx) return h;
      const days = { ...h.days };
      days[today] = !days[today];
      return { ...h, days };
    });
    persist({ habits });
  }

  function remove(idx: number) {
    persist({ habits: data.habits.filter((_, i) => i !== idx) });
  }

  function streak(habit: { days: Record<string, boolean> }): number {
    let count = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (!habit.days[key]) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="size-4 text-primary" /> Habits
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && (
          <form onSubmit={(e) => { e.preventDefault(); addHabit(); }} className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New habit..." className="flex-1" autoFocus />
            <Button type="submit" size="sm" disabled={!newName.trim()}>Add</Button>
          </form>
        )}
        {data.habits.length === 0 && !adding && (
          <p className="py-4 text-center text-sm text-muted-foreground">No habits yet. Add one to start tracking.</p>
        )}
        {data.habits.map((h, i) => {
          const done = !!h.days[today];
          const s = streak(h);
          return (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <button onClick={() => toggle(i)} className={`grid size-6 shrink-0 place-items-center rounded-md border transition-colors ${done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary"}`}>
                {done && <Check className="size-3.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{h.name}</p>
              </div>
              {s > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Flame className="size-3" /> {s}d
                </span>
              )}
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
