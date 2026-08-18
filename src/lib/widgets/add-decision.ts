// The "can this widget be added?" decision, kept pure so it can be tested
// without a renderer. It used to live inside a setState updater in
// DashboardProvider, which React defers to the next render — so the caller
// always received "ok" and a rejected add produced no feedback at all.

import { nextTierAfter, type PlanTier } from "@/lib/widgets";

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" }
  | { ok: false; reason: "limit"; limit: number; upgradeTo: "plus" | "pro" | null };

export function decideAdd({
  current,
  id,
  limit,
  tier,
}: {
  /** Widgets already on the dashboard, including any added this tick. */
  current: string[];
  id: string;
  /** `Infinity` when unlimited or not yet known. */
  limit: number;
  tier: PlanTier | string;
}): AddResult {
  if (current.includes(id)) return { ok: false, reason: "duplicate" };
  if (current.length >= limit) {
    return { ok: false, reason: "limit", limit, upgradeTo: nextTierAfter(tier) };
  }
  return { ok: true };
}
