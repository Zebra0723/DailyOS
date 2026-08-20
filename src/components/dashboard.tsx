"use client";

import * as React from "react";
import { Plus, GripVertical, X, LayoutGrid, Sparkles } from "lucide-react";
import { getWidget, type PlanTier, type WidgetDef } from "@/lib/widgets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWidgetStore } from "@/components/widget-store";
import { useDashboard } from "@/lib/widgets/dashboard-store";
import { useFeatures } from "@/lib/features-store";
import { getPack } from "@/lib/features";
import { planPack } from "@/lib/widgets/packs";

import { TasksDueWidget } from "@/components/widgets/tasks-due";
import { UpcomingEventsWidget } from "@/components/widgets/upcoming-events";
import { RecentInboxWidget } from "@/components/widgets/recent-inbox";
import { QuickAddWidget } from "@/components/widgets/quick-add";
import { StatsOverviewWidget } from "@/components/widgets/stats-overview";
import { NeedsReviewWidget } from "@/components/widgets/needs-review";
import { BookmarksWidget } from "@/components/widgets/bookmarks";
import { TomorrowPreviewWidget } from "@/components/widgets/tomorrow-preview";
import { HabitTrackerWidget } from "@/components/widgets/habit-tracker";
import { PomodoroWidget } from "@/components/widgets/pomodoro";
import { QuickNotesWidget } from "@/components/widgets/quick-notes";
import { GoalsWidget } from "@/components/widgets/goals";
import { WaterIntakeWidget } from "@/components/widgets/water-intake";
import { MoodTrackerWidget } from "@/components/widgets/mood-tracker";
import { DailyQuoteWidget } from "@/components/widgets/daily-quote";
import { CountdownWidget } from "@/components/widgets/countdown";
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
import { AIBuilderWidget } from "@/components/widgets/ai-builder";
import { AIWidgetHost } from "@/components/widgets/ai-widget-host";
import { isAIWidgetId, widgetIdFromDashboardId } from "@/lib/widgets/ai-store";

/** Stand-in registry entry for AI-built widgets, which have no static def. */
const AI_WIDGET_DEF: WidgetDef = {
  id: "ai-widget",
  name: "AI widget",
  description: "Built for you by the AI Feature Builder.",
  icon: Sparkles,
  category: "ai",
  tier: "pro",
};

const COMPONENT_MAP: Record<string, React.ComponentType> = {
  "stats-overview": StatsOverviewWidget,
  "tasks-due": TasksDueWidget,
  "upcoming-events": UpcomingEventsWidget,
  "recent-inbox": RecentInboxWidget,
  "quick-add": QuickAddWidget,
  "needs-review": NeedsReviewWidget,
  bookmarks: BookmarksWidget,
  "tomorrow-preview": TomorrowPreviewWidget,
  "habit-tracker": HabitTrackerWidget,
  pomodoro: PomodoroWidget,
  "quick-notes": QuickNotesWidget,
  goals: GoalsWidget,
  "water-intake": WaterIntakeWidget,
  "mood-tracker": MoodTrackerWidget,
  "daily-quote": DailyQuoteWidget,
  countdown: CountdownWidget,
  "homeos-summary": HomeOSSummaryWidget,
  "home-control-score": HomeControlScoreWidget,
  "home-subscriptions": HomeSubscriptionsWidget,
  "home-deliveries": HomeDeliveriesWidget,
  "home-devices": HomeDevicesWidget,
  "home-rooms": HomeRoomsWidget,
  "home-alerts": HomeAlertsWidget,
  "home-calendar": HomeCalendarWidget,
  "home-vault": HomeVaultWidget,
  "micro-journal": MicroJournalWidget,
  "ai-builder": AIBuilderWidget,
};

function tierAllows(userTier: PlanTier | string, required: PlanTier): boolean {
  if (userTier === "pro") return true;
  if (required === "plus" && (userTier === "plus" || userTier === "pro")) return true;
  if (required === "free") return true;
  return false;
}

export function Dashboard({ userId }: { userId?: string }) {
  // Widget state lives in DashboardProvider so the store (which can be opened
  // from any page, including ones that don't render the dashboard) reads and
  // writes exactly the same list.
  const { widgets, loaded, tier, limit, addWidget, removeWidget, moveWidget, setWidgets } =
    useDashboard();
  const { openWidgetStore } = useWidgetStore();
  const { enabled, setEnabled } = useFeatures();
  const [editing, setEditing] = React.useState(false);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);

  // One definition of "starter", shared with the Packs tab — it switches on the
  // sections those widgets rely on, not just the widgets.
  const applyStarterPack = React.useCallback(() => {
    const pack = getPack("starter");
    if (!pack) return;
    const plan = planPack({
      pack,
      currentWidgets: widgets,
      enabledFeatures: enabled,
      tier,
      limit,
    });
    for (const key of plan.featuresToEnable) setEnabled(key, true);
    setWidgets([...widgets, ...plan.widgetsToAdd]);
  }, [widgets, enabled, tier, limit, setEnabled, setWidgets]);

  if (!loaded) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <LayoutGrid className="size-6 animate-pulse" />
      </div>
    );
  }

  if (widgets.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-16 text-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <LayoutGrid className="size-8" />
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">
            Your dashboard starts empty — on purpose
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Everything in DailyOS is a <strong className="text-foreground">widget</strong>:
            a small panel that lives here on Today. Tasks, calendar, habits,
            goals, your home — you choose which ones appear, in what order, and
            you can take any of them off again whenever you like.
          </p>
          <p className="mt-2 max-w-md text-xs text-muted-foreground">
            Not sure where to start? The starter pack sets you up with the
            essentials — or browse the packs for a ready-made setup. You can
            change any of it straight away.
          </p>
          <div className="mt-6 flex gap-2">
            <Button onClick={openWidgetStore}>
              <Plus className="size-4" /> Add your first widget
            </Button>
            <Button variant="outline" onClick={applyStarterPack}>
              Use starter pack
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          <LayoutGrid className="size-4" />
          {editing ? "Done" : "Customise"}
        </Button>
        <Button variant="outline" size="sm" onClick={openWidgetStore}>
          <Plus className="size-4" /> Add widget
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {widgets.map((id, i) => {
          // AI-built widgets aren't in the static registry — they're per-user
          // specs, resolved at render time by AIWidgetHost. They're always Pro.
          const ai = isAIWidgetId(id);
          const def = ai ? AI_WIDGET_DEF : getWidget(id);
          if (!def) return null;
          const Comp = ai ? null : COMPONENT_MAP[id];
          if (!ai && !Comp) return null;
          const allowed = tierAllows(tier, def.tier);

          return (
            <div
              key={id}
              className={cn(
                "group relative",
                def.span === "full" && "lg:col-span-2",
              )}
              draggable={editing}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIdx !== null && dragIdx !== i) {
                  moveWidget(dragIdx, i);
                  setDragIdx(i);
                }
              }}
              onDragEnd={() => setDragIdx(null)}
            >
              {editing && (
                <div className="absolute -top-2 right-0 z-10 flex items-center gap-1">
                  <button
                    className="rounded-full bg-card p-1 shadow-md border text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                    aria-label="Drag to reorder"
                  >
                    <GripVertical className="size-3.5" />
                  </button>
                  <button
                    onClick={() => removeWidget(id)}
                    className="rounded-full bg-destructive p-1 text-destructive-foreground shadow-md hover:bg-destructive/90"
                    aria-label={`Remove ${def.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
              {!allowed ? (
                <LockedWidget def={def} />
              ) : ai ? (
                <AIWidgetHost
                  widgetId={widgetIdFromDashboardId(id)}
                  userId={userId}
                  onRemove={() => removeWidget(id)}
                />
              ) : id === "ai-builder" ? (
                // Needs the account and a way to drop what it builds onto the grid.
                <AIBuilderWidget userId={userId} onAdded={addWidget} />
              ) : (
                Comp && <Comp />
              )}
            </div>
          );
        })}
      </div>

    </>
  );
}

function LockedWidget({ def }: { def: { name: string; tier: PlanTier; icon: React.ComponentType<{ className?: string }> } }) {
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
