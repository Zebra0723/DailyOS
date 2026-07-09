"use client";

import * as React from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import { getOpenAlertCounts } from "@/lib/homeos/calculations";
import { isOverdue, isWithinDays, relativeLabel } from "@/lib/homeos/dates";
import {
  HOME_MODULES,
  type AlertSeverity,
  type AlertStatus,
  type HomeAlert,
  type HomeModule,
} from "@/lib/homeos/types";
import {
  HomeEmpty,
  ModuleBadge,
  Section,
  SeverityBadge,
  StatCard,
} from "@/components/homeos/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  Critical: 0,
  Warning: 1,
  Info: 2,
};

const STATUS_ORDER: Record<AlertStatus, number> = {
  Open: 0,
  Snoozed: 1,
  Resolved: 2,
};

type SeverityFilter = "all" | AlertSeverity;
type ModuleFilter = "all" | HomeModule;
type StatusFilter = "all" | AlertStatus;

function statusBadgeVariant(
  status: AlertStatus,
): "default" | "secondary" | "success" {
  switch (status) {
    case "Resolved":
      return "success";
    case "Snoozed":
      return "secondary";
    default:
      return "default";
  }
}

export function HomeAlerts() {
  const {
    data,
    resolveAlert,
    snoozeAlert,
    reopenAlert,
    deleteAlert,
    addTodayAction,
  } = useHomeOS();

  const [severity, setSeverity] = React.useState<SeverityFilter>("all");
  const [module, setModule] = React.useState<ModuleFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [overdueOnly, setOverdueOnly] = React.useState(false);
  const [dueSoonOnly, setDueSoonOnly] = React.useState(false);

  const counts = React.useMemo(
    () => getOpenAlertCounts(data.alerts),
    [data.alerts],
  );

  const filtered = React.useMemo(() => {
    const list = data.alerts.filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (module !== "all" && a.module !== module) return false;
      if (status !== "all" && a.status !== status) return false;
      if (overdueOnly && !isOverdue(a.dueDate)) return false;
      if (dueSoonOnly && !isWithinDays(a.dueDate, 7)) return false;
      return true;
    });
    return list.sort((a, b) => {
      const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sev !== 0) return sev;
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    });
  }, [data.alerts, severity, module, status, overdueOnly, dueSoonOnly]);

  function pushToToday(alert: HomeAlert) {
    addTodayAction({
      title: alert.title,
      source: "HomeOS",
      sourceModule:
        alert.module === "HomeOS" ? "SubscriptionOps" : alert.module,
      linkedEntityType: alert.linkedEntityType,
      linkedEntityId: alert.linkedEntityId,
      priority: alert.severity === "Critical" ? "High" : "Normal",
      estimatedMinutes: 10,
      status: "Not Started",
    });
  }

  const hasAnyAlerts = data.alerts.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          HomeOS Alerts
        </h2>
        <p className="text-sm text-muted-foreground">
          Everything that needs your attention.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Open"
          value={counts.open}
          icon={Bell}
          tone="primary"
        />
        <StatCard
          label="Critical"
          value={counts.critical}
          icon={AlertTriangle}
          tone="red"
        />
        <StatCard
          label="Warning"
          value={counts.warning}
          icon={Clock}
          tone="amber"
        />
        <StatCard label="Info" value={counts.info} icon={Info} />
        <StatCard
          label="Resolved"
          value={counts.resolved}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      <Section
        title="Alerts"
        description="Filter, triage, and act on what matters."
      >
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Select
              aria-label="Severity"
              className="w-auto min-w-[9rem]"
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as SeverityFilter)
              }
            >
              <option value="all">All severities</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </Select>

            <Select
              aria-label="Module"
              className="w-auto min-w-[9rem]"
              value={module}
              onChange={(e) => setModule(e.target.value as ModuleFilter)}
            >
              <option value="all">All modules</option>
              {HOME_MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Status"
              className="w-auto min-w-[9rem]"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="Open">Open</option>
              <option value="Snoozed">Snoozed</option>
              <option value="Resolved">Resolved</option>
            </Select>

            <Button
              type="button"
              size="sm"
              variant={overdueOnly ? "default" : "outline"}
              onClick={() => setOverdueOnly((v) => !v)}
            >
              <AlertTriangle />
              Overdue
            </Button>

            <Button
              type="button"
              size="sm"
              variant={dueSoonOnly ? "default" : "outline"}
              onClick={() => setDueSoonOnly((v) => !v)}
            >
              <CalendarClock />
              Due soon
            </Button>
          </CardContent>
        </Card>

        {!hasAnyAlerts ? (
          <HomeEmpty message="No open alerts. HomeOS is calm." />
        ) : filtered.length === 0 ? (
          <HomeEmpty message="No alerts match these filters." />
        ) : (
          <div className="space-y-3">
            {filtered.map((alert) => {
              const quiet =
                alert.status === "Resolved" || alert.status === "Snoozed";
              return (
                <Card
                  key={alert.id}
                  className={cn(quiet && "opacity-60")}
                >
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold tracking-tight">
                          {alert.title}
                        </span>
                        <SeverityBadge severity={alert.severity} />
                        <ModuleBadge module={alert.module} />
                        <Badge variant={statusBadgeVariant(alert.status)}>
                          {alert.status}
                        </Badge>
                        {alert.dueDate && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs",
                              isOverdue(alert.dueDate)
                                ? "text-red-600 dark:text-red-400"
                                : "text-muted-foreground",
                            )}
                          >
                            <CalendarClock className="size-3.5" />
                            {relativeLabel(alert.dueDate)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {alert.status !== "Resolved" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle2 />
                          Resolve
                        </Button>
                      )}
                      {alert.status !== "Snoozed" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => snoozeAlert(alert.id, 3)}
                        >
                          <Clock />
                          Snooze
                        </Button>
                      )}
                      {alert.status !== "Open" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => reopenAlert(alert.id)}
                        >
                          <RotateCcw />
                          Reopen
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => pushToToday(alert)}
                      >
                        <Plus />
                        Add to Today
                      </Button>
                      {/* Only manual alerts can be deleted — an auto alert would
                          just be regenerated from its source item, so we offer
                          Resolve/Snooze for those instead. */}
                      {alert.key.startsWith("manual:") && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          <Trash2 />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
