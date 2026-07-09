"use server";

import { randomUUID } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendRewardEmail, emailConfigured } from "@/lib/email";
import {
  MILESTONES,
  describeReward,
  type Reward,
} from "@/lib/referral-rewards";

type Admin = ReturnType<typeof createServiceClient>;

/** A unique, human-ish reward code, e.g. "FRIEND-9F3A1C7E". */
function generateFriendCode(): string {
  return `FRIEND-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/** Issue a single-use reward code to someone. Returns the code, or null if the
 *  reward_codes table isn't migrated yet (best-effort). */
async function issueRewardCode(
  admin: Admin,
  opts: {
    recipientId: string;
    recipientEmail: string | null;
    reward: Reward;
    milestone: number;
  },
): Promise<string | null> {
  for (let i = 0; i < 3; i++) {
    const code = generateFriendCode();
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
      code,
      recipient_id: opts.recipientId,
      recipient_email: opts.recipientEmail,
      milestone: opts.milestone,
      ...row,
    });
    if (!error) return code;
    // 23505 = unique violation (code collision) — retry with a new code.
    if (error.code !== "23505") return null;
  }
  return null;
}

/**
 * Mark the current user's referral as converted (they've landed on a paid plan)
 * and email both them and the friend who referred them the 10%-off code.
 *
 * Best-effort throughout: if the referrals table isn't migrated yet, the user
 * wasn't referred, or email isn't configured, it returns a soft result instead
 * of throwing so the caller (the pricing table) never breaks.
 *
 * For testing before Stripe is live, "landed on a paid plan" simply means the
 * friend entered a paid code — the caller decides when to fire.
 */
export async function recordReferralConversion(): Promise<{
  ok: boolean;
  reason?: string;
  emailed?: boolean;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "no-user" };

  const referrerId = user.user_metadata?.referred_by as string | undefined;
  if (!referrerId || referrerId === user.id) {
    return { ok: false, reason: "not-referred" };
  }

  const admin = createServiceClient();

  // Look up the referrer's email (the friend's is on the session user).
  let referrerEmail: string | null = null;
  try {
    const { data } = await admin.auth.admin.getUserById(referrerId);
    referrerEmail = data.user?.email ?? null;
  } catch {
    /* referrer may have been deleted — carry on, we can still record */
  }

  // Record / flip the referral. If this is the first time it converts, we send
  // the reward emails; a second call is idempotent and won't re-email.
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
    // Table not migrated yet — still try to reward so testing works day one.
  }

  if (!firstConversion) return { ok: true, reason: "already-converted" };

  // The referred friend's welcome reward: 10% off, as their own single-use code.
  // milestone 0 marks it as the friend's welcome, distinct from the referrer's
  // rung-1 reward (also 10%) so the two never collide on (recipient, milestone).
  const friendReward: Reward = { kind: "discount", percent: 10 };
  const friendCode = await issueRewardCode(admin, {
    recipientId: user.id,
    recipientEmail: user.email ?? null,
    reward: friendReward,
    milestone: 0,
  });

  // The referrer's ladder: issue every rung they've now reached but haven't been
  // given yet. Doing it by "reached but not issued" (rather than an exact count
  // match) means a rung is never lost if two conversions land at once, and it's
  // idempotent — an already-issued rung is skipped.
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

/**
 * How many people this user has referred, and how many converted. For admins,
 * a testing delta (see adminSetReferralTestDelta) is folded into the numbers so
 * they can preview the prize ladder without real referrals. Non-admins never see
 * a delta applied, even if a stale one is left in their metadata.
 */
export async function getReferralSummary(): Promise<{
  total: number;
  converted: number;
  /** Simulated-referral offset applied for admins (0 for everyone else). */
  testDelta: number;
  /** Whether this account is an admin (controls the testing UI). */
  admin: boolean;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, converted: 0, testDelta: 0, admin: false };

  const isAdmin = user.user_metadata?.admin === true;
  const delta = isAdmin
    ? Math.trunc(Number(user.user_metadata?.ref_test_delta ?? 0)) || 0
    : 0;

  try {
    const { data } = await supabase
      .from("referrals")
      .select("status")
      .eq("referrer_id", user.id);
    const rows = data ?? [];
    const realConverted = rows.filter((r) => r.status === "converted").length;
    const converted = Math.max(0, realConverted + delta);
    const total = Math.max(rows.length + delta, converted, 0);
    return { total, converted, testDelta: delta, admin: isAdmin };
  } catch {
    // Table not migrated — still let an admin simulate off a zero baseline.
    const converted = Math.max(0, delta);
    return { total: converted, converted, testDelta: delta, admin: isAdmin };
  }
}

/**
 * Admin-only: set the simulated-referral delta on this account, for previewing
 * the prize ladder. Gated server-side on the account's admin metadata, so a
 * non-admin can't call it to fake rewards. Clamped to a sane range.
 */
export async function adminSetReferralTestDelta(
  delta: number,
): Promise<{ ok: boolean; delta?: number }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  if (user.user_metadata?.admin !== true) return { ok: false };

  const clamped = Math.max(-100, Math.min(100, Math.trunc(Number(delta)) || 0));
  const { error } = await supabase.auth.updateUser({
    data: { ref_test_delta: clamped },
  });
  if (error) return { ok: false };

  // Reconcile the ACTUAL reward codes so the "Your reward codes" section
  // reflects the simulated referrals: issue a code for each milestone the
  // simulated count now reaches, and remove any unused *simulated* code that's
  // no longer reached. Real earned codes (non "SIM-") are never touched.
  try {
    const admin = createServiceClient();
    const { count } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id)
      .eq("status", "converted");
    const effective = Math.max(0, (count ?? 0) + clamped);

    for (const m of MILESTONES) {
      const { data: existing } = await admin
        .from("reward_codes")
        .select("code,used")
        .eq("recipient_id", user.id)
        .eq("milestone", m.count)
        .maybeSingle();

      if (effective >= m.count && !existing) {
        const code = `SIM-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
        const row =
          m.reward.kind === "plan"
            ? {
                kind: "plan",
                plan_tier: m.reward.tier,
                plan_days: m.reward.days,
                percent: 0,
              }
            : { kind: "discount", percent: m.reward.percent };
        await admin.from("reward_codes").insert({
          code,
          recipient_id: user.id,
          recipient_email: user.email,
          milestone: m.count,
          ...row,
        });
      } else if (
        effective < m.count &&
        existing &&
        !existing.used &&
        typeof existing.code === "string" &&
        existing.code.startsWith("SIM-")
      ) {
        await admin.from("reward_codes").delete().eq("code", existing.code);
      }
    }
  } catch {
    /* best-effort testing aid — never block the delta update */
  }

  return { ok: true, delta: clamped };
}
