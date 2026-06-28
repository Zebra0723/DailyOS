"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { usePro } from "@/lib/use-pro";

/** A gentle, always-on reminder of Free-plan limits (hidden once on Pro). */
export function FreePlanBanner() {
  const { mounted, pro } = usePro();
  if (!mounted || pro) return null;

  return (
    <div className="border-b bg-muted/50">
      <div className="container flex max-w-5xl flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center text-xs text-muted-foreground">
        <span>
          You&apos;re on <span className="font-medium text-foreground">Free</span> —
          15 life-admin updates &amp; 30 events a month, Vault locked.
        </span>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <Sparkles className="size-3.5" /> Upgrade
        </Link>
      </div>
    </div>
  );
}
