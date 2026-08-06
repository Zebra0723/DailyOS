"use client";

import * as React from "react";
import Link from "next/link";
import { CheckSquare, CalendarDays, AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatsOverviewWidget() {
  const [stats, setStats] = React.useState({ due: 0, events: 0, review: 0, inbox: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();
      const [tasks, events, review, inbox] = await Promise.all([
        supabase.from("extracted_tasks").select("id", { count: "exact", head: true }).eq("status", "pending").lte("due_date", today),
        supabase.from("calendar_events").select("id", { count: "exact", head: true }).gte("start_time", now),
        supabase.from("inbox_items").select("id", { count: "exact", head: true }).in("status", ["review", "failed"]),
        supabase.from("inbox_items").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        due: tasks.count ?? 0,
        events: events.count ?? 0,
        review: review.count ?? 0,
        inbox: inbox.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile href="/tasks" label="Due today" value={stats.due} hint="tasks" icon={CheckSquare} tone={stats.due ? "primary" : "default"} />
      <StatTile href="/calendar" label="Upcoming" value={stats.events} hint="events" icon={CalendarDays} />
      <StatTile href="/inbox" label="To review" value={stats.review} hint="items" icon={AlertTriangle} tone={stats.review ? "amber" : "default"} />
      <StatTile href="/inbox" label="In the Drop" value={stats.inbox} hint="total" icon={Inbox} />
    </div>
  );
}

function StatTile({ href, label, value, hint, icon: Icon, tone = "default" }: {
  href: string; label: string; value: number; hint: string;
  icon: React.ComponentType<{ className?: string }>; tone?: "default" | "primary" | "amber";
}) {
  const toneClass = { default: "text-foreground", primary: "text-primary", amber: "text-amber-600 dark:text-amber-400" }[tone];
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-accent/40">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <Icon className="size-3.5 shrink-0" /><span className="truncate">{label}</span>
          </div>
          <div className={cn("mt-1 text-2xl font-bold tracking-tight", toneClass)}>{value}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
