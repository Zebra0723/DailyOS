// The referral prize ladder. Rewards scale with how many friends you convert.
// Shared by the server (which issues the single-use code when you hit a rung)
// and the client (which shows the ladder and applies a redeemed reward).
//
// Every rung is delivered as a unique, single-use code — see reward_codes.

import type { Tier } from "@/lib/use-pro";

export type Reward =
  | { kind: "discount"; percent: number }
  | { kind: "plan"; tier: Extract<Tier, "plus" | "pro">; days: number }; // days 0 = lifetime

export type Milestone = {
  /** Converted-friend count that unlocks this rung. */
  count: number;
  reward: Reward;
  /** Short human label, e.g. "3 months of Plus". */
  label: string;
};

export const MILESTONES: Milestone[] = [
  { count: 1, reward: { kind: "discount", percent: 10 }, label: "10% off your next plan" },
  { count: 5, reward: { kind: "plan", tier: "plus", days: 90 }, label: "3 months of Plus" },
  { count: 7, reward: { kind: "plan", tier: "pro", days: 365 }, label: "1 year of Pro" },
  { count: 10, reward: { kind: "plan", tier: "plus", days: 0 }, label: "Lifetime Plus" },
  { count: 25, reward: { kind: "plan", tier: "pro", days: 0 }, label: "Lifetime Pro" },
];

/** The milestone unlocked at exactly this converted-friend count, if any. */
export function milestoneAt(count: number): Milestone | undefined {
  return MILESTONES.find((m) => m.count === count);
}

/** Reward codes lapse this many days after they're issued. */
export const REWARD_CODE_TTL_DAYS = 60;

/** True once a code has passed its 2-month window. */
export function rewardCodeExpired(createdAtISO: string, now: number): boolean {
  const created = Date.parse(createdAtISO);
  if (!Number.isFinite(created)) return false;
  return now > created + REWARD_CODE_TTL_DAYS * 86_400_000;
}

/** A plain-English name for a reward, e.g. for toasts and emails. */
export function describeReward(reward: Reward): string {
  if (reward.kind === "discount") return `${reward.percent}% off your next plan`;
  const plan = reward.tier === "pro" ? "Pro" : "Plus";
  if (reward.days === 0) return `Lifetime ${plan}`;
  if (reward.days % 365 === 0) {
    const y = reward.days / 365;
    return `${y} year${y > 1 ? "s" : ""} of ${plan}`;
  }
  const months = Math.round(reward.days / 30);
  return `${months} month${months > 1 ? "s" : ""} of ${plan}`;
}
