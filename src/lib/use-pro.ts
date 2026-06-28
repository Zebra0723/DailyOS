"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

// The only "plan" signal we have without real billing: the ARLEOPRO promo.
// Stored TWO ways, both keyed/scoped to the signed-in user so Pro never leaks
// between accounts on the same browser:
//   1. a per-user localStorage flag  -> instant, reliable unlock in this browser
//   2. the user's auth metadata      -> follows them to other devices
// Pro is on if EITHER says so.
export const PRO_EVENT = "dailyos-pro";

const keyFor = (userId: string) => `dailyos-pro:${userId}`;

/** Grant or revoke Pro for the currently signed-in account. */
export async function setPro(on: boolean) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  // 1. Instant local flip for this account in this browser.
  if (typeof window !== "undefined") {
    if (on) localStorage.setItem(keyFor(user.id), "1");
    else localStorage.removeItem(keyFor(user.id));
    window.dispatchEvent(new Event(PRO_EVENT));
  }

  // 2. Best-effort cross-device persistence (don't block the UI on it).
  supabase.auth.updateUser({ data: { pro: on } }).catch(() => {
    /* metadata write can fail offline; the local flag still unlocks here */
  });
}

/** Reactively read whether the current account has Pro unlocked. */
export function usePro(): { mounted: boolean; pro: boolean } {
  const [state, setState] = React.useState({ mounted: false, pro: false });

  React.useEffect(() => {
    const supabase = createClient();
    let active = true;

    const read = async () => {
      // getSession reads the locally-stored session (no network) — fast and
      // fine for a non-security UI flag like Pro. Always resolve `mounted` so
      // gated screens never get stuck on their loading skeleton.
      let pro = false;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        const metaPro = user?.user_metadata?.pro === true;
        const localPro =
          !!user && typeof window !== "undefined" &&
          localStorage.getItem(keyFor(user.id)) === "1";
        pro = metaPro || localPro;
      } catch {
        /* fall through with pro = false */
      }
      if (active) setState({ mounted: true, pro });
    };

    read();
    // Re-read when the promo is applied and whenever the account changes
    // (sign in/out/switch) so Pro never carries over between accounts.
    window.addEventListener(PRO_EVENT, read);
    window.addEventListener("storage", read);
    const { data: sub } = supabase.auth.onAuthStateChange(() => read());

    return () => {
      active = false;
      window.removeEventListener(PRO_EVENT, read);
      window.removeEventListener("storage", read);
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
