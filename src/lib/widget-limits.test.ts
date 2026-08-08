import { describe, it, expect } from "vitest";
import { WIDGETS, WIDGET_LIMITS, widgetLimitFor, nextTierAfter, getWidget } from "./widgets";

describe("widgetLimitFor", () => {
  it("caps free and plus, leaves pro unlimited", () => {
    expect(widgetLimitFor("free")).toBe(5);
    expect(widgetLimitFor("plus")).toBe(12);
    expect(widgetLimitFor("pro")).toBe(Infinity);
  });

  it("treats an unknown or missing tier as free", () => {
    // usePlan can hand back a stale/blank tier before it resolves — the safe
    // default is the smallest allowance, not an unlimited one.
    expect(widgetLimitFor("")).toBe(5);
    expect(widgetLimitFor("enterprise")).toBe(5);
  });

  it("gives each paid tier strictly more room than the one below", () => {
    expect(WIDGET_LIMITS.plus).toBeGreaterThan(WIDGET_LIMITS.free);
    expect(WIDGET_LIMITS.pro).toBeGreaterThan(WIDGET_LIMITS.plus);
  });

  it("lets a free user hold every free widget it could reasonably want", () => {
    // A limit below the number of free widgets would be fine, but a limit of 0
    // or 1 would make the product useless — guard the floor.
    expect(WIDGET_LIMITS.free).toBeGreaterThanOrEqual(3);
  });
});

describe("nextTierAfter", () => {
  it("points free at Plus and Plus at Pro", () => {
    expect(nextTierAfter("free")).toBe("plus");
    expect(nextTierAfter("plus")).toBe("pro");
  });

  it("has nowhere to send a Pro user", () => {
    expect(nextTierAfter("pro")).toBeNull();
  });

  it("treats an unknown tier as free", () => {
    expect(nextTierAfter("")).toBe("plus");
  });
});

describe("widget registry", () => {
  it("has unique ids", () => {
    const ids = WIDGETS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("resolves a known id and rejects an unknown one", () => {
    expect(getWidget("tasks-due")?.name).toBeTruthy();
    expect(getWidget("not-a-widget")).toBeUndefined();
  });

  it("keeps the AI Feature Builder on Pro", () => {
    expect(getWidget("ai-builder")?.tier).toBe("pro");
  });

  it("offers enough free widgets to fill a free dashboard", () => {
    const free = WIDGETS.filter((w) => w.tier === "free");
    expect(free.length).toBeGreaterThanOrEqual(WIDGET_LIMITS.free);
  });
});
