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
      await createClient().auth.signOut();
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
