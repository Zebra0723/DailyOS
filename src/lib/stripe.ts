import "server-only";
import Stripe from "stripe";

// Server-only Stripe client + price config. Everything is env-driven and
// inert until the keys are set, so the app runs fine before Stripe is live.
//
// Env vars:
//   STRIPE_SECRET_KEY          sk_test_… / sk_live_…
//   STRIPE_WEBHOOK_SECRET      whsec_…  (from the webhook endpoint you create)
//   STRIPE_PRICE_PLUS_MONTHLY  price_…
//   STRIPE_PRICE_PLUS_YEARLY   price_…
//   STRIPE_PRICE_PRO_MONTHLY   price_…
//   STRIPE_PRICE_PRO_YEARLY    price_…
// (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is only needed for client-side Stripe.js;
//  the hosted Checkout redirect used here doesn't require it.)

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("pk_")) return null; // not configured / wrong key
  if (!cached) cached = new Stripe(key);
  return cached;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type PlanTier = "plus" | "pro";
export type BillingCycle = "monthly" | "yearly";

/** Resolve a (plan, cycle) to its configured Stripe price id, or null. */
export function priceIdFor(plan: PlanTier, cycle: BillingCycle): string | null {
  const map: Record<PlanTier, Record<BillingCycle, string | undefined>> = {
    plus: {
      monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PLUS_YEARLY,
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
  };
  return map[plan]?.[cycle] ?? null;
}

/** Reverse lookup: which (plan) a given price id represents. Used by the
 *  webhook to decide what tier a subscription grants. */
export function planForPriceId(priceId: string): PlanTier | null {
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_YEARLY
  ) {
    return "pro";
  }
  if (
    priceId === process.env.STRIPE_PRICE_PLUS_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PLUS_YEARLY
  ) {
    return "plus";
  }
  return null;
}
