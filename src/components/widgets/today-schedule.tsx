"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadRemote } from "@/lib/sync";
import { cn } from "@/lib/utils";

interface DayBlock {
  start: string;
  end: string;
  title: string;
  type: string;
  note?: string;
}

interface StoredPlan {
  date: string;
  blocks: DayBlock[];
  summary: string;
}

const TYPE_DOT: Record<string, string> = {
  fixed: "bg-blue-500",
  focus: "bg-primary",
  admin: "bg-amber-500",
  break: "bg-emerald-500",
  meal: "bg-orange-400",
  wellbeing: "bg-pink-500",
  buffer: "bg-muted-foreground/40",
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TodayScheduleWidget() {
  const [blocks, setBlocks] = React.useState<DayBlock[] | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const stored = await loadRemote<StoredPlan>("day-plan");
      if (!active) return;
      if (stored && stored.date === todayStr() && stored.blocks?.length) {
        setBlocks(stored.blocks);
      }
      setLoaded(true);
    })();
    return () => { active = false; };
  }, []);

  if (!loaded) {
    return (
      <Card>
        <CardContent className="grid place-items-center py-8">
          <Clock className="size-5 animate-pulse text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!blocks) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-sm text-muted-foreground">
            No schedule for today yet.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/build-day">
              <CalendarClock className="size-4" /> Build My Day
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-1 pt-5">
        {blocks.map((b, i) => (
          <div key={i} className="flex items-center gap-2.5 py-1">
            <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">
              {b.start}
            </span>
            <div className={cn("size-2 shrink-0 rounded-full", TYPE_DOT[b.type] ?? TYPE_DOT.buffer)} />
            <span className="truncate text-sm">{b.title}</span>
          </div>
        ))}
        <div className="pt-2">
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
            <Link href="/build-day">
              <CalendarClock className="size-3.5" /> Edit schedule
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
