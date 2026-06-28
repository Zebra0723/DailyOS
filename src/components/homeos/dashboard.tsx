"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  PoundSterling,
  Truck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import {
  getArrivalsToday,
  getHomeControlScore,
  getMonthlySubscriptionTotal,
  getOpenAlertCounts,
  getPotentialSavings,
  getUpcomingArrivals,
} from "@/lib/homeos/calculations";
import { getRecommendedTodayActions } from "@/lib/homeos/suggestions";
import { relativeLabel } from "@/lib/homeos/dates";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard, Section, HomeEmpty } from "@/components/homeos/ui";
import type { HomeTab } from "@/components/homeos/tabs";

export function HomeOSDashboard({ onNavigate }: { onNavigate: (tab: HomeTab) => void }) {
  const { data, addTodayAction } = useHomeOS();

  const score = getHomeControlScore(data);
  const monthly = getMonthlySubscriptionTotal(data.subscriptions);
  const savings = getPotentialSavings(data.subscriptions);
  const alertCounts = getOpenAlertCounts(data.alerts);
  const today = getArrivalsToday(data.arrivals);
  const upcoming = getUpcomingArrivals(data.arrivals, 14);
  const recommended = getRecommendedTodayActions(data);
  const decisions =
    data.subscriptions.filter(
      (s) => s.status === "Reviewing" || s.status === "Cancel Soon" || s.status === "Trial",
    ).length + recommended.length;

  const scoreTone =
    score.score >= 75 ? "green" : score.score >= 55 ? "amber" : "red";

  return (
    <div className="space-y-6">
      {/* Home Control Score */}
      <Card
        className={
          scoreTone === "green"
            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5"
            : scoreTone === "amber"
              ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5"
              : "border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5"
        }
      >
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={
                "grid size-20 shrink-0 place-items-center rounded-2xl text-3xl font-bold text-white " +
                (scoreTone === "green"
                  ? "bg-emerald-500"
                  : scoreTone === "amber"
                    ? "bg-amber-500"
                    : "bg-red-500")
              }
            >
              {score.score}
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Activity className="size-3.5" /> Home Control Score
              </div>
              <p className="text-xl font-bold">{score.label}</p>
              <p className="mt-0.5 max-w-md text-sm text-muted-foreground">
                {score.explanation}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => onNavigate("alerts")}>
            View alerts <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Today at Home"
          value={today.length}
          hint={today.length ? today[0].title : "Nothing scheduled"}
          icon={CalendarClock}
          tone={today.length ? "primary" : "default"}
          onClick={() => onNavigate("arrivals")}
        />
        <StatCard
          label="Money Watch"
          value={`£${monthly.toFixed(0)}/mo`}
          hint={savings > 0 ? `£${savings.toFixed(0)}/mo potential savings` : "Subscriptions"}
          icon={PoundSterling}
          tone={savings > 0 ? "amber" : "default"}
          onClick={() => onNavigate("subscriptions")}
        />
        <StatCard
          label="Open Home Alerts"
          value={alertCounts.open}
          hint={`${alertCounts.critical} critical · ${alertCounts.warning} warning`}
          icon={AlertTriangle}
          tone={alertCounts.critical > 0 ? "red" : alertCounts.open > 0 ? "amber" : "green"}
          onClick={() => onNavigate("alerts")}
        />
        <StatCard
          label="Decisions Needed"
          value={decisions}
          hint="Trials, reviews & cancellations"
          icon={Sparkles}
          tone={decisions > 0 ? "amber" : "default"}
          onClick={() => onNavigate("subscriptions")}
        />
        <StatCard
          label="Upcoming Arrivals"
          value={upcoming.length}
          hint={upcoming.length ? `Next: ${relativeLabel(upcoming[0].expectedDate)}` : "None in 14 days"}
          icon={Truck}
          onClick={() => onNavigate("arrivals")}
        />
        <StatCard
          label="Sent to Today"
          value={data.todayActions.length}
          hint="Pushed to DailyOS Today"
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      {/* Recommended actions */}
      <Section
        title="Recommended next actions"
        description="The most useful things to do around the home right now."
      >
        {recommended.length === 0 ? (
          <HomeEmpty message="Nothing pressing — your home is under control. 🎉" />
        ) : (
          <div className="grid gap-2">
            {recommended.map((a, i) => {
              const alreadySent = data.todayActions.some(
                (t) => t.title === a.title,
              );
              return (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.reason} · {a.sourceModule} · ~{a.estimatedMinutes} min
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={alreadySent ? "secondary" : "outline"}
                      disabled={alreadySent}
                      onClick={() =>
                        addTodayAction({
                          title: a.title,
                          source: "HomeOS",
                          sourceModule: a.sourceModule,
                          linkedEntityType: a.linkedEntityType,
                          linkedEntityId: a.linkedEntityId,
                          priority: a.priority,
                          estimatedMinutes: a.estimatedMinutes,
                          status: "Not Started",
                        })
                      }
                    >
                      {alreadySent ? (
                        <>
                          <CheckCircle2 className="size-4" /> Sent
                        </>
                      ) : (
                        <>
                          Add to Today <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {/* Sent to DailyOS Today */}
      {data.todayActions.length > 0 && (
        <Section
          title="Sent to DailyOS Today"
          description="HomeOS actions now living in your DailyOS Today."
        >
          <div className="grid gap-2">
            {data.todayActions.slice(0, 6).map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-3 p-3.5">
                  <CheckCircle2
                    className={
                      "size-4 shrink-0 " +
                      (t.status === "Done" ? "text-emerald-500" : "text-muted-foreground")
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <p className={"font-medium " + (t.status === "Done" ? "line-through opacity-60" : "")}>
                      {t.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.sourceModule} · {t.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
