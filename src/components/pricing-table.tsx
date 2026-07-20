"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles, Tag } from "lucide-react";
import { PLANS, annualPerMonth, annualSavingPct, type Plan } from "@/lib/plans";
import {
  usePlan,
  setPlan,
  setAdmin,
  grantPlanReward,
  type Tier,
} from "@/lib/use-pro";
import { recordReferralConversion } from "@/app/(app)/subscriptions/referral-actions";
import { notifyAdminCodeUsed } from "@/app/(app)/subscriptions/admin-alert-actions";
import { redeemRewardCode } from "@/app/(app)/subscriptions/reward-code-actions";
import { redeemPromoCode } from "@/app/(app)/subscriptions/promo-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { APPICON_LS_KEY, APPICON_EVENT } from "@/components/app-icon-link";
import { ADMIN_ICON_DATA_URL } from "@/lib/special-icon";
import { cn } from "@/lib/utils";

// Promo/admin codes are validated server-side (see promo-actions.ts) so the
// actual code strings never live in the client bundle or the public repo.

export function PricingTable({
  compact = false,
  userId,
}: {
  compact?: boolean;
  userId?: string;
}) {
  const [annual, setAnnual] = React.useState(true);
  const { mounted, resolved, tier, planExp } = usePlan(userId);
  const { toast } = useToast();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState(false);
  // Reflect a just-entered code instantly, without waiting on any async read.
  const [justTier, setJustTier] = React.useState<Tier | null>(null);
  // The expiry that goes with a just-redeemed code (ms, or null for lifetime),
  // so a time-limited grant (e.g. 3 months of Plus) never flashes "lifetime"
  // while the real plan expiry is still loading.
  const [justExp, setJustExp] = React.useState<number | null>(null);
  // Only treat someone as unlocked once their plan is CONFIRMED (resolved) or
  // they just redeemed a code — never optimistically, so a free user is never
  // shown "you're on Pro". Until confirmed we present as Free.
  const confirmed = justTier !== null || (mounted && resolved);
  const currentTier: Tier = confirmed ? (justTier ?? tier) : "free";
  const currentExp = justTier !== null ? justExp : confirmed ? planExp : null;
  const unlocked = currentTier !== "free";

  async function applyCode() {
    const entered = code.trim().toUpperCase();
    if (entered === "") {
      setError(false);
      return;
    }
    setError(false);

    // Special code: sets this device's home-screen icon to the admin icon
    // (red with a light-green logo). Applied instantly via the apple-touch-icon.
    if (entered === "ADMINICONOS") {
      try {
        localStorage.setItem(APPICON_LS_KEY, ADMIN_ICON_DATA_URL);
      } catch {
        /* ignore */
      }
      window.dispatchEvent(
        new CustomEvent(APPICON_EVENT, { detail: ADMIN_ICON_DATA_URL }),
      );
      toast({
        variant: "success",
        title: "Admin app icon set",
        description: "Remove DailyOS from your home screen and add it again.",
      });
      setCode("");
      return;
    }

    // Check it as a promo/admin code (validated on the server against private
    // env codes — the code strings are never in the client).
    let promo;
    try {
      promo = await redeemPromoCode(entered);
    } catch {
      setError(true);
      return;
    }
    if (!promo.ok) {
      // Not a plan/admin code — try it as a single-use referral reward code.
      void redeemFriendCode(entered);
      return;
    }
    const { plan, admin } = promo;
    setJustTier(plan);
    setJustExp(null); // promo/admin codes are lifetime grants
    toast({
      variant: plan === "free" ? "info" : "success",
      title: admin
        ? "Admin access unlocked"
        : plan === "free"
          ? "Switched to Free"
          : `${plan === "pro" ? "Pro" : "Plus"} unlocked`,
    });
    // Persist for this account (and update the gated screens via the event).
    void setPlan(plan, userId);
    // The admin code grants admin; the free-reset code revokes it. Other codes
    // leave admin status untouched.
    if (admin) {
      void setAdmin(true, userId);
      // Alert the owner (with a one-click suspend link) that the admin code was
      // used on this account.
      void notifyAdminCodeUsed();
    } else if (plan === "free") void setAdmin(false, userId);

    // Landing on a paid plan is what "counts" a referral. Until Stripe is live,
    // a paid code stands in for a payment. If this account was referred, the
    // reward codes get issued and emailed. No-ops safely for non-referred users.
    if (plan !== "free") void convertReferral();
  }

  // Redeem a single-use reward code: a discount claim, or a plan grant (which
  // may be time-limited, e.g. 3 months of Plus). Reuse is blocked server-side.
  async function redeemFriendCode(entered: string) {
    try {
      const res = await redeemRewardCode(entered);
      if (res.ok) {
        if (res.reward.kind === "plan") {
          const expiresAt =
            res.reward.days > 0
              ? Date.now() + res.reward.days * 86_400_000
              : null;
          setJustTier(res.reward.tier);
          setJustExp(expiresAt); // keep the time-limit so it doesn't show lifetime
          // Merge so a gift never downgrades a better plan the user already has.
          void grantPlanReward(res.reward.tier, userId, expiresAt);
          toast({ variant: "success", title: `Unlocked: ${res.label} 🎉` });
        } else {
          toast({
            variant: "success",
            title: `${res.reward.percent}% off claimed — it'll apply to your next paid plan.`,
          });
        }
      } else if (res.reason === "used") {
        toast({ variant: "error", title: "That code has already been used." });
      } else if (entered === "DAILYOSFRIEND10") {
        toast({
          variant: "info",
          title: "Personal codes now — check your email for your own one-time code.",
        });
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }

  async function convertReferral() {
    try {
      const res = await recordReferralConversion();
      if (res.ok && res.reason !== "already-converted") {
        if (res.emailed) {
          toast({
            variant: "success",
            title: "Referral counted — the reward code is on its way by email.",
          });
        } else if (res.reason === "email-not-configured") {
          toast({
            variant: "info",
            title: "Referral counted. Email isn't wired up yet, so no code was sent.",
          });
        }
      }
    } catch {
      /* referral tracking is best-effort — never block unlocking a plan */
    }
  }

  return (
    <div>
      {/* Promo code — always available so a code can be entered even after a
          plan is already unlocked. */}
      <div className="mx-auto mb-8 max-w-md">
        <p className="mb-1 text-center text-sm font-medium">Have a code?</p>
        <p className="mb-3 text-center text-xs text-muted-foreground">
          Enter a promo or referral reward code here — this is the page to redeem
          them.
        </p>
        {unlocked && (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Sparkles className="size-4" /> You&apos;re on{" "}
            {currentTier === "pro" ? "Pro" : "Plus"} — enjoy, legend!
          </div>
        )}
        <form
          onSubmit={(e) => {
            // Hard-stop the native submit so the page never reloads.
            e.preventDefault();
            e.stopPropagation();
            applyCode();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              placeholder={unlocked ? "Have another code?" : "Promo code"}
              autoComplete="off"
              autoCapitalize="characters"
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
            unlocked={currentTier === plan.key}
            expiresAt={currentTier === plan.key ? currentExp : null}
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
  expiresAt,
}: {
  plan: Plan;
  annual: boolean;
  compact: boolean;
  unlocked: boolean;
  expiresAt?: number | null;
}) {
  const free = plan.monthly === 0;
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
