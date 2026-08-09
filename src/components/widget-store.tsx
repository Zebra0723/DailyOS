"use client";

import * as React from "react";
import { X, Check, Lock, Search, Plus } from "lucide-react";
import {
  WIDGETS,
  WIDGET_CATEGORIES,
  type PlanTier,
  type WidgetCategory,
  type WidgetDef,
} from "@/lib/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDashboard, type AddResult } from "@/lib/widgets/dashboard-store";

function tierAllows(userTier: string, required: PlanTier): boolean {
  if (userTier === "pro") return true;
  if (required === "plus" && (userTier === "plus" || userTier === "pro"))
    return true;
  if (required === "free") return true;
  return false;
}

const TIER_LABEL: Record<PlanTier, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
};

const TIER_COLOR: Record<PlanTier, string> = {
  free: "bg-muted text-muted-foreground",
  plus: "bg-primary/10 text-primary",
  pro: "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-400",
};

const CAT_BORDER: Record<WidgetCategory, string> = {
  lifeos: "border-primary/25",
  homeos: "border-emerald-500/25",
  productivity: "border-blue-500/25",
  wellness: "border-pink-500/25",
  ai: "border-amber-500/25",
};

const CAT_BG: Record<WidgetCategory, string> = {
  lifeos: "bg-primary/[0.03]",
  homeos: "bg-emerald-500/[0.03]",
  productivity: "bg-blue-500/[0.03]",
  wellness: "bg-pink-500/[0.03]",
  ai: "bg-amber-500/[0.03]",
};

// ---------------------------------------------------------------------------
// Global open/close context — lets the nav trigger the store from anywhere
// ---------------------------------------------------------------------------

interface WidgetStoreContextValue {
  openWidgetStore: () => void;
}

const WidgetStoreContext = React.createContext<WidgetStoreContextValue | null>(
  null,
);

export function useWidgetStore(): WidgetStoreContextValue {
  const ctx = React.useContext(WidgetStoreContext);
  if (!ctx) return { openWidgetStore: () => {} };
  return ctx;
}

/**
 * Must be mounted inside <DashboardProvider>: the store reads and writes the
 * same live widget list the dashboard renders, so "Added" is always accurate
 * and adding works from any page — not just the one showing the dashboard.
 */
export function WidgetStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const openWidgetStore = React.useCallback(() => setOpen(true), []);

  const value = React.useMemo(() => ({ openWidgetStore }), [openWidgetStore]);

  return (
    <WidgetStoreContext.Provider value={value}>
      {children}
      {open && <WidgetStoreOverlay onClose={() => setOpen(false)} />}
    </WidgetStoreContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Full-screen overlay template picker
// ---------------------------------------------------------------------------

function WidgetStoreOverlay({ onClose }: { onClose: () => void }) {
  // Live dashboard state — not a snapshot — so "Added" reflects reality even
  // after adding, removing, or reopening the store.
  const {
    widgets: activeWidgets,
    tier: userTier,
    limit,
    atLimit,
    addWidget,
  } = useDashboard();

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [limitHit, setLimitHit] = React.useState<AddResult | null>(null);

  const handleAdd = React.useCallback(
    (id: string) => {
      const result = addWidget(id);
      setLimitHit(result.ok || result.reason !== "limit" ? null : result);
    },
    [addWidget],
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const allActive = activeWidgets;

  const filtered = WIDGETS.filter((w) => {
    if (category !== "all" && w.category !== category) return false;
    if (
      search &&
      !w.name.toLowerCase().includes(search.toLowerCase()) &&
      !w.description.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur-sm animate-fade-in">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <button
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight">
              Add to your dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              {Number.isFinite(limit) ? (
                <>
                  Pick what matters to you —{" "}
                  <span className={cn("font-medium", atLimit && "text-amber-600 dark:text-amber-400")}>
                    {activeWidgets.length} of {limit} used
                  </span>{" "}
                  on your plan.
                </>
              ) : (
                <>Pick what matters to you — unlimited widgets on Pro.</>
              )}
            </p>
          </div>
          <div className="relative hidden sm:block sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-b px-6 py-3 sm:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Category filter chips */}
      <div className="border-b">
        <div className="container mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-6 py-3">
          <FilterChip
            active={category === "all"}
            onClick={() => setCategory("all")}
          >
            All
          </FilterChip>
          {WIDGET_CATEGORIES.map((c) => (
            <FilterChip
              key={c.key}
              active={category === c.key}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Plan limit reached */}
      {limitHit && !limitHit.ok && limitHit.reason === "limit" && (
        <div className="border-b bg-amber-500/5">
          <div className="container mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
            <Lock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">
              You&apos;ve used all {limitHit.limit} widgets on your plan. Remove one
              to swap it out
              {limitHit.upgradeTo ? `, or upgrade for more.` : "."}
            </p>
            {limitHit.upgradeTo && (
              <Button size="sm" variant="outline" asChild>
                <a href="/subscriptions">
                  Upgrade to {limitHit.upgradeTo === "pro" ? "Pro" : "Plus"}
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-5xl px-6 py-6">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No widgets match your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((w) => {
                const active = allActive.includes(w.id);
                const allowed = tierAllows(userTier, w.tier);
                return (
                  <PreviewCard
                    key={w.id}
                    widget={w}
                    active={active}
                    allowed={allowed}
                    atLimit={atLimit && !active}
                    onAdd={() => handleAdd(w.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview card — title, category, description, inline preview mockup
// ---------------------------------------------------------------------------

function PreviewCard({
  widget,
  active,
  allowed,
  atLimit,
  onAdd,
}: {
  widget: WidgetDef;
  active?: boolean;
  allowed?: boolean;
  /** Plan's widget count is used up, so this one can't be added right now. */
  atLimit?: boolean;
  onAdd?: () => void;
}) {
  const Icon = widget.icon;
  const catLabel =
    WIDGET_CATEGORIES.find((c) => c.key === widget.category)?.label ??
    widget.category;

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg",
        CAT_BORDER[widget.category],
        CAT_BG[widget.category],
      )}
    >
      {/* Info header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold tracking-tight">{widget.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {widget.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {widget.tier !== "free" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  TIER_COLOR[widget.tier],
                )}
              >
                {TIER_LABEL[widget.tier]}
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {catLabel}
        </p>
      </div>

      {/* Preview mockup */}
      <div className="mx-4 mb-4 overflow-hidden rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </div>
          <span className="text-xs font-semibold">{widget.name}</span>
        </div>
        <WidgetMockup id={widget.id} />
      </div>

      {/* Action button */}
      {onAdd && (
        <div className="px-4 pb-4">
          {active ? (
            <Button variant="outline" size="sm" className="w-full" disabled>
              <Check className="size-3.5" /> Added
            </Button>
          ) : allowed === false ? (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/subscriptions">
                <Lock className="size-3.5" /> Upgrade to {widget.tier === "pro" ? "Pro" : "Plus"}
              </a>
            </Button>
          ) : atLimit ? (
            <Button variant="outline" size="sm" className="w-full" disabled>
              <Lock className="size-3.5" /> Plan limit reached
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={onAdd}>
              <Plus className="size-3.5" /> Add to dashboard
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget mockup — simple inline previews (not live data, just visual hints)
// ---------------------------------------------------------------------------

function WidgetMockup({ id }: { id: string }) {
  switch (id) {
    case "stats-overview":
      return (
        <div className="grid grid-cols-4 gap-2">
          {["Due", "Events", "Review", "Drop"].map((l) => (
            <div key={l} className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-lg font-bold text-foreground/70">3</p>
              <p className="text-[9px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      );

    case "tasks-due":
      return (
        <div className="space-y-1.5">
          {["Book dentist appointment", "Reply to school email", "Pick up parcel"].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <div className="size-3.5 rounded border border-muted-foreground/30" />
              <span className="text-[11px] text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      );

    case "upcoming-events":
      return (
        <div className="space-y-1.5">
          {[
            { t: "Team standup", s: "09:00" },
            { t: "Dentist", s: "14:30" },
            { t: "Pick up kids", s: "15:45" },
          ].map((e) => (
            <div key={e.t} className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-primary w-8">{e.s}</span>
              <span className="text-[11px] text-muted-foreground">{e.t}</span>
            </div>
          ))}
        </div>
      );

    case "quick-add":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/20 px-3 py-2">
            <Plus className="size-3 text-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground/50">Add a quick task...</span>
          </div>
          <div className="flex gap-1.5">
            <span className="rounded-md bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">Drop item</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[9px] text-muted-foreground">Plan day</span>
          </div>
        </div>
      );

    case "recent-inbox":
      return (
        <div className="space-y-1.5">
          {["Energy bill — March", "School trip letter", "Amazon delivery"].map((t) => (
            <div key={t} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted-foreground truncate">{t}</span>
              <div className="h-px flex-1 bg-muted-foreground/10" />
              <span className="text-[9px] text-muted-foreground/50 shrink-0">2h</span>
            </div>
          ))}
        </div>
      );

    case "quick-notes":
      return (
        <div className="rounded-lg border border-dashed border-muted-foreground/15 p-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground/60">
            Remember to check the boiler<br />service contract before Thursday...
          </p>
        </div>
      );

    case "habit-tracker":
      return (
        <div className="space-y-1.5">
          {[
            { n: "Read 20 mins", s: 5 },
            { n: "Workout", s: 3 },
            { n: "No phone before 9", s: 12 },
          ].map((h) => (
            <div key={h.n} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{h.n}</span>
              <span className="text-[10px] text-primary">{h.s} days</span>
            </div>
          ))}
        </div>
      );

    case "pomodoro":
      return (
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative size-14">
            <svg viewBox="0 0 36 36" className="size-14 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/50" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="75,100" className="text-primary" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">18:42</span>
          </div>
          <span className="text-[9px] text-muted-foreground">Focus session</span>
        </div>
      );

    case "water-intake":
      return (
        <div className="flex items-center gap-3">
          <div className="relative size-12">
            <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/50" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="62,100" className="text-blue-500" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">5/8</span>
          </div>
          <div>
            <p className="text-[11px] font-medium">5 glasses</p>
            <p className="text-[9px] text-muted-foreground">3 to go</p>
          </div>
        </div>
      );

    case "daily-quote":
      return (
        <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 p-3">
          <p className="text-[11px] italic leading-relaxed text-muted-foreground">
            &ldquo;The secret of getting ahead is getting started.&rdquo;
          </p>
          <p className="mt-1 text-[9px] text-muted-foreground/60">— Mark Twain</p>
        </div>
      );

    case "needs-review":
      return (
        <div className="space-y-1.5">
          {["Council tax letter", "Insurance renewal"].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-amber-500" />
              <span className="text-[11px] text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      );

    case "bookmarks":
      return (
        <div className="space-y-1.5">
          {["Passport scan", "Car MOT cert"].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <div className="size-3 rounded bg-primary/10 text-primary flex items-center justify-center">
                <span className="text-[8px]">★</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      );

    case "tomorrow-preview":
      return (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground/70">Tomorrow</p>
          {["Plumber visit 10am", "Submit tax return"].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary/50" />
              <span className="text-[11px] text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>
      );

    case "goals":
      return (
        <div className="space-y-2">
          {[
            { n: "Save £5k", p: 60 },
            { n: "Run 100 miles", p: 35 },
          ].map((g) => (
            <div key={g.n}>
              <div className="flex justify-between">
                <span className="text-[11px] text-muted-foreground">{g.n}</span>
                <span className="text-[10px] text-primary">{g.p}%</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${g.p}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      );

    case "mood-tracker":
      return (
        <div className="flex items-center justify-between">
          {["😫", "😕", "😐", "🙂", "😊"].map((m, i) => (
            <button key={m} className={cn("rounded-full p-1.5 text-sm", i === 3 && "bg-primary/10 ring-1 ring-primary/30")}>
              {m}
            </button>
          ))}
        </div>
      );

    case "countdown":
      return (
        <div className="space-y-1.5">
          {[
            { n: "Holiday", d: "14 days" },
            { n: "Birthday", d: "42 days" },
          ].map((c) => (
            <div key={c.n} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{c.n}</span>
              <span className="text-[10px] font-medium text-primary">{c.d}</span>
            </div>
          ))}
        </div>
      );

    case "homeos-summary":
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {["Deliveries", "Alerts", "Devices"].map((l) => (
            <div key={l} className="rounded-lg bg-muted/50 p-1.5 text-center">
              <p className="text-xs font-bold text-foreground/70">2</p>
              <p className="text-[8px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      );

    case "home-control-score":
      return (
        <div className="flex items-center gap-3">
          <div className="relative size-12">
            <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/50" />
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="78,100" className="text-emerald-500" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">78</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Pretty on top of things</p>
        </div>
      );

    case "home-subscriptions":
      return (
        <div className="space-y-1.5">
          {[
            { n: "Netflix", p: "£10.99" },
            { n: "Spotify", p: "£9.99" },
          ].map((s) => (
            <div key={s.n} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{s.n}</span>
              <span className="text-[10px] font-medium">{s.p}/mo</span>
            </div>
          ))}
        </div>
      );

    case "home-deliveries":
      return (
        <div className="space-y-1.5">
          {["Amazon — arriving today", "IKEA — Wed"].map((d) => (
            <div key={d} className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      );

    case "home-devices":
      return (
        <div className="space-y-1.5">
          {["Boiler — service due", "Washing machine — OK"].map((d) => (
            <div key={d} className="flex items-center gap-2">
              <div className={cn("size-2 rounded-full", d.includes("due") ? "bg-amber-500" : "bg-emerald-500")} />
              <span className="text-[11px] text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      );

    case "home-rooms":
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {["Kitchen", "Living room", "Bedroom", "Bathroom"].map((r) => (
            <div key={r} className="rounded bg-muted/50 px-2 py-1">
              <span className="text-[10px] text-muted-foreground">{r}</span>
            </div>
          ))}
        </div>
      );

    case "home-alerts":
      return (
        <div className="space-y-1.5">
          {["Boiler service overdue", "Insurance expires Fri"].map((a) => (
            <div key={a} className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-500" />
              <span className="text-[11px] text-muted-foreground">{a}</span>
            </div>
          ))}
        </div>
      );

    case "home-calendar":
      return (
        <div className="space-y-1.5">
          {[
            { t: "Bin day", s: "Mon" },
            { t: "Cleaner", s: "Wed" },
          ].map((e) => (
            <div key={e.t} className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-emerald-600 w-6">{e.s}</span>
              <span className="text-[11px] text-muted-foreground">{e.t}</span>
            </div>
          ))}
        </div>
      );

    case "home-vault":
      return (
        <div className="space-y-1.5">
          {["Home insurance policy", "Boiler warranty"].map((d) => (
            <div key={d} className="flex items-center gap-2">
              <div className="size-3 rounded bg-muted text-[7px] flex items-center justify-center text-muted-foreground">📄</div>
              <span className="text-[11px] text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      );

    case "ai-builder":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-500/20 px-3 py-2">
            <span className="text-[11px] text-muted-foreground/50">Describe a feature...</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {["Meal planner", "Reading list", "Budget"].map((s) => (
              <span key={s} className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-700 dark:text-amber-400">{s}</span>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="h-10 rounded-lg bg-muted/30" />
      );
  }
}


function FilterChip({
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
        "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80",
      )}
    >
      {children}
    </button>
  );
}
