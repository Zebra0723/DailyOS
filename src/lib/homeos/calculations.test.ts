import { describe, it, expect } from "vitest";
import {
  monthlyEquivalent,
  getMonthlySubscriptionTotal,
  getAnnualSubscriptionTotal,
  getPotentialSavings,
  getOpenAlertCounts,
  getHomeControlScore,
} from "./calculations";
import type {
  HomeAlert,
  HomeOSData,
  HomeSubscription,
} from "./types";

function sub(partial: Partial<HomeSubscription>): HomeSubscription {
  return {
    id: "s1",
    name: "Test",
    status: "Active",
    billingCycle: "Monthly",
    monthlyCost: 0,
    annualCost: 0,
    usageLevel: "Medium",
    importance: "Important",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...partial,
  } as HomeSubscription;
}

function emptyData(over: Partial<HomeOSData> = {}): HomeOSData {
  return {
    homeProfile: {
      id: "h",
      name: "Home",
      addressLabel: "",
      householdMembers: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    subscriptions: [],
    arrivals: [],
    roomItems: [],
    devices: [],
    documents: [],
    alerts: [],
    concerns: [],
    todayActions: [],
    settings: {} as HomeOSData["settings"],
    ...over,
  } as HomeOSData;
}

describe("monthlyEquivalent", () => {
  it("normalises billing cycles to a monthly figure", () => {
    expect(monthlyEquivalent(sub({ monthlyCost: 10, billingCycle: "Monthly" }))).toBe(10);
    expect(
      monthlyEquivalent(sub({ monthlyCost: 12, billingCycle: "Annual" })),
    ).toBeCloseTo(1, 5);
    expect(
      monthlyEquivalent(sub({ monthlyCost: 3, billingCycle: "Quarterly" })),
    ).toBeCloseTo(1, 5);
    expect(
      monthlyEquivalent(sub({ monthlyCost: 10, billingCycle: "Weekly" })),
    ).toBeCloseTo(43.45, 2);
  });

  it("falls back to annualCost / 12 when no monthly cost", () => {
    expect(
      monthlyEquivalent(sub({ monthlyCost: 0, annualCost: 120 })),
    ).toBeCloseTo(10, 5);
  });

  it("cancelled subscriptions cost nothing", () => {
    expect(monthlyEquivalent(sub({ status: "Cancelled", monthlyCost: 99 }))).toBe(0);
  });
});

describe("subscription totals", () => {
  const subs = [
    sub({ monthlyCost: 10, billingCycle: "Monthly" }),
    sub({ monthlyCost: 24, billingCycle: "Annual" }), // £2/mo
    sub({ status: "Cancelled", monthlyCost: 50 }), // ignored
  ];
  it("sums monthly and annual totals", () => {
    expect(getMonthlySubscriptionTotal(subs)).toBe(12);
    expect(getAnnualSubscriptionTotal(subs)).toBe(144);
  });
});

describe("getPotentialSavings", () => {
  it("flags low-usage, optional, non-trivial subscriptions", () => {
    const subs = [
      sub({ monthlyCost: 12, usageLevel: "Low", importance: "Optional" }),
      sub({ monthlyCost: 12, usageLevel: "High", importance: "Optional" }),
      sub({ status: "Cancel Soon", monthlyCost: 5 }),
    ];
    // 12 (low+optional) + 5 (cancel soon) = 17
    expect(getPotentialSavings(subs)).toBe(17);
  });
});

describe("getOpenAlertCounts", () => {
  it("counts by status and severity", () => {
    const alerts = [
      { status: "Open", severity: "Critical" },
      { status: "Open", severity: "Warning" },
      { status: "Open", severity: "Warning" },
      { status: "Resolved", severity: "Info" },
      { status: "Snoozed", severity: "Info" },
    ] as HomeAlert[];
    const c = getOpenAlertCounts(alerts);
    expect(c.open).toBe(3);
    expect(c.critical).toBe(1);
    expect(c.warning).toBe(2);
    expect(c.resolved).toBe(1);
    expect(c.snoozed).toBe(1);
  });
});

describe("getHomeControlScore", () => {
  it("is a perfect, 'Smooth' score for an empty, tidy home", () => {
    const score = getHomeControlScore(emptyData());
    expect(score.score).toBe(100);
    expect(score.label).toBe("Smooth");
  });

  it("deducts for open critical alerts", () => {
    const data = emptyData({
      alerts: [{ status: "Open", severity: "Critical" }] as HomeAlert[],
    });
    const score = getHomeControlScore(data);
    expect(score.score).toBeLessThan(100);
  });
});
