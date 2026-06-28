"use client";

import * as React from "react";
import Link from "next/link";
import { Home, ArrowRight, Check } from "lucide-react";
import { homeOSStorageKeyFor } from "@/lib/homeos/store";
import type { DailyOSTodayAction, HomeOSData } from "@/lib/homeos/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shows HomeOS-created actions on the DailyOS Today page. Reads straight from
 * the per-user HomeOS localStorage so it works without the HomeOS provider.
 * Renders nothing when there are no HomeOS actions.
 */
export function HomeOSTodayActions({ userId }: { userId: string }) {
  const key = homeOSStorageKeyFor(userId);
  const [actions, setActions] = React.useState<DailyOSTodayAction[] | null>(null);

  React.useEffect(() => {
    setActions(read());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function read(): DailyOSTodayAction[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const d = JSON.parse(raw) as HomeOSData;
      return Array.isArray(d.todayActions) ? d.todayActions : [];
    } catch {
      return [];
    }
  }

  function setStatus(id: string, status: DailyOSTodayAction["status"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const d = JSON.parse(raw) as HomeOSData;
      d.todayActions = (d.todayActions ?? []).map((a) =>
        a.id === id ? { ...a, status } : a,
      );
      localStorage.setItem(key, JSON.stringify(d));
      setActions(d.todayActions);
    } catch {
      /* ignore */
    }
  }

  if (!actions || actions.length === 0) return null;

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="size-4 text-primary" /> From HomeOS
        </CardTitle>
        <Link
          href="/homeos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Open HomeOS <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map((a) => {
          const done = a.status === "Done";
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <button
                onClick={() => setStatus(a.id, done ? "Not Started" : "Done")}
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-input hover:border-primary",
                )}
                aria-label={done ? "Mark not done" : "Mark done"}
              >
                {done && <Check className="size-3.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", done && "line-through opacity-60")}>
                  {a.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.sourceModule}
                  {a.estimatedMinutes ? ` · ~${a.estimatedMinutes} min` : ""}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
