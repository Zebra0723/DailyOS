"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  describeReward,
  rewardCodeExpired,
  REWARD_CODE_TTL_DAYS,
  type Reward,
} from "@/lib/referral-rewards";

type RedeemResult =
  | { ok: true; reward: Reward; label: string }
  | { ok: false; reason: "invalid" | "used" | "expired" | "not-active" | "no-user" };

export type MyRewardCode = {
  code: string;
  label: string;
  used: boolean;
  expired: boolean;
};

/** The reward codes issued to the signed-in user, newest first. Lets people see
 *  and redeem their codes in-app without depending on email. */
export async function getMyRewardCodes(): Promise<MyRewardCode[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  try {
    const { data } = await supabase
      .from("reward_codes")
      .select("code,kind,percent,plan_tier,plan_days,used,created_at")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });
    const now = Date.now();
    return (data ?? []).map((r) => {
      const reward: Reward =
        r.kind === "plan"
          ? {
              kind: "plan",
              tier: r.plan_tier === "pro" ? "pro" : "plus",
              days: r.plan_days ?? 0,
            }
          : { kind: "discount", percent: r.percent ?? 10 };
      return {
        code: r.code,
        label: describeReward(reward),
        used: r.used,
        expired: rewardCodeExpired(r.created_at, now),
      };
    });
  } catch {
    return [];
  }
}

/** Unclaimed, non-expired codes for the Today heads-up. */
export async function getClaimableRewardCodes(): Promise<
  { code: string; label: string }[]
> {
  const all = await getMyRewardCodes();
  return all
    .filter((c) => !c.used && !c.expired)
    .map(({ code, label }) => ({ code, label }));
}

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
  const cutoff = new Date(
    Date.now() - REWARD_CODE_TTL_DAYS * 86_400_000,
  ).toISOString();
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
      .gte("created_at", cutoff) // only claim codes still inside their 2-month window
      .select("kind,percent,plan_tier,plan_days")
      .maybeSingle();

    if (error) return { ok: false, reason: "not-active" };
    if (!data) {
      // No row updated: doesn't exist, already spent, or lapsed. Distinguish so
      // the message is right.
      const { data: existing } = await admin
        .from("reward_codes")
        .select("used,created_at")
        .eq("code", code)
        .maybeSingle();
      if (!existing) return { ok: false, reason: "invalid" };
      if (existing.used) return { ok: false, reason: "used" };
      if (rewardCodeExpired(existing.created_at, Date.now()))
        return { ok: false, reason: "expired" };
      return { ok: false, reason: "invalid" };
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
