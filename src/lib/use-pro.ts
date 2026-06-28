"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

// Plan tiers. Stored per-user (keyed by user id) so a plan never leaks
// between accounts on the same browser. Source of truth without real billing:
//   1. per-user localStorage flag  -> instant, reliable in this browser
//   2. the user's auth metadata    -> follows them to other devices
export type Tier = "free" | "plus" | "pro";

export const PRO_EVENT = "dailyos-pro";

const tierKey = (userId: string) => `dailyos-tier:${userId}`;
const legacyProKey = (userId: string) => `dailyos-pro:${userId}`; // older "pro" flag

/** Set the plan for an account. Pass userId (from the server) for a reliable flip. */
export async function setPlan(tier: Tier, userId?: string) {
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
    if (tier === "free") {
      localStorage.removeItem(tierKey(id));
      localStorage.removeItem(legacyProKey(id));
    } else {
      localStorage.setItem(tierKey(id), tier);
      if (tier === "pro") localStorage.setItem(legacyProKey(id), "1");
      else localStorage.removeItem(legacyProKey(id));
    }
    window.dispatchEvent(new Event(PRO_EVENT));
  }

  supabase.auth
    .updateUser({ data: { plan: tier, pro: tier === "pro" } })
    .catch(() => {
      /* metadata write can fail offline; local flag still applies here */
    });
}

function readTierFor(
  id: string | undefined,
  metaPlan?: unknown,
  metaPro?: boolean,
): Tier {
  if (id && typeof window !== "undefined") {
    const t = localStorage.getItem(tierKey(id));
    if (t === "plus" || t === "pro") return t;
    if (localStorage.getItem(legacyProKey(id)) === "1") return "pro";
  }
  if (metaPlan === "plus" || metaPlan === "pro") return metaPlan;
  if (metaPro === true) return "pro";
  return "free";
}

/** Reactively read the account's plan tier. Pass userId (server) for reliability. */
export function usePlan(userId?: string): { mounted: boolean; tier: Tier } {
  const [state, setState] = React.useState<{ mounted: boolean; tier: Tier }>({
    mounted: false,
    tier: "free",
  });

  React.useEffect(() => {
    const supabase = createClient();
    let active = true;

    const read = async () => {
      let tier = readTierFor(userId);
      if (tier === "free") {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const user = session?.user;
          if (user) {
            tier = readTierFor(
              userId ?? user.id,
              user.user_metadata?.plan,
              user.user_metadata?.pro === true,
            );
          }
        } catch {
          /* fall through with free */
        }
      }
      if (active) setState({ mounted: true, tier });
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
