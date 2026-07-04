"use client";

import * as React from "react";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [busy, setBusy] = React.useState(false);

  function signOut() {
    setBusy(true);
    // Clear the local session copy, then hand off to the server route which
    // clears the auth cookies and redirects to /login — so /login can't see a
    // stale session and bounce back to /today.
    try {
      void createClient().auth.signOut({ scope: "local" });
    } catch {
      /* ignore */
    }
    window.location.href = "/auth/signout";
  }

  return (
    <Button type="button" variant="outline" onClick={signOut} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Sign out
    </Button>
  );
}
