"use server";

import { randomUUID } from "crypto";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import { MILESTONES } from "@/lib/referral-rewards";

// Referral conversion (issuing Stripe reward codes on a real payment) lives in
// src/lib/referral-convert.ts and is driven by the Stripe webhook — not from a
// client-callable action, since it acts on an arbitrary user id.

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

  const isAdmin = isAdminUser(user);
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
  if (!isAdminUser(user)) return { ok: false };

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
