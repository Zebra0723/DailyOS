"use client";

import * as React from "react";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { HomeEmpty, ModuleBadge, Section } from "@/components/homeos/ui";
import { useHomeOS } from "@/lib/homeos/store";
import { getCalendarEvents, type CalendarEvent } from "@/lib/homeos/calculations";
import {
  formatDate,
  isOverdue,
  isWithinDays,
  relativeLabel,
} from "@/lib/homeos/dates";
import type { HomeModule } from "@/lib/homeos/types";
import { cn } from "@/lib/utils";

type Range = "next7" | "next30" | "overdue" | "all";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "next7", label: "Next 7 days" },
  { value: "next30", label: "Next 30 days" },
  { value: "overdue", label: "Overdue" },
  { value: "all", label: "All" },
];

// Modules that can appear in the calendar timeline (excludes the "HomeOS" meta module).
const FILTERABLE_MODULES: HomeModule[] = [
  "SubscriptionOps",
  "ArrivalOps",
  "RoomOps",
  "DeviceOps",
  "Home Vault",
];

function inRange(date: string, range: Range): boolean {
  switch (range) {
    case "next7":
      return isWithinDays(date, 7);
    case "next30":
      return isWithinDays(date, 30);
    case "overdue":
      return isOverdue(date);
    case "all":
      return true;
  }
}

export function HomeCalendar() {
  const { data, addTodayAction } = useHomeOS();

  const [activeModules, setActiveModules] = React.useState<Set<HomeModule>>(
    () => new Set(FILTERABLE_MODULES),
  );
  const [criticalOnly, setCriticalOnly] = React.useState(false);
  const [range, setRange] = React.useState<Range>("next30");

  const allEvents = React.useMemo(() => getCalendarEvents(data), [data]);

  const filtered = React.useMemo(
    () =>
      allEvents.filter(
        (e) =>
          activeModules.has(e.module) &&
          (!criticalOnly || e.critical) &&
          inRange(e.date, range),
      ),
    [allEvents, activeModules, criticalOnly, range],
  );

  // Group ascending by calendar day. getCalendarEvents already returns events
  // sorted ascending, so iteration preserves that order across groups.
  const groups = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const key = e.date.slice(0, 10);
      const list = map.get(key);
      if (list) list.push(e);
      else map.set(key, [e]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function toggleModule(module: HomeModule) {
    setActiveModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  function handleAdd(event: CalendarEvent) {
    addTodayAction({
      title: event.title,
      source: "HomeOS",
      sourceModule: event.module === "Home Vault" ? "Home Vault" : event.module,
      linkedEntityType: event.linkedEntityType,
      linkedEntityId: event.linkedEntityId,
      priority: event.critical ? "High" : "Normal",
      estimatedMinutes: 10,
      status: "Not Started",
    });
  }

  return (
    <Section
      title="HomeOS Calendar"
      description="Every home date in one timeline."
    >
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERABLE_MODULES.map((module) => {
              const active = activeModules.has(module);
              return (
                <button
                  key={module}
                  type="button"
                  onClick={() => toggleModule(module)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  aria-pressed={active}
                >
                  {module}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCriticalOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                criticalOnly
                  ? "border-red-300 bg-red-100 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
                  : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              aria-pressed={criticalOnly}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  criticalOnly ? "bg-red-500" : "bg-muted-foreground/50",
                )}
                aria-hidden
              />
              Critical only
            </button>

            <div className="ml-auto w-40">
              <Select
                value={range}
                onChange={(e) => setRange(e.target.value as Range)}
                aria-label="Date range"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {groups.length === 0 ? (
        <HomeEmpty message="No upcoming HomeOS dates." />
      ) : (
        <div className="space-y-5">
          {groups.map(([day, events]) => (
            <div key={day} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold tracking-tight">
                  {formatDate(day)}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {relativeLabel(day)}
                </span>
              </div>

              <Card>
                <CardContent className="divide-y p-0">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-3"
                    >
                      {event.critical && (
                        <span
                          className="size-2 shrink-0 rounded-full bg-red-500"
                          aria-label="Critical"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {event.title}
                          </span>
                          <ModuleBadge module={event.module} />
                          {event.critical && (
                            <Badge variant="destructive">Critical</Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span>{event.kind}</span>
                          <span aria-hidden>·</span>
                          <span>{formatDate(event.date)}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdd(event)}
                      >
                        <Plus />
                        Add to Today
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
