"use client";

import { CreditCard } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import {
  getMonthlySubscriptionTotal,
  getPotentialSavings,
  getRenewalsWithinDays,
} from "@/lib/homeos/calculations";
import { relativeLabel } from "@/lib/homeos/dates";
import { HomeWidgetShell, MiniStat, HomeRow, gbp } from "@/components/widgets/homeos-shell";

export function HomeSubscriptionsWidget() {
  const { data, ready } = useHomeOSData();
  const subs = data?.subscriptions ?? [];

  if (!data || subs.length === 0) {
    return (
      <HomeWidgetShell
        title="Subscriptions"
        icon={CreditCard}
        href="/homeos/subscriptions"
        linkLabel="Manage"
        loading={!ready}
        empty="No subscriptions tracked yet."
      />
    );
  }

  const monthly = getMonthlySubscriptionTotal(subs);
  const savings = getPotentialSavings(subs);
  const warnDays = data.settings.renewalWarningDays;
  const renewals = getRenewalsWithinDays(subs, warnDays).slice(0, 4);

  return (
    <HomeWidgetShell
      title="Subscriptions"
      icon={CreditCard}
      href="/homeos/subscriptions"
      linkLabel="Manage"
    >
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="per month" value={gbp(monthly)} tone="primary" />
        <MiniStat label="per year" value={gbp(monthly * 12)} />
        <MiniStat
          label="could save"
          value={gbp(savings)}
          tone={savings > 0 ? "green" : "default"}
        />
      </div>
      {renewals.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Renewing in the next {warnDays} days
          </p>
          {renewals.map((s) => (
            <HomeRow
              key={s.id}
              href="/homeos/subscriptions"
              title={s.name}
              meta={`${gbp(s.monthlyCost || s.annualCost)} · ${s.billingCycle}`}
              trailing={
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeLabel(s.renewalDate)}
                </span>
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nothing renewing in the next {warnDays} days.
        </p>
      )}
    </HomeWidgetShell>
  );
}
