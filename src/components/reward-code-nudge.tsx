"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, ArrowRight, Loader2 } from "lucide-react";
import { grantPlanReward } from "@/lib/use-pro";
import { redeemRewardCode } from "@/app/(app)/subscriptions/reward-code-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type Code = { code: string; label: string };

const ignoredKey = (userId?: string) => `dailyos-ignored-codes:${userId ?? "anon"}`;

function readIgnored(userId?: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(ignoredKey(userId)) || "[]");
  } catch {
    return [];
  }
}

/** A Today heads-up for unclaimed, non-expired reward codes. Each can be claimed
 *  in place or ignored (dismissed for good on this device). */
export function RewardCodeNudge({
  userId,
  codes,
}: {
  userId?: string;
  codes: Code[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [list, setList] = React.useState<Code[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);

  // Filter out anything the user has already ignored on this device.
  React.useEffect(() => {
    const ignored = new Set(readIgnored(userId));
    setList(codes.filter((c) => !ignored.has(c.code)));
  }, [codes, userId]);

  function drop(code: string) {
    setList((l) => l.filter((c) => c.code !== code));
  }

  function ignore(code: string) {
    try {
      const next = Array.from(new Set([...readIgnored(userId), code]));
      localStorage.setItem(ignoredKey(userId), JSON.stringify(next));
    } catch {
      /* ignore storage failures */
    }
    drop(code);
  }

  async function claim(c: Code) {
    if (busy) return;
    setBusy(c.code);
    try {
      const res = await redeemRewardCode(c.code);
      if (res.ok) {
        if (res.reward.kind === "plan") {
          const expiresAt =
            res.reward.days > 0 ? Date.now() + res.reward.days * 86_400_000 : null;
          void grantPlanReward(res.reward.tier, userId, expiresAt);
          toast({ variant: "success", title: `Unlocked: ${res.label} 🎉` });
        } else {
          toast({
            variant: "success",
            title: `${res.reward.percent}% off claimed — it'll apply to your next paid plan.`,
          });
        }
        drop(c.code);
        router.refresh();
      } else if (res.reason === "used") {
        toast({ variant: "info", title: "That code was already used." });
        drop(c.code);
      } else if (res.reason === "expired") {
        toast({ variant: "info", title: "That code has expired." });
        drop(c.code);
      } else {
        toast({ variant: "error", title: "Couldn't claim that code." });
      }
    } catch {
      toast({ variant: "error", title: "Couldn't claim that code." });
    } finally {
      setBusy(null);
    }
  }

  if (list.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-accent/30">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Gift className="size-5" />
          </div>
          <div>
            <p className="font-medium">
              You&apos;ve earned a reward{list.length > 1 ? "s" : ""}!
            </p>
            <p className="text-sm text-muted-foreground">
              Claim it here, or find it any time on the{" "}
              <Link href="/subscriptions" className="text-primary hover:underline">
                Subscriptions page
              </Link>{" "}
              (top nav → Account → Subscription).
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {list.map((c) => (
            <li
              key={c.code}
              className="flex flex-col gap-2 rounded-lg border bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => claim(c)} disabled={busy === c.code}>
                  {busy === c.code ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Claim <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => ignore(c.code)}
                  disabled={busy === c.code}
                >
                  Ignore
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
