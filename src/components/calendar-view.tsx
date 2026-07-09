"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  CalendarDays,
  Home,
} from "lucide-react";
import { EventDialog } from "@/components/event-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatFloating } from "@/lib/utils";
import { readHomeOSData } from "@/lib/homeos/store";
import { getCalendarEvents } from "@/lib/homeos/calculations";
import type { CalendarEvent } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// A unified display event — either a LifeOS calendar event (editable) or a
// HomeOS-derived date (read-only, links to HomeOS).
type Disp = {
  id: string;
  title: string;
  dayKey: string;
  ts: number;
  source: "life" | "home";
  life?: CalendarEvent;
  timeLabel?: string;
  location?: string | null;
  kind?: string;
};

export function CalendarView({
  events,
  userId,
}: {
  events: CalendarEvent[];
  userId?: string;
}) {
  const router = useRouter();
  const [cursor, setCursor] = React.useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [dialog, setDialog] = React.useState<
    { event: CalendarEvent | null; date?: string } | null
  >(null);
  const [homeEvents, setHomeEvents] = React.useState<Disp[]>([]);

  // Pull in HomeOS dates client-side so the calendar shows both.
  React.useEffect(() => {
    const data = readHomeOSData(userId);
    if (!data) return;
    try {
      setHomeEvents(
        getCalendarEvents(data).map((e) => ({
          id: `home-${e.id}`,
          title: e.title,
          dayKey: e.date.slice(0, 10),
          ts: new Date(e.date).getTime(),
          source: "home" as const,
          kind: e.kind,
        })),
      );
    } catch {
      /* ignore */
    }
  }, [userId]);

  const all = React.useMemo<Disp[]>(() => {
    const life: Disp[] = events
      // Never let one row with a missing/odd start_time break the whole grid.
      .filter((e) => typeof e.start_time === "string" && e.start_time.length >= 10)
      .map((e) => {
        const parsed = new Date(e.start_time).getTime();
        return {
          id: `life-${e.id}`,
          title: e.title,
          // Group by the event's own (floating) calendar day and show its literal
          // time, so travelling never moves an event to a different day or hour.
          dayKey: e.start_time.slice(0, 10),
          ts: Number.isNaN(parsed)
            ? new Date(`${e.start_time.slice(0, 10)}T00:00:00Z`).getTime()
            : parsed,
          source: "life" as const,
          life: e,
          timeLabel: formatFloating(e.start_time),
          location: e.location,
        };
      });
    return [...life, ...homeEvents];
  }, [events, homeEvents]);

  const byDay = React.useMemo(() => {
    const map = new Map<string, Disp[]>();
    for (const d of all) {
      const arr = map.get(d.dayKey) ?? [];
      arr.push(d);
      map.set(d.dayKey, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.ts - b.ts);
    return map;
  }, [all]);

  // Build the month grid (Mon-first).
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = ymd(new Date());
  // Filter by calendar day (string compare on YYYY-MM-DD) rather than a
  // timestamp, so a floating event near midnight isn't dropped by a timezone
  // offset. Matches how the month grid buckets events.
  const upcoming = all
    .filter((d) => d.dayKey >= todayKey)
    .sort((a, b) => a.ts - b.ts)
    .slice(0, 8);

  function openDisp(d: Disp) {
    if (d.source === "life" && d.life) setDialog({ event: d.life });
    else router.push("/homeos");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-44 text-center text-lg font-semibold">
            {cursor.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const n = new Date();
              setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
            }}
          >
            Today
          </Button>
        </div>
        <Button onClick={() => setDialog({ event: null })}>
          <Plus className="size-4" /> New event
        </Button>
      </div>

      {/* Month grid */}
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            const key = date ? ymd(date) : `empty-${i}`;
            const dayEvents = date ? byDay.get(ymd(date)) ?? [] : [];
            const isToday = date && ymd(date) === todayKey;
            return (
              <div
                key={key}
                className={cn(
                  "min-h-20 border-b border-r p-1.5 last:border-r-0 sm:min-h-28",
                  !date && "bg-muted/20",
                  date && "cursor-pointer transition-colors hover:bg-accent/40",
                  (i + 1) % 7 === 0 && "border-r-0",
                )}
                onClick={() =>
                  date && setDialog({ event: null, date: ymd(date) })
                }
              >
                {date && (
                  <>
                    <div
                      className={cn(
                        "mb-1 grid size-6 place-items-center rounded-full text-xs",
                        isToday
                          ? "bg-primary font-semibold text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <button
                          key={e.id}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            openDisp(e);
                          }}
                          className={cn(
                            "block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
                            e.source === "home"
                              ? "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300"
                              : "bg-primary/10 text-primary hover:bg-primary/20",
                          )}
                        >
                          {e.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="px-1 text-[11px] text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Upcoming
        </h3>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing on the horizon"
            description="Add an event manually, or approve an item in the Drop to put bookings and appointments straight onto your calendar."
          />
        ) : (
          <div className="grid gap-2">
            {upcoming.map((e) => (
              <button
                key={e.id}
                onClick={() => openDisp(e)}
                className="flex items-center gap-4 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent/40"
              >
                <div
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg",
                    e.source === "home"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-accent text-accent-foreground",
                  )}
                >
                  {e.source === "home" ? (
                    <Home className="size-5" />
                  ) : (
                    <CalendarDays className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    {e.source === "life" ? (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {e.timeLabel}
                        </span>
                        {e.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {e.location}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Home className="size-3.5" /> {e.kind} · HomeOS
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {dialog && (
        <EventDialog
          event={dialog.event}
          defaultDate={dialog.date}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
