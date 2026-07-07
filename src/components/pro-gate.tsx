"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Sparkles, Loader2, KeyRound } from "lucide-react";
import { usePlan, tierMeets, setPlan } from "@/lib/use-pro";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useToast } from "@/components/ui/toast";

/**
 * Gates a Plus/Pro-only feature. Free users see a locked screen with a short
 * description of the feature and a link to choose a plan; unlocked users see
 * the real content.
 */
export function ProGate({
  feature,
  blurb,
  tier = "Plus",
  userId,
  children,
}: {
  feature: string;
  blurb: string;
  tier?: "Plus" | "Pro";
  userId?: string;
  children: React.ReactNode;
}) {
  const { mounted, resolved, tier: userTier } = usePlan(userId);
  const { toast } = useToast();

  // Give the plan a short moment to confirm (metadata read) before we commit to
  // the lock screen — just long enough to avoid flashing the lock at a paying
  // user whose plan lives only in account metadata. After it elapses we show the
  // lock no matter what, so a slow/hung network can never leave a paid feature
  // stuck on a spinner forever.
  const [graceElapsed, setGraceElapsed] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setGraceElapsed(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  function ownerUnlock() {
    // Owners (Arjun & Leo) are meant to have Pro — unlock this account in one
    // tap, no code typing. Grants Pro only; admin/testing is separate now and
    // comes solely from the HOMEOSVIP25 code.
    void setPlan("pro", userId);
    toast({ variant: "success", title: `${feature} unlocked` });
  }

  // Access granted → show content. Otherwise show the lock screen. We only hold
  // a brief spinner while the plan is still confirming AND the grace window is
  // open — so a paying user doesn't flash the lock, but a free user (or a hung
  // network) always lands on the lock screen instead of an endless spinner.
  if (mounted && tierMeets(userTier, tier)) return <>{children}</>;
  if (!mounted || (!resolved && !graceElapsed)) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid place-items-center py-8">
      <div className="w-full max-w-sm rounded-3xl border border-primary/20 bg-gradient-to-b from-accent to-accent/40 p-8 text-center shadow-elevated">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {/* Lock tile */}
        <div className="mx-auto mb-5 grid size-24 place-items-center rounded-[1.75rem] bg-gradient-to-br from-primary to-primary/75 shadow-lg shadow-primary/30">
          <Lock className="size-12 text-primary-foreground" />
        </div>

        {/* Passcode hint dots */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-primary/40" />
          ))}
        </div>

        <h3 className="text-xl font-bold">{feature} is a {tier} feature</h3>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
          {blurb}
        </p>

        <Button asChild className="mt-6 w-full">
          <Link href="/subscriptions">
            <Sparkles className="size-4" /> See plans &amp; upgrade
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          {tier === "Pro" ? "Included on Pro" : "Included on Plus & Pro"} · or enter a
          code on the subscriptions page.
        </p>

        {/* Owner unlock — one tap for Arjun & Leo, no code needed. */}
        <button
          onClick={ownerUnlock}
          className="mx-auto mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <KeyRound className="size-3.5" /> Owner? Unlock {feature} now
        </button>
      </div>
    </div>
  );
}
