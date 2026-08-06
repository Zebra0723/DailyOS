"use client";

import { CalendarRange } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import { getCalendarEvents } from "@/lib/homeos/calculations";
import { daysUntil, relativeLabel } from "@/lib/homeos/dates";
import { HomeWidgetShell, HomeRow } from "@/components/widgets/homeos-shell";

export function HomeCalendarWidget() {
  const { data, ready } = useHomeOSData();

  // Only what's still ahead — renewals, deliveries, warranties and maintenance
  // already behind us aren't useful on a dashboard.
  const upcoming = data
    ? getCalendarEvents(data)
        .filter((e) => (daysUntil(e.date) ?? -1) >= 0)
        .slice(0, 6)
    : [];

  if (!data || upcoming.length === 0) {
    return (
      <HomeWidgetShell
        title="Home Calendar"
        icon={CalendarRange}
        href="/homeos/calendar"
        loading={!ready}
        empty="No home dates coming up."
      />
    );
  }

  return (
    <HomeWidgetShell title="Home Calendar" icon={CalendarRange} href="/homeos/calendar">
      <div className="space-y-2">
        {upcoming.map((e) => (
          <HomeRow
            key={e.id}
            href="/homeos/calendar"
            title={e.title}
            meta={e.kind}
            trailing={
              <span
                className={
                  e.critical
                    ? "shrink-0 text-xs text-red-600 dark:text-red-400"
                    : "shrink-0 text-xs text-muted-foreground"
                }
              >
                {relativeLabel(e.date)}
              </span>
            }
          />
        ))}
      </div>
    </HomeWidgetShell>
  );
}
