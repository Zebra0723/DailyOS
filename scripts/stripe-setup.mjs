#!/usr/bin/env node
/**
 * DailyOS Stripe setup — creates the subscription products + prices once, so you
 * don't hand-build them in the dashboard, then prints the STRIPE_PRICE_* env
 * vars to paste into Vercel.
 *
 * Mirrors Stripe's own "create a product" pattern (products.create with a
 * default recurring price), but for our four plans, in GBP, VAT-INCLUSIVE
 * (tax_behavior: "inclusive", because our displayed prices already include VAT)
 * and tagged with the SaaS tax code so Stripe Tax / Managed Payments can work
 * out the right tax.
 *
 * Run once, against your TEST key first:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
 * Then re-run with the live key when you're ready:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.mjs
 *
 * SECURITY: never hardcode the key here or commit it. It comes from your shell.
 * Re-running creates NEW prices each time (Stripe prices are immutable) — only
 * run it again when you actually want fresh price ids.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("✗ Set STRIPE_SECRET_KEY in your shell first (use the TEST key to start).");
  process.exit(1);
}
if (key.startsWith("pk_")) {
  console.error("✗ That's a publishable key (pk_…). This needs the SECRET key (sk_…).");
  process.exit(1);
}

const stripe = new Stripe(key);

// SaaS / general electronically-supplied services. Change if your accountant
// tells you a different code fits DailyOS better.
const TAX_CODE = "txcd_10103100";

// Amounts in pence, matching src/lib/plans.ts (VAT-inclusive £).
const PLANS = [
  {
    name: "DailyOS Plus",
    description: "For a busy life, sorted.",
    envPrefix: "PLUS",
    monthly: 499, // £4.99
    yearly: 5699, // £56.99
  },
  {
    name: "DailyOS Pro",
    description: "Your full chief of staff.",
    envPrefix: "PRO",
    monthly: 899, // £8.99
    yearly: 10249, // £102.49
  },
];

async function makePrice(productId, amount, interval) {
  const price = await stripe.prices.create({
    product: productId,
    currency: "gbp",
    unit_amount: amount,
    tax_behavior: "inclusive", // our displayed prices already include VAT
    recurring: { interval },
  });
  return price.id;
}

const out = {};

for (const plan of PLANS) {
  console.log(`▸ Creating ${plan.name}…`);
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    tax_code: TAX_CODE,
  });
  out[`STRIPE_PRICE_${plan.envPrefix}_MONTHLY`] = await makePrice(
    product.id,
    plan.monthly,
    "month",
  );
  out[`STRIPE_PRICE_${plan.envPrefix}_YEARLY`] = await makePrice(
    product.id,
    plan.yearly,
    "year",
  );
}

console.log("\n✅ Done. Paste these into Vercel (Production) → then redeploy:\n");
for (const [k, v] of Object.entries(out)) console.log(`  ${k}=${v}`);
console.log(
  "\nNext: create a webhook endpoint at https://dailyos.uk/api/stripe/webhook " +
    "(events: checkout.session.completed, customer.subscription.updated, " +
    "customer.subscription.deleted) and set STRIPE_WEBHOOK_SECRET to its signing " +
    "secret. Also set STRIPE_SECRET_KEY in Vercel.\n",
);
