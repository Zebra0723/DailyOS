import { describe, it, expect } from "vitest";
import { widgetSpecSchema, type WidgetSpec } from "./spec";
import {
  applyDailyReset,
  daysUntil,
  emptyState,
  localDay,
  progressFor,
  reconcileState,
} from "./state";

function spec(blocks: unknown[]): WidgetSpec {
  return widgetSpecSchema.parse({
    id: "w",
    title: "W",
    description: "",
    icon: "star",
    accent: "primary",
    blocks,
    source: "ai",
    createdAt: "",
  });
}

const habitSpec = spec([
  { kind: "checklist", id: "habits", label: "Habits", items: ["Walk", "Read"], resetDaily: true },
  { kind: "counter", id: "water", label: "Water", step: 1, target: 8, unit: "glasses", resetDaily: true },
  { kind: "counter", id: "books", label: "Books", step: 1, target: 12, unit: "books", resetDaily: false },
  { kind: "rating", id: "mood", label: "Mood", scale: 5, icon: "star" },
]);

describe("emptyState", () => {
  it("seeds checklists from the spec's items", () => {
    const s = emptyState(habitSpec);
    expect(s.checklists.habits.map((i) => i.text)).toEqual(["Walk", "Read"]);
    expect(s.checklists.habits.every((i) => !i.done)).toBe(true);
  });

  it("gives checklist items distinct ids", () => {
    const s = emptyState(habitSpec);
    const ids = s.checklists.habits.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("zeroes counters and ratings", () => {
    const s = emptyState(habitSpec);
    expect(s.counters.water).toBe(0);
    expect(s.ratings.mood).toBe(0);
  });
});

describe("applyDailyReset", () => {
  it("does nothing on the same day", () => {
    const s = emptyState(habitSpec, new Date(2026, 7, 6));
    s.counters.water = 3;
    const next = applyDailyReset(habitSpec, s, new Date(2026, 7, 6));
    expect(next).toBe(s);
    expect(next.counters.water).toBe(3);
  });

  it("clears resetDaily blocks when the day rolls over", () => {
    const s = emptyState(habitSpec, new Date(2026, 7, 6));
    s.counters.water = 5;
    s.counters.books = 4;
    s.checklists.habits[0].done = true;
    s.ratings.mood = 4;

    const next = applyDailyReset(habitSpec, s, new Date(2026, 7, 7));
    expect(next.counters.water).toBe(0);
    expect(next.checklists.habits.every((i) => !i.done)).toBe(true);
    expect(next.ratings.mood).toBe(0);
    expect(next.day).toBe("2026-08-07");
  });

  it("leaves non-daily counters alone across a day boundary", () => {
    const s = emptyState(habitSpec, new Date(2026, 7, 6));
    s.counters.books = 4;
    const next = applyDailyReset(habitSpec, s, new Date(2026, 7, 7));
    expect(next.counters.books).toBe(4);
  });

  it("keeps checklist item text when clearing ticks", () => {
    const s = emptyState(habitSpec, new Date(2026, 7, 6));
    s.checklists.habits[0].done = true;
    const next = applyDailyReset(habitSpec, s, new Date(2026, 7, 7));
    expect(next.checklists.habits.map((i) => i.text)).toEqual(["Walk", "Read"]);
  });

  it("does not mutate the state it was given", () => {
    const s = emptyState(habitSpec, new Date(2026, 7, 6));
    s.counters.water = 5;
    applyDailyReset(habitSpec, s, new Date(2026, 7, 7));
    expect(s.counters.water).toBe(5);
  });
});

describe("reconcileState", () => {
  it("seeds blocks added since the state was written", () => {
    const s = reconcileState(habitSpec, { counters: { water: 2 }, day: "2026-08-06" });
    expect(s.counters.water).toBe(2);
    expect(s.ratings.mood).toBe(0);
    expect(s.checklists.habits).toHaveLength(2);
  });

  it("returns a full empty state for null", () => {
    const s = reconcileState(habitSpec, null);
    expect(s.counters.water).toBe(0);
  });

  it("keeps data for a block no longer in the spec", () => {
    const s = reconcileState(habitSpec, { counters: { water: 2, removed: 9 }, day: "2026-08-06" });
    expect(s.counters.removed).toBe(9);
  });
});

describe("progressFor", () => {
  it("measures a checklist by items ticked", () => {
    const s = emptyState(habitSpec);
    s.checklists.habits[0].done = true;
    expect(progressFor(habitSpec, s, "habits")).toEqual({ value: 1, max: 2, pct: 50 });
  });

  it("measures a counter against its target", () => {
    const s = emptyState(habitSpec);
    s.counters.water = 2;
    expect(progressFor(habitSpec, s, "water")).toEqual({ value: 2, max: 8, pct: 25 });
  });

  it("clamps past 100% when the user overshoots the target", () => {
    const s = emptyState(habitSpec);
    s.counters.water = 20;
    expect(progressFor(habitSpec, s, "water")?.pct).toBe(100);
  });

  it("reports 0% for an empty checklist rather than dividing by zero", () => {
    const empty = spec([{ kind: "checklist", id: "l", label: "L", items: [], resetDaily: false }]);
    const s = emptyState(empty);
    expect(progressFor(empty, s, "l")).toEqual({ value: 0, max: 0, pct: 0 });
  });

  it("returns null for a missing source", () => {
    expect(progressFor(habitSpec, emptyState(habitSpec), "ghost")).toBeNull();
  });

  it("returns null for a counter with no target", () => {
    const noTarget = spec([
      { kind: "counter", id: "c", label: "C", step: 1, target: null, unit: null, resetDaily: false },
    ]);
    expect(progressFor(noTarget, emptyState(noTarget), "c")).toBeNull();
  });
});

describe("daysUntil", () => {
  it("counts whole days ahead", () => {
    expect(daysUntil("2026-08-10", new Date(2026, 7, 6))).toBe(4);
  });

  it("reads today as 0", () => {
    expect(daysUntil("2026-08-06", new Date(2026, 7, 6))).toBe(0);
  });

  it("goes negative once the date is past", () => {
    expect(daysUntil("2026-08-01", new Date(2026, 7, 6))).toBe(-5);
  });

  it("is unaffected by the time of day", () => {
    expect(daysUntil("2026-08-10", new Date(2026, 7, 6, 23, 59))).toBe(4);
    expect(daysUntil("2026-08-10", new Date(2026, 7, 6, 0, 1))).toBe(4);
  });

  it("survives a month boundary", () => {
    expect(daysUntil("2026-09-01", new Date(2026, 7, 30))).toBe(2);
  });

  it("returns null for a malformed date", () => {
    expect(daysUntil("soon")).toBeNull();
  });
});

describe("localDay", () => {
  it("uses local time, not UTC", () => {
    // 23:30 local on the 6th is the 6th, whatever UTC says.
    expect(localDay(new Date(2026, 7, 6, 23, 30))).toBe("2026-08-06");
  });

  it("zero-pads", () => {
    expect(localDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
