"use client";

import * as React from "react";
import { Droplets, Plus, Minus } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "widget-water";
const GOAL = 8;

export function WaterIntakeWidget() {
  const today = new Date().toISOString().slice(0, 10);
  const [glasses, setGlasses] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<Record<string, number>>(STORAGE_KEY);
      if (remote && typeof remote[today] === "number") { setGlasses(remote[today]); return; }
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (typeof parsed[today] === "number") setGlasses(parsed[today]);
        }
      } catch {}
    })();
  }, [today]);

  function update(delta: number) {
    const next = Math.max(0, glasses + delta);
    setGlasses(next);
    const key = STORAGE_KEY;
    let all: Record<string, number> = {};
    try { all = JSON.parse(localStorage.getItem(key) ?? "{}"); } catch {}
    all[today] = next;
    localStorage.setItem(key, JSON.stringify(all));
    saveRemote(key, all);
  }

  const pct = Math.min(100, Math.round((glasses / GOAL) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Droplets className="size-4 text-primary" /> Water
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="relative mx-auto size-24">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted" />
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`} className="stroke-sky-500 transition-all" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">{glasses}</span>
            <span className="text-[10px] text-muted-foreground">/ {GOAL}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => update(-1)} disabled={glasses <= 0}>
            <Minus className="size-4" />
          </Button>
          <Button size="sm" onClick={() => update(1)}>
            <Plus className="size-4" /> Glass
          </Button>
        </div>
        {glasses >= GOAL && <p className="mt-2 text-xs font-medium text-sky-600 dark:text-sky-400">Goal reached!</p>}
      </CardContent>
    </Card>
  );
}
