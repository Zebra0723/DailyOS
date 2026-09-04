import { describe, it, expect } from "vitest";
import { rewardToPromoSpec } from "./reward-promo-spec";
import { MILESTONES, type Reward } from "./referral-rewards";

describe("reward → Stripe promo spec", () => {
  it("a percent discount becomes a one-period percent-off code", () => {
    expect(rewardToPromoSpec({ kind: "discount", percent: 10 })).toEqual({
      percentOff: 10,
      duration: { kind: "once" },
    });
    expect(rewardToPromoSpec({ kind: "discount", percent: 25 })).toEqual({
      percentOff: 25,
      duration: { kind: "once" },
    });
  });

  it("a lifetime plan grant becomes 100% off forever", () => {
    expect(rewardToPromoSpec({ kind: "plan", tier: "plus", days: 0 })).toEqual({
      percentOff: 100,
      duration: { kind: "forever" },
    });
    expect(rewardToPromoSpec({ kind: "plan", tier: "pro", days: 0 })).toEqual({
      percentOff: 100,
      duration: { kind: "forever" },
    });
  });

  it("a time-limited plan grant becomes 100% off for that many months", () => {
    // 3 months of Plus (90 days) → 100% off, repeating 3 months.
    expect(rewardToPromoSpec({ kind: "plan", tier: "plus", days: 90 })).toEqual({
      percentOff: 100,
      duration: { kind: "repeating", months: 3 },
    });
    // 1 year of Pro (365 days) → ~12 months.
    expect(rewardToPromoSpec({ kind: "plan", tier: "pro", days: 365 })).toEqual({
      percentOff: 100,
      duration: { kind: "repeating", months: 12 },
    });
  });

  it("never produces a zero-month repeating grant", () => {
    // A tiny grant still rounds up to at least one month.
    const spec = rewardToPromoSpec({ kind: "plan", tier: "plus", days: 5 });
    expect(spec.duration).toEqual({ kind: "repeating", months: 1 });
  });

  it("every rung on the referral ladder maps to a valid Stripe code", () => {
    for (const m of MILESTONES) {
      const spec = rewardToPromoSpec(m.reward);
      // Exactly a percent discount (no fixed amount), within Stripe's 1–100.
      expect(spec.percentOff).toBeGreaterThanOrEqual(1);
      expect(spec.percentOff).toBeLessThanOrEqual(100);
      expect(spec.amountOffPence).toBeUndefined();
      // A sane duration.
      if (spec.duration.kind === "repeating") {
        expect(spec.duration.months).toBeGreaterThanOrEqual(1);
      } else {
        expect(["once", "forever"]).toContain(spec.duration.kind);
      }
    }
  });

  it("the friend's welcome reward (10% off) is a one-period code", () => {
    const friendReward: Reward = { kind: "discount", percent: 10 };
    expect(rewardToPromoSpec(friendReward)).toEqual({
      percentOff: 10,
      duration: { kind: "once" },
    });
  });
});
