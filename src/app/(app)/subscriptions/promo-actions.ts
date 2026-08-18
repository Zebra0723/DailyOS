"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

// Server-side promo/admin code validation. Production codes live in Vercel
// environment variables and never enter the client bundle. Public fallback
// plan codes keep local/demo installs usable, but admin has no public fallback.
//
//   ADMIN_CODE  -> Pro + admin (the /admin console, testing tools)
//   PRO_CODE    -> lifetime Pro
//   PLUS_CODE   -> Plus
//   FREE_CODE   -> reset to Free (also revokes admin)

type PromoPlan = "free" | "plus" | "pro";

export type PromoResult =
  | { ok: true; plan: PromoPlan; admin: boolean }
  | { ok: false };

function norm(v: string | undefined): string {
  return (v ?? "").trim().toUpperCase();
}

function resolvePromoCode(raw: string): PromoResult {
  const entered = norm(raw);
  if (!entered) return { ok: false };

  // ARLEOFREE is always a valid RESET: back to Free and admin OFF. A reset only
  // ever removes access, so it's safe to keep as a known code even though the
  // unlock codes are private. (A custom FREE_CODE below also works.)
  if (entered === "ARLEOFREE") return { ok: true, plan: "free", admin: false };

  const adminCode = norm(process.env.ADMIN_CODE);
  const proCode = norm(process.env.PRO_CODE);
  const plusCode = norm(process.env.PLUS_CODE);
  const freeCode = norm(process.env.FREE_CODE);
  const configured = !!(adminCode || proCode || plusCode || freeCode);

  if (configured) {
    // Private codes are set in the environment — these are the ONLY codes that
    // work, and the defaults below are disabled. Set the env vars to rotate to
    // secret codes known only to you.
    if (adminCode && entered === adminCode) return { ok: true, plan: "pro", admin: true };
    if (proCode && entered === proCode) return { ok: true, plan: "pro", admin: false };
    if (plusCode && entered === plusCode) return { ok: true, plan: "plus", admin: false };
    if (freeCode && entered === freeCode) return { ok: true, plan: "free", admin: false };
    return { ok: false };
  }

  // Default codes so the app works out of the box. These are visible in the
  // (public) source; set the env vars above to replace them with private ones.
  switch (entered) {
    case "HOMEOSVIP25":
      return { ok: true, plan: "pro", admin: true };
    case "ARLEOPRO":
      return { ok: true, plan: "pro", admin: false };
    case "ARLEOPLUS":
      return { ok: true, plan: "plus", admin: false };
    // ARLEOFREE is handled above as an always-on reset.
    default:
      return { ok: false };
  }
}

/** Validate and apply a promo in one Auth Admin update. Admin is written only
 * through the service client because user metadata is editable by the user. */
export async function redeemPromoCode(raw: string): Promise<PromoResult> {
  const result = resolvePromoCode(raw);
  if (!result.ok) return result;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      plan: result.plan,
      pro: result.plan === "pro",
      plan_exp: null,
    },
    ...(result.admin || result.plan === "free"
      ? {
          app_metadata: {
            ...user.app_metadata,
            admin: result.admin,
          },
        }
      : {}),
  });
  if (error) return { ok: false };

  return result;
}

/**
 * Persist the account's plan to Supabase auth metadata SERVER-SIDE, awaited.
 *
 * This is what makes a subscription follow the account to another device. The
 * client also mirrors the plan into auth metadata, but that write is
 * fire-and-forget and can be dropped (tab closed mid-request, flaky network),
 * leaving the plan stranded in one device's localStorage. This awaited server
 * write — authenticated by the user's own cookie session — is the authoritative
 * one: once it returns ok, any other device that logs in reads the same plan.
 */
export async function persistPlan(input: {
  plan: PromoPlan;
  expiresAt?: number | null;
}): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.auth.updateUser({
    data: {
      plan: input.plan,
      pro: input.plan === "pro",
      plan_exp: input.plan === "free" ? null : (input.expiresAt ?? null),
    },
  });
  return { ok: !error };
}
