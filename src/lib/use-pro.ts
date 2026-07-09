"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { mergeGrant } from "@/lib/plan-merge";

// Plan tiers. Stored per-user (keyed by user id) so a plan never leaks
// between accounts on the same browser. Source of truth without real billing:
//   1. per-user localStorage flag  -> instant, reliable in this browser
//   2. the user's auth metadata    -> follows them to other devices
export type Tier = "free" | "plus" | "pro";

export const PRO_EVENT = "dailyos-pro";

const tierKey = (userId: string) => `dailyos-tier:${userId}`;
const tierExpKey = (userId: string) => `dailyos-tier-exp:${userId}`; // plan expiry (ms)
const legacyProKey = (userId: string) => `dailyos-pro:${userId}`; // older "pro" flag
const adminKey = (userId: string) => `dailyos-admin:${userId}`; // admin access

/**
 * Set the plan for an account. Pass userId (from the server) for a reliable
 * flip. `opts.expiresAt` (ms timestamp) time-limits the plan — e.g. a 3-month
 * referral reward — after which it reverts to free. Omit it for a lifetime plan
 * (the default, so existing promo codes stay permanent).
 */
export async function setPlan(
  tier: Tier,
  userId?: string,
  opts?: { expiresAt?: number | null },
) {
  const supabase = createClient();
  const expiresAt = opts?.expiresAt ?? null;

  let id = userId;
  if (!id) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      id = session?.user?.id;
    } catch {
      /* handled below */
    }
  }

  if (typeof window !== "undefined" && id) {
    if (tier === "free") {
      localStorage.removeItem(tierKey(id));
      localStorage.removeItem(legacyProKey(id));
      localStorage.removeItem(tierExpKey(id));
    } else {
      localStorage.setItem(tierKey(id), tier);
      if (tier === "pro") localStorage.setItem(legacyProKey(id), "1");
      else localStorage.removeItem(legacyProKey(id));
      if (expiresAt) localStorage.setItem(tierExpKey(id), String(expiresAt));
      else localStorage.removeItem(tierExpKey(id));
    }
    window.dispatchEvent(new Event(PRO_EVENT));
  }

  supabase.auth
    .updateUser({
      data: {
        plan: tier,
        pro: tier === "pro",
        plan_exp: tier === "free" ? null : expiresAt,
      },
    })
    .catch(() => {
      /* metadata write can fail offline; local flag still applies here */
    });
}

function readTierFor(
  id: string | undefined,
  metaPlan?: unknown,
  metaPro?: boolean,
  metaExp?: unknown,
): Tier {
  if (id && typeof window !== "undefined") {
    const t = localStorage.getItem(tierKey(id));
    if (t === "plus" || t === "pro") {
      const exp = Number(localStorage.getItem(tierExpKey(id)) || 0);
      if (exp && Date.now() > exp) {
        // Time-limited plan has lapsed — clear it and fall through to free.
        localStorage.removeItem(tierKey(id));
        localStorage.removeItem(legacyProKey(id));
        localStorage.removeItem(tierExpKey(id));
      } else {
        return t;
      }
    } else if (localStorage.getItem(legacyProKey(id)) === "1") {
      return "pro";
    }
  }
  if (metaPlan === "plus" || metaPlan === "pro") {
    const exp = metaExp ? Number(metaExp) : 0;
    if (exp && Date.now() > exp) return "free";
    return metaPlan;
  }
  if (metaPro === true) return "pro";
  return "free";
}

/** The stored plan expiry (ms) for this account, or null for lifetime/none. */
function localExp(id: string | undefined): number | null {
  if (id && typeof window !== "undefined") {
    const e = Number(localStorage.getItem(tierExpKey(id)) || 0);
    return e || null;
  }
  return null;
}

/**
 * Apply a plan reward without ever making the account worse off. Merges the
 * grant with any existing plan (localStorage or metadata) via mergeGrant: never
 * lowers the tier, never shortens access, and lifetime always beats a
 * time-limited grant of the same tier. Use this for redeemed rewards instead of
 * setPlan, so a gift can't accidentally downgrade a better plan.
 */
export async function grantPlanReward(
  tier: Extract<Tier, "plus" | "pro">,
  userId?: string,
  expiresAt?: number | null,
) {
  const supabase = createClient();
  let id = userId;
  let metaPlan: unknown;
  let metaPro = false;
  let metaExp: unknown;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    id = id ?? session?.user?.id;
    metaPlan = session?.user?.user_metadata?.plan;
    metaPro = session?.user?.user_metadata?.pro === true;
    metaExp = session?.user?.user_metadata?.plan_exp;
  } catch {
    /* fall through with what we have */
  }

  const curTier = readTierFor(id, metaPlan, metaPro, metaExp);
  const curExp =
    curTier === "free"
      ? null
      : (localExp(id) ?? (metaExp ? Number(metaExp) : null));

  const merged = mergeGrant(
    { tier: curTier, exp: curExp },
    { tier, exp: expiresAt ?? null },
  );
  await setPlan(merged.tier, id, { expiresAt: merged.exp });
  return { tier: merged.tier, expiresAt: merged.exp };
}

function readAdminFor(id: string | undefined, metaAdmin?: boolean): boolean {
  if (id && typeof window !== "undefined") {
    if (localStorage.getItem(adminKey(id)) === "1") return true;
  }
  return metaAdmin === true;
}

/** Grant or revoke admin access for an account. */
export async function setAdmin(on: boolean, userId?: string) {
  const supabase = createClient();
  let id = userId;
  if (!id) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      id = session?.user?.id;
    } catch {
      /* handled below */
    }
  }
  if (typeof window !== "undefined" && id) {
    if (on) localStorage.setItem(adminKey(id), "1");
    else localStorage.removeItem(adminKey(id));
    window.dispatchEvent(new Event(PRO_EVENT));
  }
  supabase.auth.updateUser({ data: { admin: on } }).catch(() => {
    /* metadata write can fail offline; local flag still applies here */
  });
}

/** Reactively read the account's plan tier + admin access. Pass userId (server) for reliability. */
export function usePlan(userId?: string): {
  mounted: boolean;
  /** True once the metadata read has completed (or was unnecessary). */
  resolved: boolean;
  tier: Tier;
  admin: boolean;
  /** Plan expiry (ms) for a time-limited grant, or null for lifetime/free. */
  planExp: number | null;
} {
  const [state, setState] = React.useState<{
    mounted: boolean;
    resolved: boolean;
    tier: Tier;
    admin: boolean;
    planExp: number | null;
  }>({
    mounted: false,
    resolved: false,
    tier: "free",
    admin: false,
    planExp: null,
  });

  React.useEffect(() => {
    const supabase = createClient();
    let active = true;

    // Paint immediately from localStorage so a gate never hangs on a spinner
    // while we wait for the network. The async pass below refines from metadata.
    const localTier = readTierFor(userId);
    const localAdmin = readAdminFor(userId);
    // If localStorage already grants paid access we don't need the network at
    // all — mark resolved so gates show content immediately, no flicker.
    const localResolved = localTier !== "free";
    setState({
      mounted: true,
      resolved: localResolved,
      tier: localTier,
      admin: localAdmin,
      planExp: localTier === "free" ? null : localExp(userId),
    });

    const read = async () => {
      // Fast local values (localStorage only).
      const localTier = readTierFor(userId);
      const localAdmin = readAdminFor(userId);
      const localE = localTier === "free" ? null : localExp(userId);

      let tier = localTier;
      let admin = localAdmin;
      let exp = localE;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const uid = userId ?? user.id;
          // Metadata-only view.
          const metaTier = readTierFor(
            undefined,
            user.user_metadata?.plan,
            user.user_metadata?.pro === true,
            user.user_metadata?.plan_exp,
          );
          const metaExp = user.user_metadata?.plan_exp
            ? Number(user.user_metadata.plan_exp)
            : null;
          const metaAdmin = user.user_metadata?.admin === true;

          // Merge the two, never downgrading (lifetime beats time-limited).
          const merged = mergeGrant(
            { tier: readTierFor(uid), exp: localExp(uid) },
            { tier: metaTier, exp: metaExp },
          );
          tier = merged.tier;
          exp = merged.tier === "free" ? null : merged.exp;
          admin = localAdmin || metaAdmin;

          // Heal whichever store is behind so the plan survives logout/login and
          // separate PWA/Safari storage. Write directly (no PRO_EVENT) to avoid
          // re-triggering this read.
          if (tier !== "free") {
            const lsBehind =
              readTierFor(uid) !== tier || localExp(uid) !== (exp ?? null);
            if (lsBehind && typeof window !== "undefined") {
              try {
                localStorage.setItem(tierKey(uid), tier);
                if (tier === "pro") localStorage.setItem(legacyProKey(uid), "1");
                else localStorage.removeItem(legacyProKey(uid));
                if (exp) localStorage.setItem(tierExpKey(uid), String(exp));
                else localStorage.removeItem(tierExpKey(uid));
              } catch {
                /* ignore */
              }
            }
            if (metaTier !== tier || metaExp !== (exp ?? null)) {
              supabase.auth
                .updateUser({
                  data: {
                    plan: tier,
                    pro: tier === "pro",
                    plan_exp: exp ?? null,
                  },
                })
                .catch(() => {});
            }
          }
          if (admin && !metaAdmin) {
            supabase.auth.updateUser({ data: { admin: true } }).catch(() => {});
          }
        }
      } catch {
        /* fall through with local values */
      }

      if (active)
        setState({ mounted: true, resolved: true, tier, admin, planExp: exp });
    };

    read();
    window.addEventListener(PRO_EVENT, read);
    window.addEventListener("storage", read);
    const { data: sub } = supabase.auth.onAuthStateChange(() => read());

    return () => {
      active = false;
      window.removeEventListener(PRO_EVENT, read);
      window.removeEventListener("storage", read);
      sub.subscription.unsubscribe();
    };
  }, [userId]);

  return state;
}

/** True if `tier` meets the `required` access level. */
export function tierMeets(tier: Tier, required: "Plus" | "Pro"): boolean {
  if (tier === "pro") return true;
  if (required === "Plus" && tier === "plus") return true;
  return false;
}

// ---- Back-compat helpers (treat any paid tier as "pro") --------------------

export function usePro(userId?: string): { mounted: boolean; pro: boolean } {
  const { mounted, tier } = usePlan(userId);
  return { mounted, pro: tier !== "free" };
}

export async function setPro(on: boolean, userId?: string) {
  return setPlan(on ? "pro" : "free", userId);
}
