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
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  ArrowDownUp,
  MapPin,
  Bed,
} from "lucide-react";
import { buildDay, estimateTravel } from "@/app/(app)/build-day/actions";
import type {
  DayPlan,
  DayBlock,
  BlockType,
  Pace,
  MealPrefs,
  TravelPlan,
  TravelMode,
  EnergyPeak,
} from "@/lib/ai/build-day";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveRemote, debounce } from "@/lib/sync";

type FixedRow = { start: string; end: string; label: string };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const debouncedSave = debounce((plan: DayPlan) => {
  void saveRemote("day-plan", {
    date: todayStr(),
    blocks: plan.blocks,
    summary: plan.summary,
  });
}, 500);

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
  fixed: { icon: CalendarClock, dot: "bg-stone-500", chip: "text-stone-600 dark:text-stone-400" },
  focus: { icon: Target, dot: "bg-primary", chip: "text-primary" },
  admin: { icon: Target, dot: "bg-primary", chip: "text-primary" },
  break: { icon: Coffee, dot: "bg-amber-500", chip: "text-amber-600 dark:text-amber-400" },
  meal: { icon: Utensils, dot: "bg-orange-500", chip: "text-orange-600 dark:text-orange-400" },
  wellbeing: { icon: Wind, dot: "bg-emerald-500", chip: "text-emerald-600 dark:text-emerald-400" },
  buffer: { icon: Circle, dot: "bg-muted-foreground/40", chip: "text-muted-foreground" },
  travel: { icon: MapPin, dot: "bg-sky-500", chip: "text-sky-600 dark:text-sky-400" },
};

const BLOCK_TYPES: BlockType[] = [
  "focus",
  "fixed",
  "break",
  "meal",
  "wellbeing",
  "admin",
  "travel",
  "buffer",
];

const MODES: { key: TravelMode; label: string }[] = [
  { key: "walk", label: "Walk" },
  { key: "cycle", label: "Cycle" },
  { key: "transit", label: "Transit" },
  { key: "drive", label: "Drive" },
];

const ENERGY: { key: EnergyPeak; label: string }[] = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
];

export function BuildMyDay() {
  const [dayStart, setDayStart] = React.useState("08:00");
  const [dayEnd, setDayEnd] = React.useState("22:00");
  const [pace, setPace] = React.useState<Pace>("balanced");
  const [fixed, setFixed] = React.useState<FixedRow[]>([{ start: "", end: "", label: "" }]);
  const [tasks, setTasks] = React.useState<string[]>([""]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<DayPlan | null>(null);
  const [editing, setEditing] = React.useState<number | null>(null);

  // Optimisation questions.
  const [energyPeak, setEnergyPeak] = React.useState<EnergyPeak>("morning");
  const [meals, setMeals] = React.useState<MealPrefs>({
    breakfast: false,
    lunch: true,
    dinner: false,
  });
  const [travelOn, setTravelOn] = React.useState(false);
  const [travel, setTravel] = React.useState<TravelPlan>({
    start: "",
    destination: "",
    mode: "drive",
    arriveBy: "09:00",
    travelMins: 30,
    getReadyMins: 45,
  });
  const [estimating, setEstimating] = React.useState(false);
  const [estimateMsg, setEstimateMsg] = React.useState<string | null>(null);

  function setTravelField<K extends keyof TravelPlan>(key: K, value: TravelPlan[K]) {
    setTravel((t) => ({ ...t, [key]: value }));
  }
  function toggleMeal(key: "breakfast" | "lunch" | "dinner") {
    setMeals((m) => ({ ...m, [key]: !m[key] }));
  }

  async function estimate() {
    if (!travel.destination.trim()) {
      setEstimateMsg("Add where you're going first.");
      return;
    }
    setEstimating(true);
    setEstimateMsg(null);
    try {
      const res = await estimateTravel({
        start: travel.start,
        destination: travel.destination,
        mode: travel.mode,
      });
      if (res.minutes && res.minutes > 0) {
        setTravelField("travelMins", res.minutes);
        setEstimateMsg(`Estimated ~${res.minutes} min — adjust if you know better.`);
      } else {
        setEstimateMsg("Couldn't estimate automatically — enter the minutes yourself.");
      }
    } catch {
      setEstimateMsg("Couldn't estimate — enter the minutes yourself.");
    } finally {
      setEstimating(false);
    }
  }

  // --- Editing the generated plan (the auto-plan is a starting point) --------
  function setBlocks(next: DayBlock[]) {
    setPlan((p) => {
      if (!p) return p;
      const updated = { ...p, blocks: next };
      debouncedSave(updated);
      return updated;
    });
  }
  function moveBlock(i: number, dir: -1 | 1) {
    setPlan((p) => {
      if (!p) return p;
      const j = i + dir;
      if (j < 0 || j >= p.blocks.length) return p;
      const next = [...p.blocks];
      // Swap the two blocks' CONTENT but keep each time slot where it is, so the
      // schedule stays in chronological order — the activity just moves earlier
      // or later, taking on that slot's time.
      const a = next[i];
      const b = next[j];
      next[i] = { ...b, start: a.start, end: a.end };
      next[j] = { ...a, start: b.start, end: b.end };
      return { ...p, blocks: next };
    });
    setEditing(null);
  }
  function deleteBlock(i: number) {
    if (!plan) return;
    setBlocks(plan.blocks.filter((_, idx) => idx !== i));
    setEditing(null);
  }
  function patchBlock(i: number, patch: Partial<DayBlock>) {
    if (!plan) return;
    setBlocks(plan.blocks.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function addBlock() {
    if (!plan) return;
    const last = plan.blocks[plan.blocks.length - 1];
    const start = last?.end ?? dayStart;
    setBlocks([
      ...plan.blocks,
      { start, end: start, title: "New block", type: "focus" },
    ]);
    setEditing(plan.blocks.length);
  }
  function sortByTime() {
    if (!plan) return;
    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    setBlocks([...plan.blocks].sort((a, b) => toMin(a.start) - toMin(b.start)));
    setEditing(null);
  }

  function setRow(i: number, patch: Partial<FixedRow>) {
    setFixed((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setFixed((rows) => [...rows, { start: "", end: "", label: "" }]);
  }
  function removeRow(i: number) {
    setFixed((rows) => rows.filter((_, idx) => idx !== i));
  }

  function setTask(i: number, value: string) {
    setTasks((t) => t.map((x, idx) => (idx === i ? value : x)));
  }
  function addTask() {
    setTasks((t) => [...t, ""]);
  }
  function removeTask(i: number) {
    setTasks((t) => (t.length === 1 ? [""] : t.filter((_, idx) => idx !== i)));
  }

  async function build() {
    setError(null);
    setLoading(true);
    try {
      const cleanFixed = fixed.filter((r) => r.start && r.end && r.label.trim());
      const goalList = tasks.map((g) => g.trim()).filter(Boolean);
      const useTravel =
        travelOn && travel.destination.trim() && travel.arriveBy && travel.travelMins > 0;
      const res = await buildDay({
        dayStart,
        dayEnd,
        fixed: cleanFixed,
        goals: goalList,
        pace,
        meals,
        energyPeak,
        travel: useTravel ? travel : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPlan(res.plan);
      debouncedSave(res.plan);
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
                <TimePicker id="ds" value={dayStart} onChange={setDayStart} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="de">…and ends</Label>
                <TimePicker id="de" value={dayEnd} onChange={setDayEnd} />
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
                  <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <TimePicker value={r.start} onChange={(v) => setRow(i, { start: v })} className="w-full sm:w-28" />
                      <span className="text-muted-foreground">–</span>
                      <TimePicker value={r.end} onChange={(v) => setRow(i, { end: v })} className="w-full sm:w-28" />
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <Input
                        value={r.label}
                        onChange={(e) => setRow(i, { label: e.target.value })}
                        placeholder="What is it?"
                        className="flex-1"
                      />
                      <button
                        onClick={() => removeRow(i)}
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Remove"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-4" /> Add a commitment
              </Button>
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              <Label>What do you want to get done?</Label>
              <p className="text-xs text-muted-foreground">
                Add each thing you want to do — I&apos;ll fit them naturally
                across your day.
              </p>
              <div className="space-y-2">
                {tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={t}
                      onChange={(e) => setTask(i, e.target.value)}
                      placeholder={
                        i === 0
                          ? "e.g. Finish the report"
                          : "Add another task"
                      }
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeTask(i)}
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Remove task"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addTask}>
                <Plus className="size-4" /> Add a task
              </Button>
            </div>

            {/* Energy peak — helps place demanding work well */}
            <div className="space-y-1.5">
              <Label>When&apos;s your energy highest?</Label>
              <p className="text-xs text-muted-foreground">
                I&apos;ll schedule your most demanding work then.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ENERGY.map((e) => (
                  <button
                    key={e.key}
                    type="button"
                    onClick={() => setEnergyPeak(e.key)}
                    className={cn(
                      "rounded-xl border p-2.5 text-sm font-medium transition-colors",
                      energyPeak === e.key ? "border-2 border-primary bg-accent/50" : "hover:bg-accent",
                    )}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-1.5">
              <Label>Meals to fit in</Label>
              <p className="text-xs text-muted-foreground">
                I&apos;ll place these and plan the day around them.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => toggleMeal(meal)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-sm font-medium capitalize transition-colors",
                      meals[meal] ? "border-2 border-primary bg-accent/50" : "hover:bg-accent",
                    )}
                  >
                    <Utensils className="size-3.5" /> {meal}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) =>
                  meals[meal] ? (
                    <TimePicker
                      key={meal}
                      value={
                        meal === "breakfast"
                          ? meals.breakfastAt ?? ""
                          : meal === "lunch"
                            ? meals.lunchAt ?? ""
                            : meals.dinnerAt ?? ""
                      }
                      onChange={(v) =>
                        setMeals((m) => ({
                          ...m,
                          [`${meal}At`]: v,
                        }))
                      }
                      className="w-full"
                    />
                  ) : (
                    <span key={meal} />
                  ),
                )}
              </div>
            </div>

            {/* Travel */}
            <div className="space-y-2 rounded-xl border p-3">
              <button
                type="button"
                onClick={() => setTravelOn((v) => !v)}
                className="flex w-full items-center justify-between"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4 text-sky-500" /> Getting somewhere today?
                </span>
                <span
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    travelOn ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white transition-all",
                      travelOn ? "left-[18px]" : "left-0.5",
                    )}
                  />
                </span>
              </button>

              {travelOn && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Tell me where and by when — I&apos;ll work out when to leave
                    and when to wake up.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>From</Label>
                      <Input
                        value={travel.start}
                        onChange={(e) => setTravelField("start", e.target.value)}
                        placeholder="Home"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>To</Label>
                      <Input
                        value={travel.destination}
                        onChange={(e) => setTravelField("destination", e.target.value)}
                        placeholder="Where you're going"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>How</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {MODES.map((mode) => (
                        <button
                          key={mode.key}
                          type="button"
                          onClick={() => setTravelField("mode", mode.key)}
                          className={cn(
                            "rounded-lg border p-2 text-xs font-medium transition-colors",
                            travel.mode === mode.key
                              ? "border-2 border-primary bg-accent/50"
                              : "hover:bg-accent",
                          )}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Arrive by</Label>
                      <TimePicker
                        value={travel.arriveBy}
                        onChange={(v) => setTravelField("arriveBy", v)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Time to get ready (mins)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={travel.getReadyMins}
                        onChange={(e) =>
                          setTravelField("getReadyMins", Math.max(0, Number(e.target.value) || 0))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Journey time (mins)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={travel.travelMins}
                        onChange={(e) =>
                          setTravelField("travelMins", Math.max(1, Number(e.target.value) || 1))
                        }
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={estimate}
                        disabled={estimating}
                      >
                        {estimating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                        Estimate
                      </Button>
                    </div>
                    {estimateMsg && (
                      <p className="text-xs text-muted-foreground">{estimateMsg}</p>
                    )}
                  </div>
                </div>
              )}
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
                  <RotateCcw className="size-4" /> Rebuild
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

          {(plan.leaveBy || plan.wakeUp) && (
            <Card className="border-sky-300 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/10">
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-5">
                {plan.wakeUp && (
                  <div className="flex items-center gap-2">
                    <Bed className="size-5 text-sky-600 dark:text-sky-400" />
                    <div>
                      <p className="text-lg font-bold tracking-tight">{plan.wakeUp}</p>
                      <p className="text-[11px] text-muted-foreground">wake up</p>
                    </div>
                  </div>
                )}
                {plan.leaveBy && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-sky-600 dark:text-sky-400" />
                    <div>
                      <p className="text-lg font-bold tracking-tight">{plan.leaveBy}</p>
                      <p className="text-[11px] text-muted-foreground">leave by</p>
                    </div>
                  </div>
                )}
                {plan.travelNote && (
                  <p className="flex-1 text-sm text-muted-foreground">{plan.travelNote}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Your schedule — tweak anything below
            </p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={sortByTime}>
                <ArrowDownUp className="size-4" /> Sort by time
              </Button>
              <Button variant="outline" size="sm" onClick={addBlock}>
                <Plus className="size-4" /> Add block
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {plan.blocks.map((b, i) => {
              const style = BLOCK_STYLE[b.type] ?? BLOCK_STYLE.buffer;
              const Icon = style.icon;
              const isEditing = editing === i;
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
                    {isEditing ? (
                      <CardContent className="space-y-3 p-3">
                        <Input
                          value={b.title}
                          onChange={(e) => patchBlock(i, { title: e.target.value })}
                          placeholder="What is this block?"
                          className="h-9"
                        />
                        <div className="flex items-center gap-2">
                          <TimePicker
                            value={b.start}
                            onChange={(v) => patchBlock(i, { start: v })}
                            className="h-9 w-28"
                          />
                          <span className="text-muted-foreground">–</span>
                          <TimePicker
                            value={b.end}
                            onChange={(v) => patchBlock(i, { end: v })}
                            className="h-9 w-28"
                          />
                          <select
                            value={b.type}
                            onChange={(e) =>
                              patchBlock(i, { type: e.target.value as BlockType })
                            }
                            className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm"
                          >
                            {BLOCK_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBlock(i)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" /> Delete
                          </Button>
                          <Button size="sm" onClick={() => setEditing(null)}>
                            <Check className="size-4" /> Done
                          </Button>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="flex items-start gap-3 p-3">
                        <Icon className={cn("mt-0.5 size-4 shrink-0", style.chip)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{b.title}</p>
                          {b.note && (
                            <p className="text-xs text-muted-foreground">{b.note}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center">
                          <button
                            onClick={() => moveBlock(i, -1)}
                            disabled={i === 0}
                            className="grid size-7 place-items-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Move up"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            onClick={() => moveBlock(i, 1)}
                            disabled={i === plan.blocks.length - 1}
                            className="grid size-7 place-items-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                            aria-label="Move down"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                          <button
                            onClick={() => setEditing(i)}
                            className="grid size-7 place-items-center rounded text-muted-foreground hover:text-foreground"
                            aria-label="Edit block"
                          >
                            <Pencil className="size-4" />
                          </button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {!plan.usedAI && (
            <p className="text-center text-xs text-muted-foreground">
              Planned on-device, then yours to rearrange. Add an AI key for
              smarter first drafts.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
