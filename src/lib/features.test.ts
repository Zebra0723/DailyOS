import { describe, it, expect } from "vitest";
import {
  FEATURES,
  TOGGLEABLE_FEATURES,
  allFeatureKeys,
  starterFeatureKeys,
  defaultFeatureKeys,
  normaliseFeatureKeys,
  isFeatureVisible,
  getFeature,
  FEATURE_CHOICE_LAUNCH_ISO,
  FEATURE_PACKS,
  getPack,
  applyPack,
  isPackApplied,
} from "./features";

const before = "2026-01-01T00:00:00.000Z"; // predates feature choice
const after = "2026-12-01T00:00:00.000Z"; // created since

describe("feature catalogue", () => {
  it("has unique keys and hrefs", () => {
    expect(new Set(FEATURES.map((f) => f.key)).size).toBe(FEATURES.length);
    expect(new Set(FEATURES.map((f) => f.href)).size).toBe(FEATURES.length);
  });

  it("keeps a way home and a way to settings as core", () => {
    expect(getFeature("today")?.core).toBe(true);
    expect(getFeature("settings")?.core).toBe(true);
  });

  it("never offers core or admin sections as toggles", () => {
    for (const f of TOGGLEABLE_FEATURES) {
      expect(f.core).toBeFalsy();
      expect(f.adminOnly).toBeFalsy();
    }
  });
});

describe("defaults and migration", () => {
  it("a new account starts on the starter set, not everything", () => {
    const keys = defaultFeatureKeys(after);
    expect(keys).toEqual(starterFeatureKeys());
    expect(keys.length).toBeLessThan(allFeatureKeys().length);
  });

  it("a new account starts with NO optional sections switched on", () => {
    // The brief is empty-first: a brand-new account gets only the sections it
    // cannot function without, and adds the rest itself. Nothing from the
    // toggleable catalogue may be preloaded.
    const keys = defaultFeatureKeys(after);
    for (const f of TOGGLEABLE_FEATURES) {
      expect(keys).not.toContain(f.key);
    }
    expect(keys).toEqual(FEATURES.filter((f) => f.core).map((f) => f.key));
  });

  it("an account created before feature choice keeps everything", () => {
    // Taking sections away from a live account would read as data loss.
    expect(defaultFeatureKeys(before)).toEqual(allFeatureKeys());
  });

  it("falls back to everything when the creation date is missing or junk", () => {
    expect(defaultFeatureKeys(undefined)).toEqual(allFeatureKeys());
    expect(defaultFeatureKeys(null)).toEqual(allFeatureKeys());
    expect(defaultFeatureKeys("not a date")).toEqual(allFeatureKeys());
  });

  it("the launch date is a real timestamp", () => {
    expect(Number.isFinite(Date.parse(FEATURE_CHOICE_LAUNCH_ISO))).toBe(true);
  });

  it("the starter set includes only core sections", () => {
    const starter = starterFeatureKeys();
    for (const key of starter) {
      expect(getFeature(key)?.core).toBe(true);
    }
  });
});

describe("normaliseFeatureKeys", () => {
  it("drops unknown keys", () => {
    expect(normaliseFeatureKeys(["tasks", "a-feature-we-deleted"])).toContain("tasks");
    expect(normaliseFeatureKeys(["tasks", "a-feature-we-deleted"])).not.toContain(
      "a-feature-we-deleted",
    );
  });

  it("forces core sections back on even if stored without them", () => {
    const keys = normaliseFeatureKeys(["tasks"]);
    expect(keys).toContain("today");
    expect(keys).toContain("settings");
    expect(keys).toContain("subscriptions");
  });

  it("drops unknown keys silently", () => {
    expect(normaliseFeatureKeys(["nonexistent-key"])).not.toContain("nonexistent-key");
  });

  it("survives junk input", () => {
    expect(normaliseFeatureKeys(null)).toEqual(normaliseFeatureKeys([]));
    expect(normaliseFeatureKeys("tasks")).toEqual(normaliseFeatureKeys([]));
    expect(normaliseFeatureKeys([1, 2, null])).toEqual(normaliseFeatureKeys([]));
  });

  it("an empty stored list still leaves the app usable", () => {
    const keys = normaliseFeatureKeys([]);
    expect(keys).toContain("today");
    expect(keys).toContain("settings");
  });

  it("returns catalogue order, not stored order", () => {
    const a = normaliseFeatureKeys(["vault", "tasks"]);
    const b = normaliseFeatureKeys(["tasks", "vault"]);
    expect(a).toEqual(b);
  });
});

describe("isFeatureVisible", () => {
  const today = getFeature("today")!;
  const vault = getFeature("vault")!;
  it("shows core sections even when nothing is enabled", () => {
    expect(isFeatureVisible(today, [], false)).toBe(true);
  });

  it("shows an enabled section and hides a disabled one", () => {
    expect(isFeatureVisible(vault, ["vault"], false)).toBe(true);
    expect(isFeatureVisible(vault, [], false)).toBe(false);
  });
});

describe("feature packs", () => {
  it("every pack references real, toggleable sections", () => {
    for (const pack of FEATURE_PACKS) {
      expect(pack.features.length).toBeGreaterThan(0);
      for (const key of pack.features) {
        const def = getFeature(key);
        expect(def, `${pack.key} references unknown feature ${key}`).toBeDefined();
        // A pack that "adds" a core section would look like it did nothing, and
        // one that granted an admin section would be a privilege hole.
        expect(def!.core, `${pack.key} includes core ${key}`).toBeFalsy();
        expect(def!.adminOnly, `${pack.key} includes admin-only ${key}`).toBeFalsy();
      }
    }
  });

  it("pack keys and names are unique", () => {
    expect(new Set(FEATURE_PACKS.map((p) => p.key)).size).toBe(FEATURE_PACKS.length);
    expect(new Set(FEATURE_PACKS.map((p) => p.name)).size).toBe(FEATURE_PACKS.length);
  });

  it("there is a starter pack", () => {
    expect(getPack("starter")).toBeDefined();
  });

  it("applying a pack switches its sections on", () => {
    const next = applyPack([], "starter");
    for (const key of getPack("starter")!.features) expect(next).toContain(key);
  });

  it("applying a pack is additive and never removes a section", () => {
    // Trying a pack must not cost you something you already chose.
    const before = applyPack([], "home");
    const after = applyPack(before, "thinking");
    for (const key of before) expect(after).toContain(key);
  });

  it("applying a pack keeps core sections and never grants admin ones", () => {
    const next = applyPack([], "life-admin");
    expect(next).toContain("today");
    expect(next).toContain("settings");
    expect(next).not.toContain("dev-ui");
  });

  it("applying twice is idempotent", () => {
    const once = applyPack([], "planning");
    expect(applyPack(once, "planning")).toEqual(once);
  });

  it("an unknown pack key is a no-op rather than a throw", () => {
    expect(applyPack(["tasks"], "does-not-exist")).toEqual(normaliseFeatureKeys(["tasks"]));
  });

  it("isPackApplied only once every section in it is on", () => {
    expect(isPackApplied([], "starter")).toBe(false);
    const partial = getPack("starter")!.features.slice(0, 1);
    expect(isPackApplied(partial, "starter")).toBe(false);
    expect(isPackApplied(applyPack([], "starter"), "starter")).toBe(true);
  });
});
