"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  CalendarDays,
} from "lucide-react";
import { EventDialog } from "@/components/event-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatDateTime } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [cursor, setCursor] = React.useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [dialog, setDialog] = React.useState<
    { event: CalendarEvent | null; date?: string } | null
  >(null);

  const byDay = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = ymd(new Date(e.start_time));
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

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

  const upcoming = events
    .filter((e) => new Date(e.start_time) >= new Date(new Date().toDateString()))
    .slice(0, 6);

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
                            setDialog({ event: e });
                          }}
                          className="block w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-left text-[11px] font-medium text-primary hover:bg-primary/20"
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
            description="Add an event manually, or approve an inbox item to drop bookings and appointments straight onto your calendar."
          />
        ) : (
          <div className="grid gap-2">
            {upcoming.map((e) => (
              <button
                key={e.id}
                onClick={() => setDialog({ event: e })}
                className="flex items-center gap-4 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent/40"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <CalendarDays className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatDateTime(e.start_time)}
                    </span>
                    {e.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {e.location}
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
