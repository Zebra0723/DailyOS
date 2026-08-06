"use client";

import * as React from "react";
import { X, Check, Lock, Search } from "lucide-react";
import { WIDGETS, WIDGET_CATEGORIES, type PlanTier, type WidgetDef } from "@/lib/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function tierAllows(userTier: string, required: PlanTier): boolean {
  if (userTier === "pro") return true;
  if (required === "plus" && (userTier === "plus" || userTier === "pro")) return true;
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

export function WidgetStore({
  open,
  onClose,
  activeWidgets,
  userTier,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  activeWidgets: string[];
  userTier: string;
  onAdd: (id: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");

  if (!open) return null;

  const filtered = WIDGETS.filter((w) => {
    if (category !== "all" && w.category !== category) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative mx-4 mb-4 w-full max-w-lg animate-fade-in rounded-2xl border bg-card shadow-elevated sm:mb-0 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold tracking-tight">Widget Store</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b px-5 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search widgets..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <FilterChip active={category === "all"} onClick={() => setCategory("all")}>
              All
            </FilterChip>
            {WIDGET_CATEGORIES.map((c) => (
              <FilterChip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
                {c.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No widgets match your search.
            </p>
          )}
          {filtered.map((w) => {
            const active = activeWidgets.includes(w.id);
            const allowed = tierAllows(userTier, w.tier);
            return (
              <WidgetCard
                key={w.id}
                widget={w}
                active={active}
                allowed={allowed}
                onAdd={() => {
                  onAdd(w.id);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WidgetCard({
  widget,
  active,
  allowed,
  onAdd,
}: {
  widget: WidgetDef;
  active: boolean;
  allowed: boolean;
  onAdd: () => void;
}) {
  const Icon = widget.icon;
  return (
    <div className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/30">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{widget.name}</p>
          {widget.tier !== "free" && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", TIER_COLOR[widget.tier])}>
              {TIER_LABEL[widget.tier]}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{widget.description}</p>
      </div>
      {active ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Check className="size-4" />
        </span>
      ) : !allowed ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Lock className="size-4" />
        </span>
      ) : (
        <Button size="sm" variant="outline" onClick={onAdd} className="shrink-0">
          Add
        </Button>
      )}
    </div>
  );
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
