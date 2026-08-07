import { describe, it, expect } from "vitest";
import {
  generatedWidgetSchema,
  normaliseBlocks,
  toWidgetSpec,
  widgetIdFor,
  type WidgetBlock,
} from "./spec";
import { templateFor } from "./templates";

const gymWidget = {
  title: "Gym Tracker",
  description: "Sessions and how they felt.",
  icon: "dumbbell",
  accent: "emerald",
  blocks: [
    { kind: "counter", id: "sessions", label: "Sessions", step: 1, target: 4, unit: "sessions", resetDaily: false },
    { kind: "progress", id: "weekly", label: "Weekly goal", source: "sessions" },
  ],
};

describe("generatedWidgetSchema", () => {
  it("accepts a well-formed widget", () => {
    const parsed = generatedWidgetSchema.parse(gymWidget);
    expect(parsed.title).toBe("Gym Tracker");
    expect(parsed.blocks).toHaveLength(2);
  });

  it("falls back to safe defaults for an unknown icon or accent", () => {
    const parsed = generatedWidgetSchema.parse({
      ...gymWidget,
      icon: "rocket-ship",
      accent: "neon",
    });
    expect(parsed.icon).toBe("sparkles");
    expect(parsed.accent).toBe("primary");
  });

  it("fills in block defaults the model left out", () => {
    const parsed = generatedWidgetSchema.parse({
      ...gymWidget,
      blocks: [{ kind: "counter", id: "c", label: "Count" }],
    });
    const counter = parsed.blocks[0];
    expect(counter.kind).toBe("counter");
    if (counter.kind === "counter") {
      expect(counter.step).toBe(1);
      expect(counter.target).toBeNull();
      expect(counter.resetDaily).toBe(false);
    }
  });

  it("rejects a widget with no blocks", () => {
    expect(() => generatedWidgetSchema.parse({ ...gymWidget, blocks: [] })).toThrow();
  });

  it("rejects an unknown block kind rather than silently dropping it", () => {
    expect(() =>
      generatedWidgetSchema.parse({
        ...gymWidget,
        blocks: [{ kind: "iframe", id: "x", src: "https://example.com" }],
      }),
    ).toThrow();
  });

  it("rejects a countdown with a non-ISO date", () => {
    expect(() =>
      generatedWidgetSchema.parse({
        ...gymWidget,
        blocks: [{ kind: "countdown", id: "c", label: "Until", targetDate: "next Tuesday" }],
      }),
    ).toThrow();
  });
});

describe("normaliseBlocks", () => {
  it("makes duplicate block ids unique", () => {
    const blocks = [
      { kind: "notes", id: "same", label: "A", placeholder: "" },
      { kind: "notes", id: "same", label: "B", placeholder: "" },
    ] as WidgetBlock[];
    const ids = normaliseBlocks(blocks).map((b) => b.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("slugifies an id the model wrote as a sentence", () => {
    const blocks = [
      { kind: "notes", id: "My Notes Block!", label: "A", placeholder: "" },
    ] as WidgetBlock[];
    expect(normaliseBlocks(blocks)[0].id).toBe("my-notes-block");
  });

  it("drops a progress bar pointing at a block that doesn't exist", () => {
    const blocks = [
      { kind: "notes", id: "notes", label: "A", placeholder: "" },
      { kind: "progress", id: "p", label: "Progress", source: "ghost" },
    ] as WidgetBlock[];
    expect(normaliseBlocks(blocks).map((b) => b.kind)).toEqual(["notes"]);
  });

  it("drops a progress bar measuring a counter that has no target", () => {
    const blocks = [
      { kind: "counter", id: "c", label: "Count", step: 1, target: null, unit: null, resetDaily: false },
      { kind: "progress", id: "p", label: "Progress", source: "c" },
    ] as WidgetBlock[];
    expect(normaliseBlocks(blocks).map((b) => b.kind)).toEqual(["counter"]);
  });

  it("keeps a progress bar measuring a checklist", () => {
    const blocks = [
      { kind: "checklist", id: "list", label: "Items", items: ["a"], resetDaily: false },
      { kind: "progress", id: "p", label: "Progress", source: "list" },
    ] as WidgetBlock[];
    expect(normaliseBlocks(blocks)).toHaveLength(2);
  });
});

describe("widgetIdFor", () => {
  it("slugifies the title", () => {
    expect(widgetIdFor("Gym Tracker", [])).toBe("gym-tracker");
  });

  it("suffixes when the id is taken", () => {
    expect(widgetIdFor("Gym Tracker", ["gym-tracker"])).toBe("gym-tracker-2");
    expect(widgetIdFor("Gym Tracker", ["gym-tracker", "gym-tracker-2"])).toBe("gym-tracker-3");
  });

  it("falls back for a title with no usable characters", () => {
    expect(widgetIdFor("!!!", [])).toBe("widget");
  });
});

describe("toWidgetSpec", () => {
  it("stamps id, source and createdAt and normalises blocks", () => {
    const generated = generatedWidgetSchema.parse({
      ...gymWidget,
      blocks: [
        ...gymWidget.blocks,
        { kind: "progress", id: "dangling", label: "Nope", source: "missing" },
      ],
    });
    const spec = toWidgetSpec(generated, { id: "gym-tracker", createdAt: "2026-08-06T00:00:00Z" });
    expect(spec.id).toBe("gym-tracker");
    expect(spec.source).toBe("ai");
    expect(spec.createdAt).toBe("2026-08-06T00:00:00Z");
    expect(spec.blocks.map((b) => b.id)).toEqual(["sessions", "weekly"]);
  });
});

describe("templateFor", () => {
  it("matches fitness wording", () => {
    expect(templateFor("track my gym workouts").icon).toBe("dumbbell");
  });

  it("prefers the template matching the most keywords", () => {
    // "water" appears once, gym/workout twice — fitness should win.
    expect(templateFor("gym workout tracker, also water").icon).toBe("dumbbell");
  });

  it("falls back to a generic tracker for an unmatched description", () => {
    const spec = templateFor("something entirely unrelated");
    expect(spec.blocks.length).toBeGreaterThan(0);
  });

  it("always produces a spec that validates", () => {
    const prompts = [
      "gym tracker",
      "reading list",
      "water intake",
      "monthly budget",
      "mood journal",
      "meal planner",
      "sleep log",
      "study sessions",
      "daily habits",
      "countdown to my holiday",
      "completely unmatched request",
    ];
    for (const p of prompts) {
      expect(() => generatedWidgetSchema.parse(templateFor(p))).not.toThrow();
    }
  });

  it("builds the title from the user's own words", () => {
    expect(templateFor("build me a marathon training log").title).toMatch(/marathon/i);
  });
});
