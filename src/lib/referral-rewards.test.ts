import { describe, it, expect } from "vitest";
import {
  MILESTONES,
  milestoneAt,
  describeReward,
  rewardCodeExpired,
  REWARD_CODE_TTL_DAYS,
} from "./referral-rewards";

const DAY = 86_400_000;

describe("referral rewards ladder", () => {
  it("has the rungs at 1, 5, 7, 10 and 25 friends", () => {
    expect(MILESTONES.map((m) => m.count)).toEqual([1, 5, 7, 10, 25]);
  });

  it("only the 1-friend rung is a discount; the rest are plan grants", () => {
    const one = milestoneAt(1)!;
    expect(one.reward).toEqual({ kind: "discount", percent: 10 });
    for (const c of [5, 7, 10, 25]) {
      expect(milestoneAt(c)!.reward.kind).toBe("plan");
    }
  });

  it("returns a rung only at exact counts", () => {
    expect(milestoneAt(1)).toBeDefined();
    expect(milestoneAt(5)).toBeDefined();
    expect(milestoneAt(25)).toBeDefined();
    expect(milestoneAt(2)).toBeUndefined();
    expect(milestoneAt(6)).toBeUndefined();
    expect(milestoneAt(26)).toBeUndefined();
    expect(milestoneAt(0)).toBeUndefined();
  });

  it("describes each reward in plain English", () => {
    expect(describeReward({ kind: "discount", percent: 10 })).toBe(
      "10% off your next plan",
    );
    expect(describeReward({ kind: "plan", tier: "plus", days: 90 })).toBe(
      "3 months of Plus",
    );
    expect(describeReward({ kind: "plan", tier: "pro", days: 365 })).toBe(
      "1 year of Pro",
    );
    expect(describeReward({ kind: "plan", tier: "plus", days: 0 })).toBe(
      "Lifetime Plus",
    );
    expect(describeReward({ kind: "plan", tier: "pro", days: 0 })).toBe(
      "Lifetime Pro",
    );
  });

  it("matches the ladder labels to their rewards", () => {
    for (const m of MILESTONES) {
      expect(m.label).toBe(describeReward(m.reward));
    }
  });
});

describe("reward code expiry", () => {
  const now = Date.parse("2026-07-05T12:00:00Z");

  it("is fresh right after issue and just under the window", () => {
    expect(rewardCodeExpired(new Date(now).toISOString(), now)).toBe(false);
    const almost = new Date(now - (REWARD_CODE_TTL_DAYS - 1) * DAY).toISOString();
    expect(rewardCodeExpired(almost, now)).toBe(false);
  });

  it("expires once past the 2-month window", () => {
    const old = new Date(now - (REWARD_CODE_TTL_DAYS + 1) * DAY).toISOString();
    expect(rewardCodeExpired(old, now)).toBe(true);
  });

  it("treats an unparseable date as not expired (fail open, stays usable)", () => {
    expect(rewardCodeExpired("not-a-date", now)).toBe(false);
  });
});
