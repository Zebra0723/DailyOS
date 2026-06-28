"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

// The only "plan" signal we have without real billing: the ARLEOPRO promo.
// It's stored on the *user's account* (auth metadata) — NOT in localStorage —
// so it's tied to the person, not the browser. (A browser-wide flag leaked
// Pro to every account signed in on the same device.)
export const PRO_EVENT = "dailyos-pro";

/** Grant or revoke Pro for the currently signed-in account. */
export async function setPro(on: boolean) {
  const supabase = createClient();
  await supabase.auth.updateUser({ data: { pro: on } });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRO_EVENT));
  }
}

/** Reactively read whether the current account has Pro unlocked. */
export function usePro(): { mounted: boolean; pro: boolean } {
  const [state, setState] = React.useState({ mounted: false, pro: false });

  React.useEffect(() => {
    const supabase = createClient();
    let active = true;

    const read = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (active) {
        setState({ mounted: true, pro: user?.user_metadata?.pro === true });
      }
    };

    read();
    // Re-read when the promo is applied and whenever the account changes
    // (sign in/out/switch) so Pro never carries over between accounts.
    window.addEventListener(PRO_EVENT, read);
    const { data: sub } = supabase.auth.onAuthStateChange(() => read());

    return () => {
      active = false;
      window.removeEventListener(PRO_EVENT, read);
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
