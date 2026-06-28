"use client";

import * as React from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    setBusy(true);
    try {
      // Local scope clears the session in the browser without waiting on a
      // slow global revocation. Cap it so it can never hang.
      await Promise.race([
        createClient().auth.signOut({ scope: "local" }),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch {
      /* ignore — redirect regardless */
    }
    // Hard navigation guarantees a clean, fully-reloaded /login.
    window.location.href = "/login";
  }

  return (
    <Button type="button" variant="outline" onClick={signOut} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Sign out
    </Button>
  );
}
