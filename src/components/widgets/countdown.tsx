"use client";

import * as React from "react";
import { Hourglass, Plus, X } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CountdownItem { name: string; date: string }
interface CountdownData { items: CountdownItem[] }
const STORAGE_KEY = "widget-countdown";

export function CountdownWidget() {
  const [data, setData] = React.useState<CountdownData>({ items: [] });
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDate, setNewDate] = React.useState("");

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<CountdownData>(STORAGE_KEY);
      if (remote?.items) { setData(remote); return; }
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) setData(JSON.parse(local));
      } catch {}
    })();
  }, []);

  function persist(next: CountdownData) {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    saveRemote(STORAGE_KEY, next);
  }

  function add() {
    if (!newName.trim() || !newDate) return;
    persist({ items: [...data.items, { name: newName.trim(), date: newDate }] });
    setNewName("");
    setNewDate("");
    setAdding(false);
  }

  function remove(idx: number) {
    persist({ items: data.items.filter((_, i) => i !== idx) });
  }

  function daysUntil(dateStr: string): number {
    const target = new Date(dateStr + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / 86400000);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Hourglass className="size-4 text-primary" /> Countdowns
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setAdding(!adding)}><Plus className="size-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {adding && (
          <form onSubmit={(e) => { e.preventDefault(); add(); }} className="space-y-2">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Event name..." autoFocus />
            <div className="flex gap-2">
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="flex-1" />
              <Button type="submit" size="sm" disabled={!newName.trim() || !newDate}>Add</Button>
            </div>
          </form>
        )}
        {data.items.length === 0 && !adding && (
          <p className="py-4 text-center text-sm text-muted-foreground">No countdowns. Add a date to track.</p>
        )}
        {data.items.map((item, i) => {
          const days = daysUntil(item.date);
          const past = days < 0;
          return (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${past ? "text-muted-foreground" : "text-primary"}`}>
                  {past ? "Done" : `${days}d`}
                </span>
                <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive"><X className="size-3.5" /></button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
