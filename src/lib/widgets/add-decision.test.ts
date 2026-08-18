import { describe, it, expect } from "vitest";
import { decideAdd } from "./add-decision";

const add = (current: string[], id: string, limit: number, tier = "free") =>
  decideAdd({ current, id, limit, tier });

describe("decideAdd", () => {
  it("allows an add below the limit", () => {
    expect(add([], "tasks-due", 5)).toEqual({ ok: true });
  });

  it("rejects a widget that's already on the dashboard", () => {
    expect(add(["tasks-due"], "tasks-due", 5)).toEqual({
      ok: false,
      reason: "duplicate",
    });
  });

  it("rejects once the plan's allowance is used up, and says where to upgrade", () => {
    expect(add(["a", "b", "c", "d", "e"], "f", 5)).toEqual({
      ok: false,
      reason: "limit",
      limit: 5,
      upgradeTo: "plus",
    });
  });

  it("points a Plus user at Pro", () => {
    const r = add(["a", "b"], "c", 2, "plus");
    expect(r.ok).toBe(false);
    if (!r.ok && r.reason === "limit") expect(r.upgradeTo).toBe("pro");
  });

  it("has no upgrade to offer a Pro user", () => {
    const r = add(["a", "b"], "c", 2, "pro");
    if (!r.ok && r.reason === "limit") expect(r.upgradeTo).toBeNull();
  });

  // The v263 regression: the limit was evaluated inside a setState updater, so
  // an unresolved plan (which reports "free") capped everyone at 5 and the
  // rejection never reached the caller. Infinity is how the provider now spells
  // "plan not known yet — don't enforce anything".
  it("never blocks while the plan is still unknown", () => {
    const many = Array.from({ length: 40 }, (_, i) => `w${i}`);
    expect(add(many, "another", Infinity)).toEqual({ ok: true });
  });

  it("still catches duplicates while the plan is unknown", () => {
    expect(add(["tasks-due"], "tasks-due", Infinity)).toEqual({
      ok: false,
      reason: "duplicate",
    });
  });

  it("treats the boundary exactly: the Nth add fits, the N+1th doesn't", () => {
    expect(add(["a", "b", "c", "d"], "e", 5)).toEqual({ ok: true });
    expect(add(["a", "b", "c", "d", "e"], "f", 5).ok).toBe(false);
  });

  it("reports over-limit rather than allowing, if a list somehow exceeds the cap", () => {
    // Downgrading from Pro to free can leave more widgets than the cap allows.
    // Adding must still be refused, not permitted because the arithmetic went
    // negative somewhere.
    const r = add(["a", "b", "c", "d", "e", "f", "g"], "h", 5);
    expect(r.ok).toBe(false);
  });
});
