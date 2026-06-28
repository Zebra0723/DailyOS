"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { usePro } from "@/lib/use-pro";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

/**
 * Gates a Plus/Pro-only feature. Free users see a locked screen with an
 * upgrade prompt; unlocked users see the real content.
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
  const { mounted, pro } = usePro(userId);

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }
  if (pro) return <>{children}</>;

  return (
    <div className="grid place-items-center py-8">
      <div className="w-full max-w-sm rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50 to-blue-100/50 p-8 text-center shadow-elevated dark:border-blue-500/20 dark:from-blue-500/10 dark:to-blue-500/[0.03]">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {/* Big blue lock */}
        <div className="mx-auto mb-5 grid size-24 place-items-center rounded-[1.75rem] bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
          <Lock className="size-12 text-white" />
        </div>

        {/* "code thingy" — a passcode hint */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="size-2.5 rounded-full bg-blue-400/70 dark:bg-blue-400/50"
            />
          ))}
        </div>

        <h3 className="text-xl font-bold text-blue-950 dark:text-blue-100">
          {feature} is locked
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-sm text-blue-900/70 dark:text-blue-200/70">
          {blurb}
        </p>

        <Button
          asChild
          className="mt-6 w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          <Link href="/settings">
            <Sparkles className="size-4" /> Unlock with {tier}
          </Link>
        </Button>
        <p className="mt-3 text-xs text-blue-700/70 dark:text-blue-300/60">
          Got a code? Enter it on the subscriptions page.
        </p>
      </div>
    </div>
  );
}
