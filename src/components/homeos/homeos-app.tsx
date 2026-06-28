"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Plus, Search, Sparkles, Loader2 } from "lucide-react";
import { HomeOSProvider, useHomeOS } from "@/lib/homeos/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProGate } from "@/components/pro-gate";
import { HOME_SECTIONS, homeHref } from "@/components/homeos/tabs";
import { AddItemModal } from "@/components/homeos/add-item-modal";
import { HomeReview } from "@/components/homeos/home-review";
import { HomeSearch } from "@/components/homeos/home-search";

/** Layout shell for every /homeos route: provider, Pro gate, header, modals. */
export function HomeOSShell({ children }: { children: React.ReactNode }) {
  return (
    <HomeOSProvider>
      <ProGate
        tier="Pro"
        feature="HomeOS"
        blurb="Run your whole home — subscriptions, deliveries, rooms, devices and documents — in one operational command centre."
      >
        <Shell>{children}</Shell>
      </ProGate>
    </HomeOSProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { ready, data } = useHomeOS();
  const router = useRouter();
  const pathname = usePathname();
  const [adding, setAdding] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(false);
  const [searching, setSearching] = React.useState(false);

  const openAlerts = data.alerts.filter((a) => a.status === "Open").length;

  function isActive(seg: string) {
    return seg ? pathname === homeHref(seg) : pathname === "/homeos";
  }

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSearching(true)}>
            <Search className="size-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setReviewing(true)}>
            <Sparkles className="size-4" />
            <span className="hidden sm:inline">Run Review</span>
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {/* Mobile sub-navigation (desktop uses the sidebar) */}
      <div className="-mx-1 overflow-x-auto pb-1 lg:hidden">
        <div className="flex w-max gap-1 rounded-xl border bg-card/60 p-1">
          {HOME_SECTIONS.map((s) => {
            const active = isActive(s.seg);
            return (
              <Link
                key={s.seg || "dashboard"}
                href={homeHref(s.seg)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <s.icon className="size-4" />
                {s.label}
                {s.seg === "alerts" && openAlerts > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 text-[11px] font-semibold",
                      active
                        ? "bg-primary-foreground/20"
                        : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
                    )}
                  >
                    {openAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active section */}
      {!ready ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="animate-fade-in">{children}</div>
      )}

      <AddItemModal open={adding} onClose={() => setAdding(false)} />
      <HomeReview open={reviewing} onClose={() => setReviewing(false)} />
      <HomeSearch
        open={searching}
        onClose={() => setSearching(false)}
        onNavigate={(seg) => router.push(homeHref(seg))}
      />
    </div>
  );
}
