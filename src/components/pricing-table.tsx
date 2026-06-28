"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles, Tag } from "lucide-react";
import { PLANS, annualPerMonth, annualSavingPct, type Plan } from "@/lib/plans";
import { usePro, setPro } from "@/lib/use-pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// Any of these unlock lifetime Pro. ARLEOPRO kept for existing users.
const PROMO_CODES = ["ARLEOPRO", "HOMEOSVIP25"];

export function PricingTable({ compact = false }: { compact?: boolean }) {
  const [annual, setAnnual] = React.useState(true);
  const { pro: unlocked } = usePro();
  const { toast } = useToast();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState(false);

  async function applyCode(e?: React.FormEvent) {
    e?.preventDefault();
    const entered = code.trim().toUpperCase();
    if (entered === "") {
      setError(false);
      return;
    }
    if (!PROMO_CODES.includes(entered)) {
      setError(true);
      return;
    }
    // Valid: unlock. Leave the box as-is — the success banner replaces it
    // when Pro flips on, so we never re-validate an emptied box.
    setError(false);
    await setPro(true);
    toast({ variant: "success", title: "Lifetime Pro unlocked 🎉" });
  }

  return (
    <div>
      {/* Promo code */}
      {unlocked ? (
        <div className="mx-auto mb-8 flex max-w-md items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Sparkles className="size-4" /> Lifetime Pro unlocked — enjoy, legend! 🎉
        </div>
      ) : (
        <div className="mx-auto mb-8 max-w-md">
          <form onSubmit={applyCode} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                placeholder="Promo code"
                className="pl-9 uppercase placeholder:normal-case"
              />
            </div>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-center text-sm text-destructive">
              That code isn&apos;t valid.
            </p>
          )}
        </div>
      )}

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
          <PlanCard
            key={plan.key}
            plan={plan}
            annual={annual}
            compact={compact}
            unlocked={unlocked && plan.key === "pro"}
          />
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
  unlocked,
}: {
  plan: Plan;
  annual: boolean;
  compact: boolean;
  unlocked: boolean;
}) {
  const free = plan.monthly === 0;
  const saving = annualSavingPct(plan);

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
          Your plan · Lifetime
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
          ? "Unlocked for life 🎉"
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
      ) : (
        <Button
          asChild
          variant={plan.highlight ? "default" : "outline"}
          className="mt-5 w-full"
        >
          <Link href="/signup">{plan.cta}</Link>
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
