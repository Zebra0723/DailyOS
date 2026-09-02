import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, planForPriceId } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe → DailyOS sync. Stripe calls this when a subscription starts, changes
// or ends; we flip the user's plan in user_metadata (the same field promo codes
// use), via the service client because users can't be trusted to set their own
// tier. Requests are verified with STRIPE_WEBHOOK_SECRET so only Stripe can
// grant a plan.

/** Set (or clear) a user's plan. plan=null downgrades to free. */
async function setUserPlan(
  userId: string,
  plan: "plus" | "pro" | null,
  stripeCustomer?: string,
) {
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  const existing = data?.user?.user_metadata ?? {};
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existing,
      plan: plan ?? "free",
      pro: plan === "pro",
      // Stripe manages the lifecycle, so there's no manual expiry to track.
      plan_exp: null,
      ...(stripeCustomer ? { stripe_customer: stripeCustomer } : {}),
    },
  });
}

function userIdFromSubscription(sub: Stripe.Subscription): string | null {
  const fromMeta = sub.metadata?.userId;
  if (fromMeta) return fromMeta;
  return null;
}

function planFromSubscription(sub: Stripe.Subscription): "plus" | "pro" | null {
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return null;
  return planForPriceId(priceId);
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no-signature" }, { status: 400 });

  // Signature verification needs the RAW body, so read it as text.
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] bad signature:", err);
    return NextResponse.json({ error: "bad-signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (!userId) break;
        const customer =
          typeof session.customer === "string" ? session.customer : undefined;
        // Pull the plan from the subscription's price (source of truth).
        let plan: "plus" | "pro" | null =
          (session.metadata?.plan as "plus" | "pro") ?? null;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          plan = planFromSubscription(sub) ?? plan;
        }
        await setUserPlan(userId, plan, customer);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = userIdFromSubscription(sub);
        if (!userId) break;
        // Active/trialing → the plan the price maps to; anything else → free.
        const active = sub.status === "active" || sub.status === "trialing";
        await setUserPlan(
          userId,
          active ? planFromSubscription(sub) : null,
          typeof sub.customer === "string" ? sub.customer : undefined,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = userIdFromSubscription(sub);
        if (userId) await setUserPlan(userId, null);
        break;
      }

      default:
        // Ignore everything else.
        break;
    }
  } catch (err) {
    console.error(`[stripe/webhook] handler error (${event.type}):`, err);
    // 500 tells Stripe to retry — better than silently dropping a plan change.
    return NextResponse.json({ error: "handler-failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
