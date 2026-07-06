"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { describeReward, type Reward } from "@/lib/referral-rewards";

type RedeemResult =
  | { ok: true; reward: Reward; label: string }
  | { ok: false; reason: "invalid" | "used" | "not-active" | "no-user" };

/**
 * Claim a single-use reward code. The claim is a single conditional UPDATE
 * (only matches while `used` is false), so a code can be redeemed exactly once
 * across all accounts — a second attempt, even a simultaneous one, finds no row
 * to update and is rejected. Runs via the service client so it can flip the
 * flag regardless of who owns the code.
 */
export async function redeemRewardCode(raw: string): Promise<RedeemResult> {
  const code = raw.trim().toUpperCase();
  if (!code) return { ok: false, reason: "invalid" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "no-user" };

  const admin = createServiceClient();
  try {
    const { data, error } = await admin
      .from("reward_codes")
      .update({
        used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq("code", code)
      .eq("used", false)
      .select("kind,percent,plan_tier,plan_days")
      .maybeSingle();

    if (error) return { ok: false, reason: "not-active" };
    if (!data) {
      // No row updated: either the code doesn't exist or it's already spent.
      const { data: exists } = await admin
        .from("reward_codes")
        .select("code")
        .eq("code", code)
        .maybeSingle();
      return { ok: false, reason: exists ? "used" : "invalid" };
    }

    const reward: Reward =
      data.kind === "plan"
        ? {
            kind: "plan",
            tier: data.plan_tier === "pro" ? "pro" : "plus",
            days: data.plan_days ?? 0,
          }
        : { kind: "discount", percent: data.percent ?? 10 };

    return { ok: true, reward, label: describeReward(reward) };
  } catch {
    return { ok: false, reason: "not-active" };
  }
}
