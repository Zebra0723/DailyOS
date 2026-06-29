"use client";

import * as React from "react";
import { Check, Droplet, Wind, Sun, Eye, PersonStanding, Heart, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NUDGES = [
  { label: "Drink a glass of water", icon: Droplet },
  { label: "Stretch for a minute", icon: PersonStanding },
  { label: "Step outside for fresh air", icon: Sun },
  { label: "Look away from the screen (20 secs)", icon: Eye },
  { label: "Take 3 deep breaths", icon: Wind },
  { label: "Do one kind thing for yourself", icon: Heart },
];

const KEY_PREFIX = "dailyos-nudges-";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function todayKey() {
  const d = new Date();
  return `${KEY_PREFIX}${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NudgesList() {
  const [mounted, setMounted] = React.useState(false);
  const [done, setDone] = React.useState<boolean[]>(() => NUDGES.map(() => false));

  React.useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(todayKey());
      if (raw) {
        const parsed = JSON.parse(raw) as boolean[];
        if (Array.isArray(parsed) && parsed.length === NUDGES.length) setDone(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(i: number) {
    setDone((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      localStorage.setItem(todayKey(), JSON.stringify(next));
      return next;
    });
  }

  const count = done.filter(Boolean).length;
  const allDone = count === NUDGES.length;

  if (!mounted) return <Card className="h-72 animate-pulse" />;

  return (
    <div className="space-y-4">
      {/* Racecar finale */}
      {allDone && (
        <>
          <div className="pointer-events-none fixed inset-x-0 top-1/2 z-50 -translate-y-1/2 overflow-hidden">
            <div className="racecar inline-flex items-center gap-3 whitespace-nowrap">
              <span className="grid size-12 place-items-center rounded-full bg-emerald-500 text-white shadow-elevated">
                <Check className="size-7" />
              </span>
              <Car className="-scale-x-100 size-12 text-primary" />
              <span className="rounded-full bg-card px-4 py-2 text-lg font-semibold shadow-elevated">
                Well done, check in tomorrow!
              </span>
            </div>
          </div>
          <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <CardContent className="py-6 text-center">
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                All done! Well done — check in tomorrow.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium">Today&apos;s nudges</p>
        <p className="text-sm text-muted-foreground">
          {count} / {NUDGES.length}
        </p>
      </div>

      <div className="grid gap-2">
        {NUDGES.map((n, i) => {
          const checked = done[i];
          return (
            <button
              key={n.label}
              onClick={() => toggle(i)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                checked ? "border-primary/40 bg-accent/50" : "bg-card hover:bg-accent/30",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                  checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {checked ? <Check className="size-5" /> : <n.icon className="size-5" />}
              </span>
              <span className={cn("font-medium", checked && "text-muted-foreground line-through")}>
                {n.label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="px-1 text-xs text-muted-foreground">
        Resets each morning. Tick them off as you go.
      </p>
    </div>
  );
}
