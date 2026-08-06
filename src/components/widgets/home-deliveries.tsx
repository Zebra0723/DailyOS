"use client";

import { Truck } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import {
  getArrivalsToday,
  getProblemArrivals,
  getUpcomingArrivals,
} from "@/lib/homeos/calculations";
import { relativeLabel } from "@/lib/homeos/dates";
import { HomeWidgetShell, HomeRow } from "@/components/widgets/homeos-shell";

export function HomeDeliveriesWidget() {
  const { data, ready } = useHomeOSData();
  const arrivals = data?.arrivals ?? [];

  const today = getArrivalsToday(arrivals);
  const upcoming = getUpcomingArrivals(arrivals).filter(
    (a) => !today.some((t) => t.id === a.id),
  );
  const problems = getProblemArrivals(arrivals);

  if (!data || (today.length === 0 && upcoming.length === 0 && problems.length === 0)) {
    return (
      <HomeWidgetShell
        title="Deliveries"
        icon={Truck}
        href="/homeos/arrivals"
        linkLabel="Track"
        loading={!ready}
        empty={
          arrivals.length === 0
            ? "Nothing on its way."
            : "No deliveries due in the next two weeks."
        }
      />
    );
  }

  return (
    <HomeWidgetShell title="Deliveries" icon={Truck} href="/homeos/arrivals" linkLabel="Track">
      {problems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            Needs attention
          </p>
          {problems.slice(0, 3).map((a) => (
            <HomeRow
              key={a.id}
              href="/homeos/arrivals"
              title={a.title}
              meta={a.company ?? a.type}
              trailing={
                <span className="shrink-0 text-xs text-red-600 dark:text-red-400">
                  {a.status}
                </span>
              }
            />
          ))}
        </div>
      )}
      {today.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-primary">Arriving today</p>
          {today.map((a) => (
            <HomeRow
              key={a.id}
              href="/homeos/arrivals"
              title={a.title}
              meta={[a.company, a.expectedTimeWindow].filter(Boolean).join(" · ") || a.type}
              trailing={
                a.needsSomeoneHome ? (
                  <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">
                    Be in
                  </span>
                ) : null
              }
            />
          ))}
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Coming up</p>
          {upcoming.slice(0, 4).map((a) => (
            <HomeRow
              key={a.id}
              href="/homeos/arrivals"
              title={a.title}
              meta={a.company ?? a.type}
              trailing={
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeLabel(a.expectedDate)}
                </span>
              }
            />
          ))}
        </div>
      )}
    </HomeWidgetShell>
  );
}
