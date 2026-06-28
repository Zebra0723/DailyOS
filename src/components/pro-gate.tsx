"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { usePro } from "@/lib/use-pro";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Gates a Plus/Pro-only feature. Free users see a locked screen with an
 * upgrade prompt; unlocked users see the real content.
 */
export function ProGate({
  feature,
  blurb,
  children,
}: {
  feature: string;
  blurb: string;
  children: React.ReactNode;
}) {
  const { mounted, pro } = usePro();

  if (!mounted) {
    return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;
  }
  if (pro) return <>{children}</>;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Lock className="size-7" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{feature} is a Plus feature</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {blurb}
          </p>
        </div>
        <Button asChild>
          <Link href="/settings">
            <Sparkles className="size-4" /> Upgrade to unlock
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          On Plus &amp; Pro · from £4/month
        </p>
      </CardContent>
    </Card>
  );
}
