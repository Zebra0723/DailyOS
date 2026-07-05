"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  sendReferralRewards,
  REFERRAL_REWARD_CODE,
  emailConfigured,
} from "@/lib/email";

/**
 * Mark the current user's referral as converted (they've landed on a paid plan)
 * and email both them and the friend who referred them the 10%-off code.
 *
 * Best-effort throughout: if the referrals table isn't migrated yet, the user
 * wasn't referred, or email isn't configured, it returns a soft result instead
 * of throwing so the caller (the pricing table) never breaks.
 *
 * For testing before Stripe is live, "landed on a paid plan" simply means the
 * friend entered a paid code (e.g. ARLEOPRO) — the caller decides when to fire.
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
          reward_code: REFERRAL_REWARD_CODE,
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
        reward_code: REFERRAL_REWARD_CODE,
        converted_at: new Date().toISOString(),
      });
    }
  } catch {
    // Table not migrated yet — still try to email so testing works day one.
  }

  if (!firstConversion) return { ok: true, reason: "already-converted" };

  const { referrer, referred } = await sendReferralRewards({
    referrerEmail,
    referredEmail: user.email,
  });

  return {
    ok: true,
    emailed: referrer.ok || referred.ok,
    reason: emailConfigured() ? undefined : "email-not-configured",
  };
}

/** How many people this user has referred, and how many converted. */
export async function getReferralSummary(): Promise<{
  total: number;
  converted: number;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { total: 0, converted: 0 };

  try {
    const { data } = await supabase
      .from("referrals")
      .select("status")
      .eq("referrer_id", user.id);
    const rows = data ?? [];
    return {
      total: rows.length,
      converted: rows.filter((r) => r.status === "converted").length,
    };
  } catch {
    return { total: 0, converted: 0 };
  }
}
