import type { Reward } from "@/lib/referral-rewards";
import type { PromoSpec } from "@/lib/stripe-promo";

/**
 * Map a DailyOS reward to the Stripe promotion code that delivers it — the one
 * place this translation lives, shared by the referral flow and the admin/
 * Cloudflare code generators so they can never drift apart.
 *
 *   discount → a percent-off code for one billing period
 *   plan grant → 100% off for the plan's length (a fixed number of months, or
 *                forever for a lifetime grant), redeemed on the Stripe checkout.
 */
export function rewardToPromoSpec(reward: Reward): PromoSpec {
  if (reward.kind === "discount") {
    return { percentOff: reward.percent, duration: { kind: "once" } };
  }
  if (reward.days === 0) {
    return { percentOff: 100, duration: { kind: "forever" } };
  }
  const months = Math.max(1, Math.round(reward.days / 30));
  return { percentOff: 100, duration: { kind: "repeating", months } };
}
