"use client";

// ----------------------------------------------------------------------------
// Renders an AI-built widget from its spec.
//
// This is the trusted half of the AI Feature Builder: the model chooses which
// blocks to use, and this file decides what a block actually does. Nothing from
// the model is evaluated or injected as markup — every value lands in a text
// node or a known attribute.
// ----------------------------------------------------------------------------

import * as React from "react";
import {
  Activity, BookOpen, Brain, Calendar, Check, Coins, Dumbbell, Flame, Heart,
  Leaf, Moon, Music, Pencil, Smile, Sparkles, Star, Sun, Target, Timer as TimerIcon,
  Utensils, Plus, X, Minus, Play, Pause, RotateCcw, Circle, Trash2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Accent, WidgetIcon, WidgetSpec, WidgetBlock } from "@/lib/widgets/spec";
import {
  applyDailyReset, daysUntil, makeChecklistItem, progressFor, type WidgetState,
} from "@/lib/widgets/state";

const ICONS: Record<WidgetIcon, LucideIcon> = {
  activity: Activity, book: BookOpen, brain: Brain, calendar: Calendar,
  check: Check, coins: Coins, dumbbell: Dumbbell, flame: Flame, heart: Heart,
  leaf: Leaf, moon: Moon, music: Music, pencil: Pencil, smile: Smile,
  sparkles: Sparkles, star: Star, sun: Sun, target: Target, timer: TimerIcon,
  utensils: Utensils,
};

// Written out in full — Tailwind can't see a class name built by interpolation.
const ACCENTS: Record<Accent, { text: string; soft: string; bar: string }> = {
  primary: { text: "text-primary", soft: "bg-primary/10", bar: "bg-primary" },
  emerald: { text: "text-emerald-600 dark:text-emerald-400", soft: "bg-emerald-500/10", bar: "bg-emerald-500" },
  sky: { text: "text-sky-600 dark:text-sky-400", soft: "bg-sky-500/10", bar: "bg-sky-500" },
  amber: { text: "text-amber-600 dark:text-amber-400", soft: "bg-amber-500/10", bar: "bg-amber-500" },
  violet: { text: "text-violet-600 dark:text-violet-400", soft: "bg-violet-500/10", bar: "bg-violet-500" },
  rose: { text: "text-rose-600 dark:text-rose-400", soft: "bg-rose-500/10", bar: "bg-rose-500" },
};

interface BlockProps {
  block: WidgetBlock;
  spec: WidgetSpec;
  state: WidgetState;
  accent: Accent;
  update: (fn: (s: WidgetState) => WidgetState) => void;
  /** Preview mode is read-only — nothing is persisted until the user saves. */
  readOnly?: boolean;
}

function ChecklistBlock({ block, state, accent, update, readOnly }: BlockProps) {
  const [draft, setDraft] = React.useState("");
  if (block.kind !== "checklist") return null;
  const items = state.checklists[block.id] ?? [];

  const toggle = (itemId: string) =>
    update((s) => ({
      ...s,
      checklists: {
        ...s.checklists,
        [block.id]: (s.checklists[block.id] ?? []).map((i) =>
          i.id === itemId ? { ...i, done: !i.done } : i,
        ),
      },
    }));

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    update((s) => ({
      ...s,
      checklists: {
        ...s.checklists,
        [block.id]: [...(s.checklists[block.id] ?? []), makeChecklistItem(text)],
      },
    }));
    setDraft("");
  };

  const remove = (itemId: string) =>
    update((s) => ({
      ...s,
      checklists: {
        ...s.checklists,
        [block.id]: (s.checklists[block.id] ?? []).filter((i) => i.id !== itemId),
      },
    }));

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        {block.label}
        {block.resetDaily && <span className="ml-1.5 opacity-60">· resets daily</span>}
      </p>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">Nothing here yet — add your first below.</p>
      )}

      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <button
              onClick={() => toggle(item.id)}
              disabled={readOnly}
              aria-label={item.done ? `Mark "${item.text}" not done` : `Mark "${item.text}" done`}
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                item.done
                  ? cn(ACCENTS[accent].bar, "border-transparent text-white")
                  : "border-input hover:border-current",
              )}
            >
              {item.done && <Check className="size-3" />}
            </button>
            <span className={cn("flex-1 text-sm", item.done && "line-through opacity-60")}>
              {item.text}
            </span>
            {!readOnly && (
              <button
                onClick={() => remove(item.id)}
                aria-label={`Remove "${item.text}"`}
                className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readOnly && (
        <div className="flex gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Add an item"
            className="h-8 text-sm"
          />
          <Button size="sm" variant="ghost" onClick={add} disabled={!draft.trim()} aria-label="Add item">
            <Plus className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function CounterBlock({ block, state, accent, update, readOnly }: BlockProps) {
  if (block.kind !== "counter") return null;
  const value = state.counters[block.id] ?? 0;

  const bump = (delta: number) =>
    update((s) => ({
      ...s,
      // Never below zero.
      counters: { ...s.counters, [block.id]: Math.max(0, (s.counters[block.id] ?? 0) + delta) },
    }));

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {block.label}
        {block.resetDaily && <span className="ml-1.5 opacity-60">· resets daily</span>}
      </p>
      <div className="flex items-center gap-3">
        <Button
          size="sm" variant="outline" onClick={() => bump(-block.step)}
          disabled={readOnly || value === 0} aria-label={`Decrease ${block.label}`}
        >
          <Minus className="size-4" />
        </Button>
        <div className="flex-1 text-center">
          <span className={cn("text-2xl font-bold tabular-nums", ACCENTS[accent].text)}>{value}</span>
          {block.target && <span className="text-sm text-muted-foreground"> / {block.target}</span>}
          {block.unit && <span className="ml-1 text-xs text-muted-foreground">{block.unit}</span>}
        </div>
        <Button
          size="sm" variant="outline" onClick={() => bump(block.step)}
          disabled={readOnly} aria-label={`Increase ${block.label}`}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProgressBlock({ block, spec, state, accent }: BlockProps) {
  if (block.kind !== "progress") return null;
  const progress = progressFor(spec, state, block.source);
  if (!progress) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted-foreground">{block.label}</p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {progress.value} / {progress.max}
        </p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={block.label}
      >
        <div
          className={cn("h-full rounded-full transition-all", ACCENTS[accent].bar)}
          style={{ width: `${progress.pct}%` }}
        />
      </div>
    </div>
  );
}

function NotesBlock({ block, state, update, readOnly }: BlockProps) {
  if (block.kind !== "notes") return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{block.label}</p>
      <Textarea
        value={state.notes[block.id] ?? ""}
        onChange={(e) => {
          const text = e.target.value;
          update((s) => ({ ...s, notes: { ...s.notes, [block.id]: text } }));
        }}
        placeholder={block.placeholder}
        readOnly={readOnly}
        rows={3}
        className="resize-none text-sm"
      />
    </div>
  );
}

function RatingBlock({ block, state, accent, update, readOnly }: BlockProps) {
  if (block.kind !== "rating") return null;
  const value = state.ratings[block.id] ?? 0;
  const Shape = block.icon === "heart" ? Heart : block.icon === "circle" ? Circle : Star;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{block.label}</p>
      <div className="flex gap-1">
        {Array.from({ length: block.scale }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            disabled={readOnly}
            aria-label={`Rate ${n} of ${block.scale}`}
            aria-pressed={n === value}
            // Tapping the current value clears it, so a mis-tap is undoable.
            onClick={() =>
              update((s) => ({
                ...s,
                ratings: { ...s.ratings, [block.id]: s.ratings[block.id] === n ? 0 : n },
              }))
            }
            className="transition-transform hover:scale-110"
          >
            <Shape
              className={cn(
                "size-5",
                n <= value ? cn(ACCENTS[accent].text, "fill-current") : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function CountdownBlock({ block, state, accent, update, readOnly }: BlockProps) {
  if (block.kind !== "countdown") return null;
  const target = state.dates[block.id] ?? block.targetDate;
  const days = daysUntil(target);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{block.label}</p>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold tabular-nums", ACCENTS[accent].text)}>
          {days === null ? "—" : Math.abs(days)}
        </span>
        <span className="text-sm text-muted-foreground">
          {days === null ? "set a date" : days === 0 ? "today" : days > 0 ? "days to go" : "days ago"}
        </span>
      </div>
      {!readOnly && (
        <Input
          type="date"
          value={target}
          onChange={(e) => {
            const date = e.target.value;
            update((s) => ({ ...s, dates: { ...s.dates, [block.id]: date } }));
          }}
          className="h-8 text-sm"
          aria-label={`${block.label} date`}
        />
      )}
    </div>
  );
}

function TimerBlock({ block, accent, readOnly }: BlockProps) {
  const total = block.kind === "timer" ? block.minutes * 60 : 0;
  const [left, setLeft] = React.useState(total);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // A timer is deliberately not persisted — a countdown that kept running while
  // the tab was closed would be lying about elapsed time.
  if (block.kind !== "timer") return null;

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{block.label}</p>
      <div className="flex items-center gap-3">
        <span className={cn("flex-1 text-2xl font-bold tabular-nums", ACCENTS[accent].text)}>
          {mm}:{ss}
        </span>
        <Button
          size="sm" variant="outline" disabled={readOnly || left === 0}
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? "Pause timer" : "Start timer"}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          size="sm" variant="ghost" disabled={readOnly}
          onClick={() => {
            setRunning(false);
            setLeft(total);
          }}
          aria-label="Reset timer"
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function TextBlock({ block }: BlockProps) {
  if (block.kind !== "text") return null;
  return <p className="text-sm leading-relaxed text-muted-foreground">{block.body}</p>;
}

const BLOCK_RENDERERS: Record<WidgetBlock["kind"], React.ComponentType<BlockProps>> = {
  text: TextBlock,
  checklist: ChecklistBlock,
  counter: CounterBlock,
  progress: ProgressBlock,
  notes: NotesBlock,
  rating: RatingBlock,
  countdown: CountdownBlock,
  timer: TimerBlock,
};

export function AIWidgetBody({
  spec,
  state,
  update,
  readOnly,
}: {
  spec: WidgetSpec;
  state: WidgetState;
  update: (fn: (s: WidgetState) => WidgetState) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      {spec.blocks.map((block) => {
        const Renderer = BLOCK_RENDERERS[block.kind];
        return (
          <Renderer
            key={block.id}
            block={block}
            spec={spec}
            state={state}
            accent={spec.accent}
            update={update}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}

/**
 * A complete AI-built widget card. `onChange` is called with each new state so
 * the caller decides how to persist; `onRemove` renders a delete affordance.
 */
export function AIWidget({
  spec,
  state,
  onChange,
  onRemove,
  readOnly,
}: {
  spec: WidgetSpec;
  state: WidgetState;
  onChange?: (next: WidgetState) => void;
  onRemove?: () => void;
  readOnly?: boolean;
}) {
  const Icon = ICONS[spec.icon] ?? Sparkles;

  // Roll the daily-reset blocks over as soon as the widget is shown on a new day.
  React.useEffect(() => {
    if (readOnly || !onChange) return;
    const rolled = applyDailyReset(spec, state);
    if (rolled !== state) onChange(rolled);
  }, [spec, state, onChange, readOnly]);

  const update = React.useCallback(
    (fn: (s: WidgetState) => WidgetState) => onChange?.(fn(state)),
    [onChange, state],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg", ACCENTS[spec.accent].soft)}>
            <Icon className={cn("size-4", ACCENTS[spec.accent].text)} />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{spec.title}</CardTitle>
            {spec.description && (
              <p className="truncate text-xs text-muted-foreground">{spec.description}</p>
            )}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${spec.title}`}
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        <AIWidgetBody spec={spec} state={state} update={update} readOnly={readOnly} />
      </CardContent>
    </Card>
  );
}
