"use client";

import { Sofa } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import { getRoomCompletion, getRoomSpend } from "@/lib/homeos/calculations";
import type { Room } from "@/lib/homeos/types";
import { HomeWidgetShell, MiniStat, gbp } from "@/components/widgets/homeos-shell";

export function HomeRoomsWidget() {
  const { data, ready } = useHomeOSData();
  const items = data?.roomItems ?? [];

  if (!data || items.length === 0) {
    return (
      <HomeWidgetShell
        title="Rooms"
        icon={Sofa}
        href="/homeos/rooms"
        linkLabel="Plan"
        loading={!ready}
        empty="No room items yet."
      />
    );
  }

  const overall = getRoomCompletion(items);
  const spend = getRoomSpend(items);

  // Busiest rooms first — the ones with the most still to do are the useful ones
  // to surface on a dashboard.
  const rooms = Array.from(new Set(items.map((i) => i.room))) as Room[];
  const byRoom = rooms
    .map((room) => ({ room, ...getRoomCompletion(items, room) }))
    .sort((a, b) => b.needed + b.inProgress - (a.needed + a.inProgress))
    .slice(0, 4);

  return (
    <HomeWidgetShell title="Rooms" icon={Sofa} href="/homeos/rooms" linkLabel="Plan">
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="complete" value={`${overall.percentage}%`} tone="primary" />
        <MiniStat
          label={overall.needed === 1 ? "still needed" : "still needed"}
          value={overall.needed}
          tone={overall.needed > 0 ? "amber" : "default"}
        />
        <MiniStat label="spent" value={gbp(spend)} />
      </div>
      <div className="space-y-2">
        {byRoom.map((r) => (
          <div key={r.room} className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="truncate font-medium">{r.room}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {r.complete}/{r.total}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={r.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${r.room} completion`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${r.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </HomeWidgetShell>
  );
}
