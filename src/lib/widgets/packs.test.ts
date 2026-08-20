import { describe, it, expect } from "vitest";
import { planPack, packIsFullyApplied } from "./packs";
import { WIDGETS } from "@/lib/widgets";
import { FEATURE_KEYS, FEATURE_PACKS, getPack } from "@/lib/features";

const starter = getPack("starter")!;
const PACKS = FEATURE_PACKS;

const plan = (over: Partial<Parameters<typeof planPack>[0]> = {}) =>
  planPack({
    pack: starter,
    currentWidgets: [],
    enabledFeatures: new Set<string>(),
    tier: "pro",
    limit: Infinity,
    ...over,
  });

describe("pack catalogue", () => {
  it("has unique ids", () => {
    const ids = PACKS.map((p) => p.key);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes a starter pack", () => {
    expect(getPack("starter")).toBeTruthy();
  });

  it("only references widgets that actually exist", () => {
    const known = new Set(WIDGETS.map((w) => w.id));
    for (const pack of PACKS) {
      for (const id of pack.widgets) {
        expect(known, `pack "${pack.key}" references unknown widget "${id}"`).toContain(id);
      }
    }
  });

  it("only references features that actually exist", () => {
    for (const pack of PACKS) {
      for (const key of pack.features) {
        expect(FEATURE_KEYS, `pack "${pack.key}" references unknown feature "${key}"`).toContain(key);
      }
    }
  });

  it("gives every pack something to do", () => {
    for (const pack of PACKS) {
      expect(pack.widgets.length + pack.features.length).toBeGreaterThan(0);
    }
  });

  it("keeps the starter pack within the free widget allowance", () => {
    // The starter pack is what a brand-new (free) account is nudged towards —
    // it must not immediately overflow their plan.
    expect(starter.widgets.length).toBeLessThanOrEqual(5);
  });
});

describe("planPack", () => {
  it("adds everything when the dashboard is empty and the plan is generous", () => {
    const p = plan();
    expect(p.widgetsToAdd).toEqual(starter.widgets);
    expect(p.featuresToEnable).toEqual(starter.features);
    expect(p.widgetsNoRoom).toEqual([]);
    expect(p.widgetsLocked).toEqual([]);
  });

  it("skips what's already there instead of duplicating it", () => {
    const p = plan({ currentWidgets: ["tasks-due"], enabledFeatures: ["calendar"] });
    expect(p.widgetsToAdd).not.toContain("tasks-due");
    expect(p.widgetsAlready).toContain("tasks-due");
    expect(p.featuresToEnable).not.toContain("calendar");
    expect(p.featuresAlready).toContain("calendar");
  });

  it("reports what won't fit rather than silently dropping it", () => {
    const p = plan({ limit: 2 });
    expect(p.widgetsToAdd).toHaveLength(2);
    expect(p.widgetsNoRoom).toHaveLength(starter.widgets.length - 2);
  });

  it("fills the allowance in pack order, so the most useful land first", () => {
    const p = plan({ limit: 1 });
    expect(p.widgetsToAdd).toEqual([starter.widgets[0]]);
  });

  it("counts widgets already on the dashboard against the allowance", () => {
    const p = plan({ currentWidgets: ["countdown", "goals"], limit: 3 });
    expect(p.widgetsToAdd).toHaveLength(1);
  });

  it("adds nothing when the allowance is already used up", () => {
    const p = plan({ currentWidgets: ["a", "b", "c", "d", "e"], limit: 5 });
    expect(p.widgetsToAdd).toEqual([]);
    expect(p.widgetsNoRoom.length).toBeGreaterThan(0);
  });

  it("holds back widgets above the user's tier", () => {
    const proPack = { ...starter, widgets: ["ai-builder", "tasks-due"] };
    const p = plan({ pack: proPack, tier: "free" });
    expect(p.widgetsLocked).toContain("ai-builder");
    expect(p.widgetsToAdd).toContain("tasks-due");
  });

  it("lets a Pro user have the Pro widgets", () => {
    const proPack = { ...starter, widgets: ["ai-builder"] };
    expect(plan({ pack: proPack, tier: "pro" }).widgetsToAdd).toContain("ai-builder");
  });

  it("ignores ids with no widget definition rather than adding something unrenderable", () => {
    const bogus = { ...starter, widgets: ["not-a-real-widget", "tasks-due"] };
    const p = plan({ pack: bogus });
    expect(p.widgetsToAdd).toEqual(["tasks-due"]);
    expect(p.widgetsNoRoom).not.toContain("not-a-real-widget");
    expect(p.widgetsLocked).not.toContain("not-a-real-widget");
  });

  it("accepts the enabled features as an array or a Set", () => {
    const asArray = plan({ enabledFeatures: ["tasks"] });
    const asSet = plan({ enabledFeatures: new Set(["tasks"]) });
    expect(asArray.featuresToEnable).toEqual(asSet.featuresToEnable);
  });
});

describe("packIsFullyApplied", () => {
  it("is false for a fresh account", () => {
    expect(packIsFullyApplied(plan())).toBe(false);
  });

  it("is true once everything in the pack is present", () => {
    const p = plan({
      currentWidgets: starter.widgets,
      enabledFeatures: starter.features,
    });
    expect(packIsFullyApplied(p)).toBe(true);
  });

  it("is not fooled into 'applied' when items were only blocked", () => {
    // Nothing to add because there's no room — that is emphatically not "done".
    const p = plan({ currentWidgets: ["a", "b", "c", "d", "e"], limit: 5 });
    expect(p.widgetsToAdd).toEqual([]);
    expect(packIsFullyApplied(p)).toBe(false); // features still pending
  });
});
