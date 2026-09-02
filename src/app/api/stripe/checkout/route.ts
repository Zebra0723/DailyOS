import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  priceIdFor,
  type BillingCycle,
  type PlanTier,
} from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/stripe/checkout  { plan: "plus"|"pro", cycle: "monthly"|"yearly" }
// Creates a Stripe Checkout Session for the signed-in user and returns { url }.
export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "billing-not-configured" }, { status: 503 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { plan?: string; cycle?: string };
  try {
    body = (await req.json()) as { plan?: string; cycle?: string };
  } catch {
    return NextResponse.json({ error: "invalid-json" }, { status: 400 });
  }

  const plan = body.plan as PlanTier;
  const cycle = (body.cycle === "yearly" ? "yearly" : "monthly") as BillingCycle;
  if (plan !== "plus" && plan !== "pro") {
    return NextResponse.json({ error: "invalid-plan" }, { status: 400 });
  }

  const price = priceIdFor(plan, cycle);
  if (!price) {
    return NextResponse.json({ error: "price-not-configured" }, { status: 503 });
  }

  // Managed Payments = Stripe's merchant-of-record mode: Stripe becomes the
  // seller of record and handles tax collection/remittance and compliance for
  // us. ON by default; set STRIPE_MANAGED_PAYMENTS=false to fall back to the
  // plain flow (e.g. if your account isn't enabled for Managed Payments yet).
  // Note: Managed Payments must be turned on for your Stripe account in the
  // dashboard first, or Stripe will reject the session.
  const managed = process.env.STRIPE_MANAGED_PAYMENTS !== "false";

  try {
    // Reuse the Stripe customer we stored on a previous purchase, so a user
    // doesn't accumulate duplicate customers. (Managed mode: Stripe owns the
    // customer, so we only prefill the email rather than pin an existing id.)
    const existingCustomer = user.user_metadata?.stripe_customer as string | undefined;

    const common = {
      mode: "subscription" as const,
      line_items: [{ price, quantity: 1 }],
      // Ties the resulting subscription back to this Supabase user in the webhook.
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
      // Lets people enter a Stripe promotion code on the checkout page.
      allow_promotion_codes: true,
      success_url: `${SITE_URL}/subscriptions?checkout=success`,
      cancel_url: `${SITE_URL}/subscriptions?checkout=cancelled`,
    };

    const session = await stripe.checkout.sessions.create(
      managed
        ? {
            ...common,
            managed_payments: { enabled: true },
            ...(user.email ? { customer_email: user.email } : {}),
          }
        : {
            ...common,
            ...(existingCustomer
              ? { customer: existingCustomer }
              : { customer_email: user.email ?? undefined }),
          },
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] failed:", err);
    return NextResponse.json({ error: "checkout-failed" }, { status: 500 });
  }
}
