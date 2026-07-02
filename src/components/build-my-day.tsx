"use client";

import * as React from "react";
import {
  Loader2,
  Plus,
  X,
  Sparkles,
  RotateCcw,
  Target,
  Coffee,
  Utensils,
  Wind,
  CalendarClock,
  Circle,
} from "lucide-react";
import { buildDay } from "@/app/(app)/build-day/actions";
import type { DayPlan, BlockType, Pace } from "@/lib/ai/build-day";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FixedRow = { start: string; end: string; label: string };

// --- Plan intelligence: computed insights, no AI key required ----------------
function blockMins(b: { start: string; end: string }): number {
  const [sh, sm] = b.start.split(":").map(Number);
  const [eh, em] = b.end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}
function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}
function dayStats(blocks: DayPlan["blocks"]) {
  const focusMin = blocks.filter((b) => b.type === "focus").reduce((s, b) => s + blockMins(b), 0);
  const restMin = blocks
    .filter((b) => b.type === "break" || b.type === "wellbeing" || b.type === "meal")
    .reduce((s, b) => s + blockMins(b), 0);
  const focusCount = blocks.filter((b) => b.type === "focus").length;
  const longestFocus = Math.max(0, ...blocks.filter((b) => b.type === "focus").map(blockMins));
  const hasReset = blocks.some((b) => b.type === "wellbeing");

  // One specific, plan-derived coaching line.
  let tip: string;
  if (focusCount === 0) {
    tip = "No focus blocks today — add a goal or two and rebuild to make it count.";
  } else if (longestFocus >= 90) {
    tip = `Your deepest block is ${fmtDuration(longestFocus)} — put your phone in another room for it.`;
  } else if (!hasReset) {
    tip = "It's a packed day — take even one slow-breathing minute to reset.";
  } else if (restMin < focusMin / 5) {
    tip = "Focus outweighs rest today — don't skip the breaks, they're what keep it sustainable.";
  } else {
    tip = "Nicely balanced — start with the first focus block before the day fills up.";
  }
  return { focusMin, restMin, focusCount, tip };
}

const PACES: { key: Pace; label: string; hint: string }[] = [
  { key: "calm", label: "Calm", hint: "Lots of breathing room" },
  { key: "balanced", label: "Balanced", hint: "Steady & sustainable" },
  { key: "focused", label: "Focused", hint: "Longer deep-work blocks" },
];

const BLOCK_STYLE: Record<BlockType, { icon: React.ComponentType<{ className?: string }>; dot: string; chip: string }> = {
  fixed: { icon: CalendarClock, dot: "bg-blue-500", chip: "text-blue-600 dark:text-blue-400" },
  focus: { icon: Target, dot: "bg-primary", chip: "text-primary" },
  admin: { icon: Target, dot: "bg-primary", chip: "text-primary" },
  break: { icon: Coffee, dot: "bg-amber-500", chip: "text-amber-600 dark:text-amber-400" },
  meal: { icon: Utensils, dot: "bg-orange-500", chip: "text-orange-600 dark:text-orange-400" },
  wellbeing: { icon: Wind, dot: "bg-emerald-500", chip: "text-emerald-600 dark:text-emerald-400" },
  buffer: { icon: Circle, dot: "bg-muted-foreground/40", chip: "text-muted-foreground" },
};

export function BuildMyDay() {
  const [dayStart, setDayStart] = React.useState("08:00");
  const [dayEnd, setDayEnd] = React.useState("22:00");
  const [pace, setPace] = React.useState<Pace>("balanced");
  const [fixed, setFixed] = React.useState<FixedRow[]>([{ start: "", end: "", label: "" }]);
  const [goals, setGoals] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<DayPlan | null>(null);

  function setRow(i: number, patch: Partial<FixedRow>) {
    setFixed((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setFixed((rows) => [...rows, { start: "", end: "", label: "" }]);
  }
  function removeRow(i: number) {
    setFixed((rows) => rows.filter((_, idx) => idx !== i));
  }

  async function build() {
    setError(null);
    setLoading(true);
    try {
      const cleanFixed = fixed.filter((r) => r.start && r.end && r.label.trim());
      const goalList = goals
        .split("\n")
        .map((g) => g.trim())
        .filter(Boolean);
      const res = await buildDay({ dayStart, dayEnd, fixed: cleanFixed, goals: goalList, pace });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPlan(res.plan);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Build My Day"
        description="Tell me your hours and what's already booked — I'll build a day that's productive but calm."
      />

      {!plan ? (
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ds">My day starts</Label>
                <Input id="ds" type="time" value={dayStart} onChange={(e) => setDayStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="de">…and ends</Label>
                <Input id="de" type="time" value={dayEnd} onChange={(e) => setDayEnd(e.target.value)} />
              </div>
            </div>

            {/* Pace */}
            <div className="space-y-1.5">
              <Label>Pace</Label>
              <div className="grid grid-cols-3 gap-2">
                {PACES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPace(p.key)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      pace === p.key ? "border-2 border-primary bg-accent/50" : "hover:bg-accent",
                    )}
                  >
                    <span className="block text-sm font-medium">{p.label}</span>
                    <span className="block text-xs text-muted-foreground">{p.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed commitments */}
            <div className="space-y-2">
              <Label>What&apos;s already fixed?</Label>
              <p className="text-xs text-muted-foreground">
                Add anything with a set time — meetings, school run, gym class.
              </p>
              <div className="space-y-2">
                {fixed.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={r.start} onChange={(e) => setRow(i, { start: e.target.value })} className="w-28" />
                    <span className="text-muted-foreground">–</span>
                    <Input type="time" value={r.end} onChange={(e) => setRow(i, { end: e.target.value })} className="w-28" />
                    <Input
                      value={r.label}
                      onChange={(e) => setRow(i, { label: e.target.value })}
                      placeholder="What is it?"
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeRow(i)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Remove"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-4" /> Add a commitment
              </Button>
            </div>

            {/* Goals */}
            <div className="space-y-1.5">
              <Label htmlFor="goals">What do you want to get done?</Label>
              <Textarea
                id="goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder={"One per line, e.g.\nFinish the report\nGym\nCall mum"}
                rows={4}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button className="w-full" onClick={build} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Planning your day…" : "Build my day"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-accent/30">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">{plan.summary}</p>
                <Button variant="ghost" size="sm" onClick={() => setPlan(null)}>
                  <RotateCcw className="size-4" /> Edit
                </Button>
              </div>
              {(() => {
                const s = dayStats(plan.blocks);
                return (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border bg-card p-2.5 text-center">
                        <p className="text-lg font-bold tracking-tight text-primary">
                          {fmtDuration(s.focusMin)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">deep focus</p>
                      </div>
                      <div className="rounded-lg border bg-card p-2.5 text-center">
                        <p className="text-lg font-bold tracking-tight">{s.focusCount}</p>
                        <p className="text-[11px] text-muted-foreground">focus blocks</p>
                      </div>
                      <div className="rounded-lg border bg-card p-2.5 text-center">
                        <p className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                          {fmtDuration(s.restMin)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">rest &amp; breaks</p>
                      </div>
                    </div>
                    <p className="mt-3 flex items-start gap-2 text-sm">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{s.tip}</span>
                    </p>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <div className="space-y-2">
            {plan.blocks.map((b, i) => {
              const style = BLOCK_STYLE[b.type] ?? BLOCK_STYLE.buffer;
              const Icon = style.icon;
              return (
                <div key={i} className="flex gap-3">
                  <div className="w-20 shrink-0 pt-3 text-right text-xs font-medium text-muted-foreground">
                    {b.start}
                    <br />
                    {b.end}
                  </div>
                  <div className="relative flex flex-col items-center">
                    <span className={cn("mt-3 size-2.5 rounded-full", style.dot)} />
                    {i < plan.blocks.length - 1 && <span className="w-px flex-1 bg-border" />}
                  </div>
                  <Card className="mb-1 flex-1">
                    <CardContent className="flex items-start gap-3 p-3">
                      <Icon className={cn("mt-0.5 size-4 shrink-0", style.chip)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{b.title}</p>
                        {b.note && <p className="text-xs text-muted-foreground">{b.note}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {!plan.usedAI && (
            <p className="text-center text-xs text-muted-foreground">
              Planned on-device. Add an AI key for smarter, tailored days.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
