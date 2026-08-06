"use client";

import { Cpu } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import {
  getDeviceHealthSummary,
  getMaintenanceDueDevices,
  maintenanceDueDate,
} from "@/lib/homeos/calculations";
import { relativeLabel } from "@/lib/homeos/dates";
import { HomeWidgetShell, MiniStat, HomeRow } from "@/components/widgets/homeos-shell";

export function HomeDevicesWidget() {
  const { data, ready } = useHomeOSData();
  const devices = data?.devices ?? [];

  if (!data || devices.length === 0) {
    return (
      <HomeWidgetShell
        title="Devices"
        icon={Cpu}
        href="/homeos/devices"
        linkLabel="Manage"
        loading={!ready}
        empty="No devices tracked yet."
      />
    );
  }

  const health = getDeviceHealthSummary(devices, data.settings.warrantyWarningDays);
  const needsWork = health.issue + health.needsRepair + health.warrantyClaim;
  const dueForCheck = getMaintenanceDueDevices(devices).slice(0, 3);

  return (
    <HomeWidgetShell title="Devices" icon={Cpu} href="/homeos/devices" linkLabel="Manage">
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="working" value={health.working} tone="green" />
        <MiniStat
          label={needsWork === 1 ? "needs work" : "need work"}
          value={needsWork}
          tone={needsWork > 0 ? "red" : "default"}
        />
        <MiniStat
          label="warranty ending"
          value={health.warrantyEndingSoon}
          tone={health.warrantyEndingSoon > 0 ? "amber" : "default"}
        />
      </div>
      {dueForCheck.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Maintenance due
          </p>
          {dueForCheck.map((d) => (
            <HomeRow
              key={d.id}
              href="/homeos/devices"
              title={d.name}
              meta={d.room}
              trailing={
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeLabel(maintenanceDueDate(d))}
                </span>
              }
            />
          ))}
        </div>
      )}
    </HomeWidgetShell>
  );
}
