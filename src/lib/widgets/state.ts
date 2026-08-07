// ----------------------------------------------------------------------------
// Widget state — one user's data for one widget.
//
// Kept separate from the spec so ticking a checkbox doesn't rewrite the widget
// definition, and so a spec can be edited later without discarding the data
// already in it.
// ----------------------------------------------------------------------------

import type { WidgetSpec, WidgetBlock } from "./spec";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface WidgetState {
  checklists: Record<string, ChecklistItem[]>;
  counters: Record<string, number>;
  notes: Record<string, string>;
  ratings: Record<string, number>;
  /** User overrides for countdown target dates. */
  dates: Record<string, string>;
  /** The local day (YYYY-MM-DD) the resetDaily fields were last valid for. */
  day: string;
}

/** Local calendar day, not UTC — a tick at 11pm shouldn't belong to tomorrow. */
export function localDay(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

let seq = 0;
function itemId(): string {
  seq += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return `i${seq}${Math.random().toString(36).slice(2, 6)}`;
}

export function makeChecklistItem(text: string): ChecklistItem {
  return { id: itemId(), text, done: false };
}

/** A fresh state for a spec, with checklists seeded from the spec's items. */
export function emptyState(spec: WidgetSpec, now: Date = new Date()): WidgetState {
  const state: WidgetState = {
    checklists: {},
    counters: {},
    notes: {},
    ratings: {},
    dates: {},
    day: localDay(now),
  };

  for (const block of spec.blocks) {
    switch (block.kind) {
      case "checklist":
        state.checklists[block.id] = block.items.map(makeChecklistItem);
        break;
      case "counter":
        state.counters[block.id] = 0;
        break;
      case "notes":
        state.notes[block.id] = "";
        break;
      case "rating":
        state.ratings[block.id] = 0;
        break;
      case "countdown":
        state.dates[block.id] = block.targetDate;
        break;
      default:
        break;
    }
  }

  return state;
}

/**
 * Clear the blocks marked `resetDaily` when the local day has rolled over.
 * Returns the same object when nothing changed, so callers can skip a write.
 */
export function applyDailyReset(
  spec: WidgetSpec,
  state: WidgetState,
  now: Date = new Date(),
): WidgetState {
  const today = localDay(now);
  if (state.day === today) return state;

  const next: WidgetState = {
    ...state,
    checklists: { ...state.checklists },
    counters: { ...state.counters },
    ratings: { ...state.ratings },
    day: today,
  };

  for (const block of spec.blocks) {
    if (block.kind === "checklist" && block.resetDaily) {
      next.checklists[block.id] = (state.checklists[block.id] ?? []).map((i) => ({
        ...i,
        done: false,
      }));
    } else if (block.kind === "counter" && block.resetDaily) {
      next.counters[block.id] = 0;
    } else if (block.kind === "rating") {
      // A rating is a reading for a given day, so it always starts blank.
      next.ratings[block.id] = 0;
    }
  }

  return next;
}

/**
 * Repair state against a spec that has changed (blocks added, removed or
 * retyped). Missing entries are seeded; nothing existing is discarded, so
 * re-adding a removed block brings its data back.
 */
export function reconcileState(
  spec: WidgetSpec,
  state: Partial<WidgetState> | null | undefined,
  now: Date = new Date(),
): WidgetState {
  const base = emptyState(spec, now);
  if (!state) return base;

  return {
    checklists: { ...base.checklists, ...(state.checklists ?? {}) },
    counters: { ...base.counters, ...(state.counters ?? {}) },
    notes: { ...base.notes, ...(state.notes ?? {}) },
    ratings: { ...base.ratings, ...(state.ratings ?? {}) },
    dates: { ...base.dates, ...(state.dates ?? {}) },
    day: state.day ?? base.day,
  };
}

export interface Progress {
  value: number;
  max: number;
  /** 0–100, clamped. */
  pct: number;
}

/**
 * What a `progress` block should show. Measures either a checklist (items
 * ticked) or a counter with a target. Returns null when the source has gone
 * missing, so the renderer can skip the bar instead of drawing a broken one.
 */
export function progressFor(
  spec: WidgetSpec,
  state: WidgetState,
  sourceId: string,
): Progress | null {
  const source: WidgetBlock | undefined = spec.blocks.find((b) => b.id === sourceId);
  if (!source) return null;

  if (source.kind === "checklist") {
    const items = state.checklists[source.id] ?? [];
    const done = items.filter((i) => i.done).length;
    return {
      value: done,
      max: items.length,
      pct: items.length === 0 ? 0 : Math.round((done / items.length) * 100),
    };
  }

  if (source.kind === "counter" && source.target) {
    const value = state.counters[source.id] ?? 0;
    return {
      value,
      max: source.target,
      // Clamp: going past a target shouldn't overflow the bar.
      pct: Math.min(100, Math.round((value / source.target) * 100)),
    };
  }

  return null;
}

/** Whole days from today until an ISO date. Negative once it's past. */
export function daysUntil(isoDate: string, now: Date = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [y, m, d] = isoDate.split("-").map(Number);
  // Compare calendar days in local time, so a target "today" reads as 0 rather
  // than drifting by a day either side of midnight UTC.
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
