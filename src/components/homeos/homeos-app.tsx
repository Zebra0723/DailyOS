"use client";

import * as React from "react";
import { Home, Plus, Search, Sparkles, Loader2 } from "lucide-react";
import { HomeOSProvider, useHomeOS } from "@/lib/homeos/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HOME_TABS, type HomeTab } from "@/components/homeos/tabs";
import { HomeOSDashboard } from "@/components/homeos/dashboard";
import { SubscriptionOps } from "@/components/homeos/subscription-ops";
import { ArrivalOps } from "@/components/homeos/arrival-ops";
import { RoomOps } from "@/components/homeos/room-ops";
import { DeviceOps } from "@/components/homeos/device-ops";
import { HomeVault } from "@/components/homeos/home-vault";
import { HomeCalendar } from "@/components/homeos/home-calendar";
import { HomeAlerts } from "@/components/homeos/home-alerts";
import { HomeSettings } from "@/components/homeos/home-settings";
import { AddItemModal } from "@/components/homeos/add-item-modal";
import { HomeReview } from "@/components/homeos/home-review";
import { HomeSearch } from "@/components/homeos/home-search";

export function HomeOSApp() {
  return (
    <HomeOSProvider>
      <Shell />
    </HomeOSProvider>
  );
}

function Shell() {
  const { ready, data } = useHomeOS();
  const [tab, setTab] = React.useState<HomeTab>("dashboard");
  const [adding, setAdding] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(false);
  const [searching, setSearching] = React.useState(false);

  const openAlerts = data.alerts.filter((a) => a.status === "Open").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevated">
            <Home className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">HomeOS</h1>
            <p className="text-sm text-muted-foreground">Run your home without the chaos.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSearching(true)}>
            <Search className="size-4" /> Search
          </Button>
          <Button variant="outline" size="sm" onClick={() => setReviewing(true)}>
            <Sparkles className="size-4" /> Run Review
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex w-max gap-1 rounded-xl border bg-card/60 p-1">
          {HOME_TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <t.icon className="size-4" />
                {t.label}
                {t.key === "alerts" && openAlerts > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 text-[11px] font-semibold",
                      active ? "bg-primary-foreground/20" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
                    )}
                  >
                    {openAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active module */}
      {!ready ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="animate-fade-in">
          {tab === "dashboard" && <HomeOSDashboard onNavigate={setTab} />}
          {tab === "subscriptions" && <SubscriptionOps />}
          {tab === "arrivals" && <ArrivalOps />}
          {tab === "rooms" && <RoomOps />}
          {tab === "devices" && <DeviceOps />}
          {tab === "vault" && <HomeVault />}
          {tab === "calendar" && <HomeCalendar />}
          {tab === "alerts" && <HomeAlerts />}
          {tab === "settings" && <HomeSettings />}
        </div>
      )}

      <AddItemModal open={adding} onClose={() => setAdding(false)} />
      <HomeReview open={reviewing} onClose={() => setReviewing(false)} />
      <HomeSearch open={searching} onClose={() => setSearching(false)} onNavigate={setTab} />
    </div>
  );
}
