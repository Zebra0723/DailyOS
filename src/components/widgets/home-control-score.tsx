"use client";

import { Gauge } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import { getHomeControlScore } from "@/lib/homeos/calculations";
import { HomeWidgetShell } from "@/components/widgets/homeos-shell";
import { cn } from "@/lib/utils";

export function HomeControlScoreWidget() {
  const { data, ready } = useHomeOSData();

  if (!data) {
    return (
      <HomeWidgetShell
        title="Home Control Score"
        icon={Gauge}
        href="/homeos"
        loading={!ready}
        empty="Set up HomeOS to start scoring your household."
      />
    );
  }

  const { score, label, explanation } = getHomeControlScore(data);
  const tone =
    score >= 90
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 75
        ? "text-primary"
        : score >= 55
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400";
  const bar =
    score >= 90
      ? "bg-emerald-500"
      : score >= 75
        ? "bg-primary"
        : score >= 55
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <HomeWidgetShell title="Home Control Score" icon={Gauge} href="/homeos">
      <div className="flex items-baseline gap-2">
        <span className={cn("text-4xl font-semibold tabular-nums", tone)}>{score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <span className="ml-auto text-sm font-medium">{label}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Home Control Score"
      >
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{explanation}</p>
    </HomeWidgetShell>
  );
}
