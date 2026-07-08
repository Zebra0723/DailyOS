"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, Minus, Plus, RotateCcw, Loader2 } from "lucide-react";
import { MILESTONES } from "@/lib/referral-rewards";
import { adminSetReferralTestDelta } from "@/app/(app)/subscriptions/referral-actions";
import { usePlan } from "@/lib/use-pro";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Admin-only: add or subtract *simulated* converted referrals so you can preview
 * the prize ladder without actually referring anyone. The number is a delta
 * stored on your account and folded into the referral counts; the server action
 * re-checks admin, so this can't be abused from a normal account.
 *
 * Visibility is gated on the client admin flag (same as the rest of the app's
 * owner tools), so any admin reliably sees it — it self-hides for everyone else.
 */
export function ReferralTestControls({
  userId,
  converted,
  testDelta,
}: {
  userId?: string;
  converted: number;
  testDelta: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { mounted, admin } = usePlan(userId);
  const [busy, setBusy] = React.useState(false);

  async function setDelta(next: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await adminSetReferralTestDelta(next);
      if (res.ok) router.refresh();
      else toast({ variant: "error", title: "Admin only" });
    } catch {
      toast({ variant: "error", title: "Couldn't update" });
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !admin) return null;

  return (
    <div className="mt-6 rounded-xl border border-dashed border-primary/40 bg-accent/20 p-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="size-4 text-primary" />
        <h3 className="text-sm font-medium">Referral testing (admin)</h3>
        {busy && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Simulate converted referrals to preview the prize ladder — no real
        referrals needed. Showing{" "}
        <strong className="text-foreground">{converted}</strong>
        {testDelta !== 0 && (
          <>
            {" "}
            ({testDelta > 0 ? "+" : ""}
            {testDelta} simulated)
          </>
        )}
        .
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDelta(testDelta - 1)}
          disabled={busy || converted <= 0}
        >
          <Minus className="size-4" /> Remove one
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDelta(testDelta + 1)}
          disabled={busy}
        >
          <Plus className="size-4" /> Add one
        </Button>
        <span className="ml-1 text-xs text-muted-foreground">Jump to:</span>
        {MILESTONES.map((m) => (
          <Button
            key={m.count}
            size="sm"
            variant="ghost"
            onClick={() => setDelta(testDelta + (m.count - converted))}
            disabled={busy}
            title={m.label}
          >
            {m.count}
          </Button>
        ))}
        {testDelta !== 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDelta(0)}
            disabled={busy}
          >
            <RotateCcw className="size-4" /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}
