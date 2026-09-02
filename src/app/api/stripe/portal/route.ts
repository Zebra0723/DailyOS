import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/stripe/portal — opens the Stripe billing portal so a subscriber can
// change plan, update their card or cancel. Returns { url }.
export async function POST() {
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

  const customer = user.user_metadata?.stripe_customer as string | undefined;
  if (!customer) {
    return NextResponse.json({ error: "no-subscription" }, { status: 400 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${SITE_URL}/subscriptions`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal] failed:", err);
    return NextResponse.json({ error: "portal-failed" }, { status: 500 });
  }
}
