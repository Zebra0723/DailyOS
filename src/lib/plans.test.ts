import { describe, it, expect } from "vitest";
import { PLANS, annualPerMonth, annualSavingPct } from "./plans";

describe("plans", () => {
  it("has free, plus and pro tiers", () => {
    expect(PLANS.map((p) => p.key)).toEqual(["free", "plus", "pro"]);
  });

  it("gates Ask DailyOS and HomeOS to Pro", () => {
    const pro = PLANS.find((p) => p.key === "pro")!;
    expect(pro.features.some((f) => /ask dailyos/i.test(f))).toBe(true);
    expect(pro.features.some((f) => /homeos/i.test(f))).toBe(true);
    // ...and not on the free tier.
    const free = PLANS.find((p) => p.key === "free")!;
    expect(free.features.some((f) => /ask dailyos/i.test(f))).toBe(false);
  });

  it("annualPerMonth divides the annual price over 12 months", () => {
    expect(annualPerMonth({ annual: 40 } as never)).toBeCloseTo(3.33, 2);
    expect(annualPerMonth({ annual: 80 } as never)).toBeCloseTo(6.67, 2);
    expect(annualPerMonth({ annual: 0 } as never)).toBe(0);
  });

  it("annualSavingPct is 0 for free and positive for paid annual deals", () => {
    expect(annualSavingPct({ monthly: 0, annual: 0 } as never)).toBe(0);
    // £4/mo = £48/yr full price; £40 annual → ~17% saved.
    expect(annualSavingPct({ monthly: 4, annual: 40 } as never)).toBe(17);
  });
});
