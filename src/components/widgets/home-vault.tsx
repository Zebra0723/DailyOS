"use client";

import { FolderLock } from "lucide-react";
import { useHomeOSData } from "@/lib/homeos/use-homeos-data";
import { isOverdue, isWithinDays, relativeLabel } from "@/lib/homeos/dates";
import { HomeWidgetShell, MiniStat, HomeRow } from "@/components/widgets/homeos-shell";

export function HomeVaultWidget() {
  const { data, ready } = useHomeOSData();
  const docs = data?.documents ?? [];

  if (!data || docs.length === 0) {
    return (
      <HomeWidgetShell
        title="Home Vault"
        icon={FolderLock}
        href="/homeos/vault"
        linkLabel="Open vault"
        loading={!ready}
        empty="No home documents stored yet."
      />
    );
  }

  const expired = docs.filter((d) => isOverdue(d.expiryDate));
  const expiring = docs.filter((d) => isWithinDays(d.expiryDate, 60));
  // Soonest first: anything already lapsed, then whatever runs out next.
  const attention = [...expired, ...expiring].slice(0, 4);

  return (
    <HomeWidgetShell
      title="Home Vault"
      icon={FolderLock}
      href="/homeos/vault"
      linkLabel="Open vault"
    >
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="documents" value={docs.length} />
        <MiniStat
          label="expiring soon"
          value={expiring.length}
          tone={expiring.length > 0 ? "amber" : "default"}
        />
        <MiniStat
          label="expired"
          value={expired.length}
          tone={expired.length > 0 ? "red" : "default"}
        />
      </div>
      {attention.length > 0 ? (
        <div className="space-y-2">
          {attention.map((d) => (
            <HomeRow
              key={d.id}
              href="/homeos/vault"
              title={d.title}
              meta={[d.type, d.provider].filter(Boolean).join(" · ")}
              trailing={
                <span
                  className={
                    isOverdue(d.expiryDate)
                      ? "shrink-0 text-xs text-red-600 dark:text-red-400"
                      : "shrink-0 text-xs text-amber-600 dark:text-amber-400"
                  }
                >
                  {relativeLabel(d.expiryDate)}
                </span>
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nothing expiring in the next 60 days.
        </p>
      )}
    </HomeWidgetShell>
  );
}
