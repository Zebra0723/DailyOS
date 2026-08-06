"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalEvent {
  id: string;
  title: string;
  start_time: string;
  location: string | null;
}

export function UpcomingEventsWidget() {
  const [events, setEvents] = React.useState<CalEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("start_time", now)
        .order("start_time", { ascending: true })
        .limit(5);
      setEvents((data as CalEvent[]) ?? []);
      setLoading(false);
    })();
  }, []);

  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="size-4 text-primary" /> Upcoming
        </CardTitle>
        <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground">Calendar</Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : events.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <CalendarDays className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="size-3" />{formatTime(e.start_time)}</span>
                    {e.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{e.location}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
