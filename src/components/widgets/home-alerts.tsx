"use client";

import { BellRing } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import { getOpenAlertCounts } from "@/lib/homeos/calculations";
import { HomeWidgetShell, MiniStat, HomeRow } from "@/components/widgets/homeos-shell";

const SEVERITY_ORDER = { Critical: 0, Warning: 1, Info: 2 } as const;

export function HomeAlertsWidget() {
  const { data, ready } = useHomeOSData();
  const alerts = data?.alerts ?? [];
  const open = alerts.filter((a) => a.status === "Open");

  if (!data || open.length === 0) {
    return (
      <HomeWidgetShell
        title="Home Alerts"
        icon={BellRing}
        href="/homeos/alerts"
        linkLabel="All alerts"
        loading={!ready}
        empty="Nothing needs your attention. Nice."
      />
    );
  }

  const counts = getOpenAlertCounts(alerts);
  const top = [...open]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, 4);

  return (
    <HomeWidgetShell
      title="Home Alerts"
      icon={BellRing}
      href="/homeos/alerts"
      linkLabel="All alerts"
    >
      <div className="grid grid-cols-3 gap-2">
        <MiniStat
          label="critical"
          value={counts.critical}
          tone={counts.critical > 0 ? "red" : "default"}
        />
        <MiniStat
          label="warnings"
          value={counts.warning}
          tone={counts.warning > 0 ? "amber" : "default"}
        />
        <MiniStat label="info" value={counts.info} />
      </div>
      <div className="space-y-2">
        {top.map((a) => (
          <HomeRow
            key={a.id}
            href="/homeos/alerts"
            title={a.title}
            meta={a.message}
            trailing={
              <span
                className={
                  a.severity === "Critical"
                    ? "shrink-0 text-xs text-red-600 dark:text-red-400"
                    : a.severity === "Warning"
                      ? "shrink-0 text-xs text-amber-600 dark:text-amber-400"
                      : "shrink-0 text-xs text-muted-foreground"
                }
              >
                {a.severity}
              </span>
            }
          />
        ))}
      </div>
    </HomeWidgetShell>
  );
}
