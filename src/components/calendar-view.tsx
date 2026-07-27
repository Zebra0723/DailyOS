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
  X,
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
  // The day whose detail sheet is open (YYYY-MM-DD). Tapping a date opens this
  // — a read-out of what's on that day — instead of jumping straight into "add
  // event"; the sheet itself carries the Add Event button.
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
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
  const upcoming = React.useMemo(
    () =>
      all
        .filter((d) => d.dayKey >= todayKey)
        .sort((a, b) => a.ts - b.ts)
        .slice(0, 8),
    [all, todayKey],
  );

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
                  "min-h-16 border-b border-r p-1 last:border-r-0 sm:min-h-28 sm:p-1.5",
                  !date && "bg-muted/20",
                  date && "cursor-pointer transition-colors hover:bg-accent/40",
                  (i + 1) % 7 === 0 && "border-r-0",
                )}
                onClick={() => date && setSelectedDay(ymd(date))}
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
                    {/* Phones: compact dots (pills are unreadable at ~45px).
                        Details live in the Upcoming list below. */}
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:hidden">
                        {dayEvents.slice(0, 4).map((e) => (
                          <span
                            key={e.id}
                            className={cn(
                              "size-1.5 rounded-full",
                              e.source === "home" ? "bg-amber-500" : "bg-primary",
                            )}
                          />
                        ))}
                      </div>
                    )}
                    {/* sm and up: full event pills */}
                    <div className="hidden space-y-1 sm:block">
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
          <div className="grid grid-cols-1 gap-2">
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

      {selectedDay && (
        <DaySheet
          day={selectedDay}
          events={byDay.get(selectedDay) ?? []}
          isToday={selectedDay === todayKey}
          onClose={() => setSelectedDay(null)}
          onAdd={() => {
            setDialog({ event: null, date: selectedDay });
            setSelectedDay(null);
          }}
          onOpenEvent={(d) => {
            setSelectedDay(null);
            openDisp(d);
          }}
        />
      )}

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

/** The day-detail sheet: a read-out of everything on a tapped date, with an
 *  Add Event button in the top-right. Slides up from the bottom on phones,
 *  centres as a card on larger screens. */
function DaySheet({
  day,
  events,
  isToday,
  onClose,
  onAdd,
  onOpenEvent,
}: {
  day: string;
  events: Disp[];
  isToday: boolean;
  onClose: () => void;
  onAdd: () => void;
  onOpenEvent: (d: Disp) => void;
}) {
  // Parse as a local calendar day (no timezone shift) purely for the heading.
  const date = new Date(`${day}T00:00:00`);
  const heading = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Close on Escape for keyboard/desktop users.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full flex-col rounded-t-3xl bg-card shadow-elevated sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: date + Add Event (top-right) */}
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div className="min-w-0">
            {isToday && (
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Today
              </p>
            )}
            <h3 className="truncate text-lg font-semibold">{heading}</h3>
            <p className="text-sm text-muted-foreground">
              {events.length === 0
                ? "Nothing scheduled"
                : `${events.length} ${events.length === 1 ? "event" : "events"}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" onClick={onAdd}>
              <Plus className="size-4" /> Add Event
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body: what's on this day */}
        <div className="flex-1 overflow-y-auto p-4">
          {events.length === 0 ? (
            <button
              onClick={onAdd}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center text-muted-foreground transition-colors hover:bg-accent/40"
            >
              <CalendarDays className="size-8" />
              <p className="text-sm">
                Nothing on this day yet — tap to add your first event.
              </p>
            </button>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onOpenEvent(e)}
                  className="flex w-full items-center gap-4 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent/40"
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
      </div>
    </div>
  );
}
