import { describe, it, expect } from "vitest";
import { PLANS, annualPerMonth, annualSavingPct } from "./plans";

describe("plans", () => {
  it("has free, plus and pro tiers", () => {
    expect(PLANS.map((p) => p.key)).toEqual(["free", "plus", "pro"]);
  });

  it("puts Ask DailyOS on Pro and HomeOS on Plus", () => {
    const free = PLANS.find((p) => p.key === "free")!;
    const plus = PLANS.find((p) => p.key === "plus")!;
    const pro = PLANS.find((p) => p.key === "pro")!;
    // Ask DailyOS is Pro-only.
    expect(pro.features.some((f) => /ask dailyos/i.test(f))).toBe(true);
    expect(plus.features.some((f) => /ask dailyos/i.test(f))).toBe(false);
    // HomeOS is now Plus.
    expect(plus.features.some((f) => /homeos/i.test(f))).toBe(true);
    // Free gets neither, but does get cross-device sync.
    expect(free.features.some((f) => /ask dailyos|homeos/i.test(f))).toBe(false);
    expect(free.features.some((f) => /cross-device sync/i.test(f))).toBe(true);
  });

  it("annualPerMonth divides the annual price over 12 months", () => {
    expect(annualPerMonth({ annual: 56.99 } as never)).toBeCloseTo(4.75, 2);
    expect(annualPerMonth({ annual: 125.49 } as never)).toBeCloseTo(10.46, 2);
    expect(annualPerMonth({ annual: 0 } as never)).toBe(0);
  });

  it("annualSavingPct is 0 for free and positive for paid annual deals", () => {
    expect(annualSavingPct({ monthly: 0, annual: 0 } as never)).toBe(0);
    // £4.99/mo = £59.88/yr full price; £56.99 annual → ~5% saved.
    expect(annualSavingPct({ monthly: 4.99, annual: 56.99 } as never)).toBe(5);
    // £10.99/mo = £131.88/yr full price; £125.49 annual → ~5% saved.
    expect(annualSavingPct({ monthly: 10.99, annual: 125.49 } as never)).toBe(5);
  });
});
