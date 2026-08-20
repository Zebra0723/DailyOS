// ----------------------------------------------------------------------------
// Applying a pack — the widget half.
//
// The catalogue lives in lib/features.ts (FEATURE_PACKS), which owns the
// sections. This module owns what a pack does to the DASHBOARD, because that
// needs things features.ts has no business knowing: the widget registry, the
// user's plan tier, and how much of their widget allowance is left.
//
// Pure, so the UI can preview exactly what a pack will do before committing to
// it and can say what it *won't* do rather than quietly doing less.
// ----------------------------------------------------------------------------

import { getWidget, type PlanTier } from "@/lib/widgets";
import type { FeaturePack } from "@/lib/features";

function tierAllows(userTier: PlanTier | string, required: PlanTier): boolean {
  if (userTier === "pro") return true;
  if (required === "plus" && (userTier === "plus" || userTier === "pro")) return true;
  return required === "free";
}

export interface PackPlan {
  /** Widgets that will actually be added, in pack order. */
  widgetsToAdd: string[];
  /** Already on the dashboard — nothing to do, not an error. */
  widgetsAlready: string[];
  /** Above the user's plan tier. */
  widgetsLocked: string[];
  /** Allowed, but the plan's widget allowance is used up. */
  widgetsNoRoom: string[];
  featuresToEnable: string[];
  featuresAlready: string[];
}

export function planPack({
  pack,
  currentWidgets,
  enabledFeatures,
  tier,
  limit,
}: {
  pack: FeaturePack;
  currentWidgets: string[];
  enabledFeatures: Set<string> | string[];
  tier: PlanTier | string;
  /** `Infinity` for unlimited, or while the plan is still unknown. */
  limit: number;
}): PackPlan {
  const enabled =
    enabledFeatures instanceof Set ? enabledFeatures : new Set(enabledFeatures);

  const plan: PackPlan = {
    widgetsToAdd: [],
    widgetsAlready: [],
    widgetsLocked: [],
    widgetsNoRoom: [],
    featuresToEnable: [],
    featuresAlready: [],
  };

  for (const key of pack.features) {
    if (enabled.has(key)) plan.featuresAlready.push(key);
    else plan.featuresToEnable.push(key);
  }

  let room = limit - currentWidgets.length;

  for (const id of pack.widgets ?? []) {
    if (currentWidgets.includes(id)) {
      plan.widgetsAlready.push(id);
      continue;
    }
    const def = getWidget(id);
    // An id with no definition can't render, so never put it on a dashboard.
    if (!def) continue;
    if (!tierAllows(tier, def.tier)) {
      plan.widgetsLocked.push(id);
      continue;
    }
    if (room <= 0) {
      plan.widgetsNoRoom.push(id);
      continue;
    }
    plan.widgetsToAdd.push(id);
    room -= 1;
  }

  return plan;
}

/** True when applying the pack would change nothing at all. */
export function packIsFullyApplied(plan: PackPlan): boolean {
  return plan.widgetsToAdd.length === 0 && plan.featuresToEnable.length === 0;
}
