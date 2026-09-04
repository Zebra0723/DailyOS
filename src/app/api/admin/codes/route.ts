import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { adminApiAuthorized } from "@/lib/admin-api-auth";
import { describeReward, type Reward } from "@/lib/referral-rewards";
import { createStripePromoCode } from "@/lib/stripe-promo";
import { rewardToPromoSpec } from "@/lib/reward-promo-spec";

// No 0/O, 1/I/L — these are typed by hand off a promo, so drop the lookalikes.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function codeBody(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

// POST /api/admin/codes — create Stripe promotion codes (token-authenticated,
// for the Cloudflare Worker). Every code is a real Stripe promotion code,
// redeemed on the Stripe checkout page. A plan grant is delivered as 100% off
// for that plan's duration.
//
// Body:
//   { "kind": "discount", "percent": 10, "count": 1, "prefix": "PROMO" }
//   { "kind": "plan", "tier": "plus"|"pro", "days": 30, "count": 1, "prefix": "PROMO" }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const int = (v: unknown): number | null =>
  typeof v === "number" && Number.isInteger(v) ? v : null;

export async function POST(req: Request) {
  if (!adminApiAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const count = Math.min(Math.max(int(body.count) ?? 1, 1), 50);
  const prefix = String(body.prefix ?? "PROMO").toUpperCase();
  if (!/^[A-Z0-9]{2,12}$/.test(prefix)) {
    return NextResponse.json({ ok: false, error: "bad-prefix" }, { status: 400 });
  }

  let reward: Reward;
  if (body.kind === "plan") {
    const tier = body.tier === "pro" ? "pro" : body.tier === "plus" ? "plus" : null;
    const days = int(body.days);
    if (!tier || days == null || days < 0 || days > 3650) {
      return NextResponse.json(
        { ok: false, error: "plan codes need tier (plus|pro) and days (0-3650, 0 = lifetime)" },
        { status: 400 },
      );
    }
    reward = { kind: "plan", tier, days };
  } else if (body.kind === "discount") {
    const percent = int(body.percent) ?? 10;
    if (percent < 1 || percent > 100) {
      return NextResponse.json(
        { ok: false, error: "percent must be 1-100" },
        { status: 400 },
      );
    }
    reward = { kind: "discount", percent };
  } else {
    return NextResponse.json(
      { ok: false, error: "kind must be discount or plan" },
      { status: 400 },
    );
  }

  const spec = rewardToPromoSpec(reward);
  const codes: string[] = [];
  for (let n = 0; n < count; n++) {
    // Stripe promotion codes are alphanumeric — no hyphen between prefix and body.
    const res = await createStripePromoCode({
      ...spec,
      code: `${prefix}${codeBody()}`,
      maxRedemptions: 1,
      note: "Cloudflare-issued promo",
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: res.error, created: codes },
        { status: codes.length ? 500 : 503 },
      );
    }
    codes.push(res.code);
  }

  return NextResponse.json({ ok: true, label: describeReward(reward), codes });
}
