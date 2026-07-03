"use client";

import Link from "next/link";
import { Lock, Sparkles, Loader2 } from "lucide-react";
import { usePlan, tierMeets } from "@/lib/use-pro";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

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

  // Access granted → show content. Otherwise, while we're still confirming the
  // plan (metadata read in flight) show a spinner rather than flashing the lock
  // screen at a paying user. Only show the lock once the plan is resolved.
  if (mounted && tierMeets(userTier, tier)) return <>{children}</>;
  if (!mounted || !resolved) {
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
          <Link href="/settings">
            <Sparkles className="size-4" /> See plans &amp; upgrade
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          {tier === "Pro" ? "Included on Pro" : "Included on Plus & Pro"} · or enter a
          code on the subscriptions page.
        </p>
      </div>
    </div>
  );
}
