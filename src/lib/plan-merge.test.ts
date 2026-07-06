import { describe, it, expect } from "vitest";
import { mergeGrant } from "./plan-merge";

const DAY = 86_400_000;
const now = Date.parse("2026-07-05T12:00:00Z");
const in90 = now + 90 * DAY;
const in365 = now + 365 * DAY;

describe("mergeGrant — a reward never makes access worse", () => {
  it("grants a plan to a free account as-is (no phantom lifetime)", () => {
    expect(mergeGrant({ tier: "free", exp: null }, { tier: "plus", exp: in90 })).toEqual({
      tier: "plus",
      exp: in90,
    });
  });

  it("does NOT downgrade lifetime Pro when a lesser Plus gift is redeemed", () => {
    // The reported HIGH bug: this must stay Pro / lifetime.
    expect(
      mergeGrant({ tier: "pro", exp: null }, { tier: "plus", exp: in90 }),
    ).toEqual({ tier: "pro", exp: null });
  });

  it("does not shorten a longer Pro grant with a shorter one", () => {
    expect(
      mergeGrant({ tier: "pro", exp: in365 }, { tier: "pro", exp: in90 }),
    ).toEqual({ tier: "pro", exp: in365 });
  });

  it("upgrades tier when the reward is higher", () => {
    expect(
      mergeGrant({ tier: "plus", exp: in90 }, { tier: "pro", exp: in365 }),
    ).toEqual({ tier: "pro", exp: in365 });
  });

  it("gains permanence at the same tier (lifetime beats a window)", () => {
    expect(
      mergeGrant({ tier: "plus", exp: in90 }, { tier: "plus", exp: null }),
    ).toEqual({ tier: "plus", exp: null });
  });

  it("keeps the later deadline at the same tier", () => {
    expect(
      mergeGrant({ tier: "plus", exp: in90 }, { tier: "plus", exp: in365 }),
    ).toEqual({ tier: "plus", exp: in365 });
  });

  it("keeps the current higher tier rather than a lifetime of a lower one", () => {
    expect(
      mergeGrant({ tier: "pro", exp: in365 }, { tier: "plus", exp: null }),
    ).toEqual({ tier: "pro", exp: in365 });
  });
});
