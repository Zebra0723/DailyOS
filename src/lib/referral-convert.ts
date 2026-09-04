import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { sendRewardEmail, emailConfigured } from "@/lib/email";
import {
  MILESTONES,
  describeReward,
  type Reward,
} from "@/lib/referral-rewards";
import { createStripePromoCode } from "@/lib/stripe-promo";
import { rewardToPromoSpec } from "@/lib/reward-promo-spec";

type Admin = ReturnType<typeof createServiceClient>;

// Referral conversion, driven server-side. This is NOT a client-callable server
// action on purpose: it acts on an arbitrary user id, so only trusted callers
// (the Stripe webhook, which knows a payment really happened) may run it.

/** Create a single-use Stripe promo code for a reward and log a tracking row so
 *  the user can see it on their Subscriptions page. Returns the code, or null if
 *  Stripe isn't configured / the insert failed (best-effort). */
async function issueRewardCode(
  admin: Admin,
  opts: {
    recipientId: string;
    recipientEmail: string | null;
    reward: Reward;
    milestone: number;
  },
): Promise<string | null> {
  const res = await createStripePromoCode({
    ...rewardToPromoSpec(opts.reward),
    maxRedemptions: 1,
    note: `Referral reward (milestone ${opts.milestone})`,
  });
  if (!res.ok) return null;

  const row =
    opts.reward.kind === "plan"
      ? {
          kind: "plan",
          plan_tier: opts.reward.tier,
          plan_days: opts.reward.days,
          percent: 0,
        }
      : { kind: "discount", percent: opts.reward.percent };

  const { error } = await admin.from("reward_codes").insert({
    code: res.code,
    recipient_id: opts.recipientId,
    recipient_email: opts.recipientEmail,
    milestone: opts.milestone,
    ...row,
  });
  if (error) return null;
  return res.code;
}

/**
 * Mark a user's referral as converted (they've landed on a paid plan) and email
 * both them and the friend who referred them their Stripe reward codes.
 *
 * Best-effort throughout: if the referrals table isn't migrated, the user wasn't
 * referred, Stripe isn't configured, or email isn't wired, it returns a soft
 * result instead of throwing so the caller (the Stripe webhook) never breaks.
 */
export async function convertReferralForUser(actingUserId: string): Promise<{
  ok: boolean;
  reason?: string;
  emailed?: boolean;
}> {
  const admin = createServiceClient();

  const { data: acting } = await admin.auth.admin.getUserById(actingUserId);
  const user = acting?.user;
  if (!user) return { ok: false, reason: "no-user" };

  const referrerId = user.user_metadata?.referred_by as string | undefined;
  if (!referrerId || referrerId === user.id) {
    return { ok: false, reason: "not-referred" };
  }

  // Look up the referrer's email.
  let referrerEmail: string | null = null;
  try {
    const { data } = await admin.auth.admin.getUserById(referrerId);
    referrerEmail = data.user?.email ?? null;
  } catch {
    /* referrer may have been deleted — carry on, we can still record */
  }

  // Record / flip the referral. The first time it converts, we send the reward
  // emails; a second call is idempotent and won't re-email.
  let firstConversion = true;
  try {
    const { data: existing } = await admin
      .from("referrals")
      .select("id,status")
      .eq("referred_id", user.id)
      .maybeSingle();

    if (existing?.status === "converted") {
      firstConversion = false;
    } else if (existing) {
      await admin
        .from("referrals")
        .update({
          status: "converted",
          converted_at: new Date().toISOString(),
          referred_email: user.email,
        })
        .eq("id", existing.id);
    } else {
      await admin.from("referrals").insert({
        referrer_id: referrerId,
        referred_id: user.id,
        referred_email: user.email,
        status: "converted",
        converted_at: new Date().toISOString(),
      });
    }
  } catch {
    // Table not migrated yet — still try to reward.
  }

  if (!firstConversion) return { ok: true, reason: "already-converted" };

  // The referred friend's welcome reward: 10% off, as their own single-use code.
  const friendReward: Reward = { kind: "discount", percent: 10 };
  const friendCode = await issueRewardCode(admin, {
    recipientId: user.id,
    recipientEmail: user.email ?? null,
    reward: friendReward,
    milestone: 0,
  });

  // The referrer's ladder: issue every rung they've now reached but not yet been
  // given. Idempotent — an already-issued rung is skipped.
  const referrerRewards: { code: string; label: string }[] = [];
  try {
    const { count } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referrerId)
      .eq("status", "converted");
    const reached = MILESTONES.filter((m) => (count ?? 0) >= m.count);
    for (const m of reached) {
      const { data: already } = await admin
        .from("reward_codes")
        .select("code")
        .eq("recipient_id", referrerId)
        .eq("milestone", m.count)
        .maybeSingle();
      if (already) continue;
      const code = await issueRewardCode(admin, {
        recipientId: referrerId,
        recipientEmail: referrerEmail,
        reward: m.reward,
        milestone: m.count,
      });
      if (code) referrerRewards.push({ code, label: m.label });
    }
  } catch {
    /* referrals table not migrated — skip the ladder rewards */
  }

  const sends: Promise<{ ok: boolean }>[] = [];
  if (user.email && friendCode) {
    sends.push(
      sendRewardEmail({
        to: user.email,
        audience: "friend",
        code: friendCode,
        rewardLabel: describeReward(friendReward),
      }),
    );
  }
  if (referrerEmail) {
    for (const r of referrerRewards) {
      sends.push(
        sendRewardEmail({
          to: referrerEmail,
          audience: "referrer",
          code: r.code,
          rewardLabel: r.label,
        }),
      );
    }
  }
  const results = await Promise.all(sends);

  return {
    ok: true,
    emailed: results.some((r) => r.ok),
    reason: emailConfigured() ? undefined : "email-not-configured",
  };
}
