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

  it("the starter set never includes an admin-only section", () => {
    expect(starterFeatureKeys()).not.toContain("dev-ui");
    expect(allFeatureKeys()).not.toContain("dev-ui");
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

  it("cannot grant an admin-only section from stored data", () => {
    expect(normaliseFeatureKeys(["dev-ui"])).not.toContain("dev-ui");
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
  const devUi = getFeature("dev-ui")!;

  it("shows core sections even when nothing is enabled", () => {
    expect(isFeatureVisible(today, [], false)).toBe(true);
  });

  it("shows an enabled section and hides a disabled one", () => {
    expect(isFeatureVisible(vault, ["vault"], false)).toBe(true);
    expect(isFeatureVisible(vault, [], false)).toBe(false);
  });

  it("shows Dev UI only to admins, and never via the enabled set", () => {
    expect(isFeatureVisible(devUi, [], true)).toBe(true);
    expect(isFeatureVisible(devUi, [], false)).toBe(false);
    expect(isFeatureVisible(devUi, ["dev-ui"], false)).toBe(false);
  });
});
