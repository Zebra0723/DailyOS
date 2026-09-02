"use client";

import * as React from "react";
import { Target, Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Goal { name: string; progress: number; target: number }
interface GoalData { goals: Goal[] }
const STORAGE_KEY = "widget-goals";

export function GoalsWidget({ userId }: { userId?: string }) {
  const [data, setData] = React.useState<GoalData>({ goals: [] });
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  // Per-account local cache; the remote copy is already scoped to the account.
  const localKey = userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<GoalData>(STORAGE_KEY);
      if (remote?.goals) { setData(remote); return; }
      try {
        const local = localStorage.getItem(localKey);
        if (local) setData(JSON.parse(local));
      } catch {}
    })();
  }, [localKey]);

  function persist(next: GoalData) {
    setData(next);
    localStorage.setItem(localKey, JSON.stringify(next));
    saveRemote(STORAGE_KEY, next);
  }

  function add() {
    const name = newName.trim();
    if (!name) return;
    persist({ goals: [...data.goals, { name, progress: 0, target: 100 }] });
    setNewName("");
    setAdding(false);
  }

  function update(idx: number, delta: number) {
    const goals = data.goals.map((g, i) => {
      if (i !== idx) return g;
      return { ...g, progress: Math.max(0, Math.min(g.target, g.progress + delta)) };
    });
    persist({ goals });
  }

  function remove(idx: number) {
    persist({ goals: data.goals.filter((_, i) => i !== idx) });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="size-4 text-primary" /> Goals
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setAdding(!adding)}><Plus className="size-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex gap-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New goal..." className="flex-1" autoFocus />
            <Button type="submit" size="sm" disabled={!newName.trim()}>Add</Button>
          </form>
        )}
        {data.goals.length === 0 && !adding && (
          <p className="py-4 text-center text-sm text-muted-foreground">No goals yet. Set one to get started.</p>
        )}
        {data.goals.map((g, i) => {
          const pct = Math.round((g.progress / g.target) * 100);
          return (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{g.name}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => update(i, -10)} className="rounded p-0.5 hover:bg-muted"><ChevronDown className="size-4 text-muted-foreground" /></button>
                  <span className="min-w-[3ch] text-center text-xs font-bold">{pct}%</span>
                  <button onClick={() => update(i, 10)} className="rounded p-0.5 hover:bg-muted"><ChevronUp className="size-4 text-muted-foreground" /></button>
                  <button onClick={() => remove(i)} className="rounded p-0.5 hover:bg-muted"><X className="size-3.5 text-muted-foreground hover:text-destructive" /></button>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
