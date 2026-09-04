"use client";

import * as React from "react";
import { getWidget, type PlanTier } from "@/lib/widgets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlan } from "@/lib/use-pro";

import { TasksDueWidget } from "@/components/widgets/tasks-due";
import { UpcomingEventsWidget } from "@/components/widgets/upcoming-events";
import { RecentInboxWidget } from "@/components/widgets/recent-inbox";
import { QuickAddWidget } from "@/components/widgets/quick-add";
import { StatsOverviewWidget } from "@/components/widgets/stats-overview";
import { NeedsReviewWidget } from "@/components/widgets/needs-review";
import { BookmarksWidget } from "@/components/widgets/bookmarks";
import { TomorrowPreviewWidget } from "@/components/widgets/tomorrow-preview";
import { HabitTrackerWidget } from "@/components/widgets/habit-tracker";
import { QuickNotesWidget } from "@/components/widgets/quick-notes";
import { GoalsWidget } from "@/components/widgets/goals";
import { HomeOSSummaryWidget } from "@/components/widgets/homeos-summary";
import { HomeControlScoreWidget } from "@/components/widgets/home-control-score";
import { HomeSubscriptionsWidget } from "@/components/widgets/home-subscriptions";
import { HomeDeliveriesWidget } from "@/components/widgets/home-deliveries";
import { HomeDevicesWidget } from "@/components/widgets/home-devices";
import { HomeRoomsWidget } from "@/components/widgets/home-rooms";
import { HomeAlertsWidget } from "@/components/widgets/home-alerts";
import { HomeCalendarWidget } from "@/components/widgets/home-calendar";
import { HomeVaultWidget } from "@/components/widgets/home-vault";
import { MicroJournalWidget } from "@/components/widgets/micro-journal";
import { TodayScheduleWidget } from "@/components/widgets/today-schedule";
import { AskDailyOSWidget } from "@/components/widgets/ask-dailyos";

const COMPONENT_MAP: Record<string, React.ComponentType<{ userId?: string }>> = {
  "stats-overview": StatsOverviewWidget,
  "tasks-due": TasksDueWidget,
  "today-schedule": TodayScheduleWidget,
  "upcoming-events": UpcomingEventsWidget,
  "quick-add": QuickAddWidget,
  "recent-inbox": RecentInboxWidget,
  "needs-review": NeedsReviewWidget,
  bookmarks: BookmarksWidget,
  "tomorrow-preview": TomorrowPreviewWidget,
  "habit-tracker": HabitTrackerWidget,
  goals: GoalsWidget,
  "quick-notes": QuickNotesWidget,
  "micro-journal": MicroJournalWidget,
  "ask-dailyos": AskDailyOSWidget,
  "homeos-summary": HomeOSSummaryWidget,
  "home-control-score": HomeControlScoreWidget,
  "home-alerts": HomeAlertsWidget,
  "home-subscriptions": HomeSubscriptionsWidget,
  "home-deliveries": HomeDeliveriesWidget,
  "home-devices": HomeDevicesWidget,
  "home-rooms": HomeRoomsWidget,
  "home-calendar": HomeCalendarWidget,
  "home-vault": HomeVaultWidget,
};

// Every widget is preloaded onto Today, in this order. The dashboard is no
// longer customisable — there's no empty state, no add/remove, no edit mode.
const PRELOADED_WIDGETS: string[] = [
  "stats-overview",
  "tasks-due",
  "today-schedule",
  "upcoming-events",
  "quick-add",
  "recent-inbox",
  "needs-review",
  "bookmarks",
  "tomorrow-preview",
  "habit-tracker",
  "goals",
  "quick-notes",
  "micro-journal",
  "ask-dailyos",
  "homeos-summary",
  "home-control-score",
  "home-alerts",
  "home-subscriptions",
  "home-deliveries",
  "home-devices",
  "home-rooms",
  "home-calendar",
  "home-vault",
];

function tierAllows(userTier: PlanTier | string, required: PlanTier): boolean {
  if (userTier === "pro") return true;
  if (required === "plus" && (userTier === "plus" || userTier === "pro")) return true;
  if (required === "free") return true;
  return false;
}

export function Dashboard({ userId }: { userId?: string }) {
  const { mounted, tier } = usePlan(userId);
  // Use the plan as soon as it's painted from localStorage, so a paid account
  // doesn't see a flash of locked widgets while the network confirms.
  const currentTier: PlanTier | string = mounted ? tier : "free";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {PRELOADED_WIDGETS.map((id) => {
        const def = getWidget(id);
        const Comp = COMPONENT_MAP[id];
        if (!def || !Comp) return null;
        const allowed = tierAllows(currentTier, def.tier);
        return (
          <div
            key={id}
            className={cn("relative", def.span === "full" && "lg:col-span-2")}
          >
            {allowed ? <Comp userId={userId} /> : <LockedWidget def={def} />}
          </div>
        );
      })}
    </div>
  );
}

function LockedWidget({
  def,
}: {
  def: { name: string; tier: PlanTier; icon: React.ComponentType<{ className?: string }> };
}) {
  const Icon = def.icon;
  const label = def.tier === "pro" ? "Pro" : "Plus";
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 py-10 text-center">
      <Icon className="size-8 text-muted-foreground/40" />
      <p className="mt-2 text-sm font-medium">{def.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Upgrade to {label} to unlock this widget.
      </p>
      <Button variant="outline" size="sm" className="mt-3" asChild>
        <a href="/subscriptions">See plans</a>
      </Button>
    </div>
  );
}
