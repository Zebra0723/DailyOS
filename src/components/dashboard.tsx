"use client";

import * as React from "react";
import { Plus, GripVertical, X, LayoutGrid } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { getWidget, WIDGETS, type PlanTier } from "@/lib/widgets";
import { usePlan, tierMeets } from "@/lib/use-pro";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WidgetStore } from "@/components/widget-store";

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
import { AIBuilderWidget } from "@/components/widgets/ai-builder";

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
  "ai-builder": AIBuilderWidget,
};

const DASHBOARD_KEY = "dashboard";

interface DashboardState {
  widgets: string[];
}

const DEFAULT_WIDGETS = ["stats-overview", "tasks-due", "upcoming-events", "quick-add"];

function tierAllows(userTier: PlanTier | string, required: PlanTier): boolean {
  if (userTier === "pro") return true;
  if (required === "plus" && (userTier === "plus" || userTier === "pro")) return true;
  if (required === "free") return true;
  return false;
}

export function Dashboard({ userId }: { userId?: string }) {
  const { tier } = usePlan(userId);
  const [widgets, setWidgets] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [storeOpen, setStoreOpen] = React.useState(false);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemote<DashboardState>(DASHBOARD_KEY);
      if (remote?.widgets?.length) {
        setWidgets(remote.widgets);
      } else {
        const local = localStorage.getItem("dailyos-dashboard");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed.widgets)) setWidgets(parsed.widgets);
            else setWidgets([]);
          } catch {
            setWidgets([]);
          }
        }
      }
      setLoaded(true);
    })();
  }, []);

  const persist = React.useCallback(
    (next: string[]) => {
      setWidgets(next);
      const state: DashboardState = { widgets: next };
      localStorage.setItem("dailyos-dashboard", JSON.stringify(state));
      saveRemote(DASHBOARD_KEY, state);
    },
    [],
  );

  function addWidget(id: string) {
    if (widgets.includes(id)) return;
    persist([...widgets, id]);
  }

  function removeWidget(id: string) {
    persist(widgets.filter((w) => w !== id));
  }

  function moveWidget(from: number, to: number) {
    const next = [...widgets];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persist(next);
  }

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
            Your dashboard, your way
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Start empty and add exactly what you need — tasks, calendar, habits,
            goals, or anything else. Make DailyOS yours.
          </p>
          <div className="mt-6 flex gap-2">
            <Button onClick={() => setStoreOpen(true)}>
              <Plus className="size-4" /> Add your first widget
            </Button>
            <Button
              variant="outline"
              onClick={() => persist(DEFAULT_WIDGETS)}
            >
              Use starter pack
            </Button>
          </div>
        </div>
        <WidgetStore
          open={storeOpen}
          onClose={() => setStoreOpen(false)}
          activeWidgets={widgets}
          userTier={tier}
          onAdd={addWidget}
        />
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
        <Button variant="outline" size="sm" onClick={() => setStoreOpen(true)}>
          <Plus className="size-4" /> Add widget
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {widgets.map((id, i) => {
          const def = getWidget(id);
          if (!def) return null;
          const Comp = COMPONENT_MAP[id];
          if (!Comp) return null;
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
              {allowed ? (
                <Comp />
              ) : (
                <LockedWidget def={def} />
              )}
            </div>
          );
        })}
      </div>

      <WidgetStore
        open={storeOpen}
        onClose={() => setStoreOpen(false)}
        activeWidgets={widgets}
        userTier={tier}
        onAdd={addWidget}
      />
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
