"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, annualPerMonth, annualSavingPct, type Plan } from "@/lib/plans";
import { usePlan, type Tier } from "@/lib/use-pro";
import { startCheckout } from "@/lib/billing-client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// Codes are no longer redeemed here — every discount is a Stripe promotion
// code, entered on the Stripe checkout page. Admins generate them in
// Admin → Codes, and referral rewards are emailed as Stripe codes too.

export function PricingTable({
  compact = false,
  userId,
}: {
  compact?: boolean;
  userId?: string;
}) {
  const [annual, setAnnual] = React.useState(true);
  const { mounted, resolved, tier, planExp } = usePlan(userId);
  // Only treat someone as unlocked once their plan is CONFIRMED (resolved) —
  // never optimistically, so a free user is never shown "you're on Pro". Until
  // confirmed we present as Free.
  const confirmed = mounted && resolved;
  const currentTier: Tier = confirmed ? tier : "free";
  const currentExp = confirmed ? planExp : null;

  return (
    <div>
      {/* Billing-cycle toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <Cycle active={!annual} onClick={() => setAnnual(false)}>
          Monthly
        </Cycle>
        <Cycle active={annual} onClick={() => setAnnual(true)}>
          Annual
          <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            Save 5%
          </span>
        </Cycle>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            annual={annual}
            compact={compact}
            unlocked={currentTier === plan.key}
            expiresAt={currentTier === plan.key ? currentExp : null}
            userId={userId}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices in GBP and include VAT. Free to start — no card needed. Got a
        code? Enter it at checkout.
      </p>
    </div>
  );
}

function Cycle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-card"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PlanCard({
  plan,
  annual,
  compact,
  unlocked,
  expiresAt,
  userId,
}: {
  plan: Plan;
  annual: boolean;
  compact: boolean;
  unlocked: boolean;
  expiresAt?: number | null;
  userId?: string;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const free = plan.monthly === 0;

  async function upgrade() {
    if (plan.key !== "plus" && plan.key !== "pro") return;
    setBusy(true);
    const url = await startCheckout(plan.key, annual ? "yearly" : "monthly");
    if (url) {
      window.location.href = url;
      return; // keep the button busy while we redirect
    }
    setBusy(false);
    toast({
      variant: "error",
      title: "Couldn't start checkout — card payments aren't switched on yet.",
    });
  }
  const saving = annualSavingPct(plan);
  const timeLimited = unlocked && !!expiresAt;
  const untilLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card",
        plan.highlight && "border-2 border-primary shadow-elevated",
        unlocked && "border-2 border-emerald-400",
      )}
    >
      {unlocked ? (
        <div className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
          {timeLimited ? "Your plan" : "Your plan · Lifetime"}
        </div>
      ) : (
        plan.highlight && (
          <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Most popular
          </div>
        )
      )}

      <h3 className="text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

      <div className="mt-5 flex items-end gap-1.5">
        {unlocked ? (
          <span className="text-4xl font-bold">Free</span>
        ) : free ? (
          <span className="text-4xl font-bold">£0</span>
        ) : (
          <>
            <span className="text-4xl font-bold">
              £{annual ? annualPerMonth(plan) : plan.monthly}
            </span>
            <span className="pb-1 text-muted-foreground">/mo</span>
          </>
        )}
      </div>
      <p className="mt-1 h-5 text-xs text-muted-foreground">
        {unlocked
          ? timeLimited
            ? `Active until ${untilLabel}`
            : "Unlocked for life"
          : free
            ? "Free forever"
            : annual
              ? `Billed £${plan.annual}/year · save ${saving}%`
              : "Billed monthly"}
      </p>

      {unlocked ? (
        <Button disabled className="mt-5 w-full">
          <Check className="size-4" /> Active
        </Button>
      ) : free || !userId ? (
        // Free plan, or a logged-out visitor → sign up first.
        <Button
          asChild
          variant={plan.highlight ? "default" : "outline"}
          className="mt-5 w-full"
        >
          <Link href="/signup">{plan.cta}</Link>
        </Button>
      ) : (
        // Logged-in user on a paid plan → straight to Stripe checkout.
        <Button
          onClick={upgrade}
          loading={busy}
          variant={plan.highlight ? "default" : "outline"}
          className="mt-5 w-full"
        >
          {plan.cta}
        </Button>
      )}

      <ul className={cn("mt-6 space-y-2.5 text-sm", compact && "mt-5")}>
        {(compact ? plan.features.slice(0, 4) : plan.features).map((f) => {
          const isHeader = f.endsWith(":");
          const isNegative = f.toLowerCase().startsWith("no ");
          return (
            <li
              key={f}
              className={cn(
                "flex items-start gap-2",
                isHeader && "font-medium text-foreground",
              )}
            >
              {isHeader ? (
                <span className="h-4 w-4" />
              ) : (
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    isNegative ? "text-muted-foreground/40" : "text-primary",
                  )}
                />
              )}
              <span className={cn(isNegative && "text-muted-foreground")}>{f}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
