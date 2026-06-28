"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, annualPerMonth, annualSavingPct, type Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PricingTable({ compact = false }: { compact?: boolean }) {
  const [annual, setAnnual] = React.useState(true);

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
            2 months free
          </span>
        </Cycle>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.key} plan={plan} annual={annual} compact={compact} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices in GBP. Payments aren&apos;t live yet — no card needed to start.
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
}: {
  plan: Plan;
  annual: boolean;
  compact: boolean;
}) {
  const free = plan.monthly === 0;
  const saving = annualSavingPct(plan);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 shadow-card",
        plan.highlight && "border-2 border-primary shadow-elevated",
      )}
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Most popular
        </div>
      )}

      <h3 className="text-lg font-bold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

      <div className="mt-5 flex items-end gap-1.5">
        {free ? (
          <span className="text-4xl font-bold">£0</span>
        ) : annual ? (
          <>
            <span className="text-4xl font-bold">£{annualPerMonth(plan)}</span>
            <span className="pb-1 text-muted-foreground">/mo</span>
          </>
        ) : (
          <>
            <span className="text-4xl font-bold">£{plan.monthly}</span>
            <span className="pb-1 text-muted-foreground">/mo</span>
          </>
        )}
      </div>
      <p className="mt-1 h-5 text-xs text-muted-foreground">
        {free
          ? "Free forever"
          : annual
            ? `Billed £${plan.annual}/year · save ${saving}%`
            : `Billed monthly`}
      </p>

      <Button
        asChild
        variant={plan.highlight ? "default" : "outline"}
        className="mt-5 w-full"
      >
        <Link href="/signup">{plan.cta}</Link>
      </Button>

      {!compact && (
        <ul className="mt-6 space-y-2.5 text-sm">
          {plan.features.map((f) => {
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
                <span className={cn(isNegative && "text-muted-foreground")}>
                  {f}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
