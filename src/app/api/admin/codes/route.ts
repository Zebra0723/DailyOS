import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { adminApiAuthorized } from "@/lib/admin-api-auth";
import { describeReward, type Reward } from "@/lib/referral-rewards";

// POST /api/admin/codes — create promo codes (token-authenticated, for the
// Cloudflare Worker). Codes are reward_codes rows with no recipient, so the
// existing in-app redeem flow accepts them from any account, single-use.
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
  let row: Record<string, unknown>;
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
    row = { kind: "plan", plan_tier: tier, plan_days: days, percent: 0 };
  } else if (body.kind === "discount") {
    const percent = int(body.percent) ?? 10;
    if (percent < 1 || percent > 100) {
      return NextResponse.json(
        { ok: false, error: "percent must be 1-100" },
        { status: 400 },
      );
    }
    reward = { kind: "discount", percent };
    row = { kind: "discount", percent };
  } else {
    return NextResponse.json(
      { ok: false, error: "kind must be discount or plan" },
      { status: 400 },
    );
  }

  const admin = createServiceClient();
  const codes: string[] = [];
  for (let n = 0; n < count; n++) {
    let inserted = false;
    for (let attempt = 0; attempt < 3 && !inserted; attempt++) {
      const code = `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      const { error } = await admin.from("reward_codes").insert({
        code,
        recipient_id: null, // no owner — redeemable by any account, once
        recipient_email: null,
        milestone: null,
        ...row,
      });
      if (!error) {
        codes.push(code);
        inserted = true;
      } else if (error.code !== "23505") {
        // Anything but a code collision is a real failure.
        return NextResponse.json(
          { ok: false, error: error.message, created: codes },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ ok: true, label: describeReward(reward), codes });
}
