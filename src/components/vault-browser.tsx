"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Archive,
  FileText,
  Plane,
  Home,
  GraduationCap,
  Banknote,
  ShoppingBag,
  HeartPulse,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CategoryBadge } from "@/components/badges";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import {
  VAULT_CATEGORY_LABELS,
  type VaultCategory,
  type VaultItem,
} from "@/lib/types";

type VaultRow = VaultItem & {
  inbox_items?: { input_type: string; file_name: string | null } | null;
};

// Category-specific icons for the vault, instead of one generic file icon.
const CATEGORY_ICON: Record<string, LucideIcon> = {
  travel: Plane,
  home: Home,
  school: GraduationCap,
  finance: Banknote,
  purchases: ShoppingBag,
  health: HeartPulse,
  subscriptions: RefreshCw,
  general: FileText,
};

export function VaultBrowser({ items }: { items: VaultRow[] }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<VaultCategory | "all">("all");

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
    return counts;
  }, [items]);

  const filtered = items.filter((it) => {
    if (category !== "all" && it.category !== category) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      it.title.toLowerCase().includes(q) ||
      (it.summary ?? "").toLowerCase().includes(q)
    );
  });

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="Your vault is empty"
        description="Approved inbox items land here, neatly filed by category and fully searchable. Process something in your inbox to get started."
        actionLabel="Add to Inbox"
        actionHref="/inbox/new"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search your vault…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <Chip
          active={category === "all"}
          onClick={() => setCategory("all")}
          label="All"
          count={items.length}
        />
        {Object.entries(VAULT_CATEGORY_LABELS).map(([value, label]) => {
          const count = categories.get(value) ?? 0;
          if (!count) return null;
          return (
            <Chip
              key={value}
              active={category === value}
              onClick={() => setCategory(value as VaultCategory)}
              label={label}
              count={count}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing matches “{query}”.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((it) => {
            const Icon = CATEGORY_ICON[it.category] ?? FileText;
            return (
            <Link key={it.id} href={`/inbox/${it.inbox_item_id}`}>
              <Card className="h-full p-4 transition-colors hover:bg-accent/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </div>
                  <CategoryBadge category={it.category as VaultCategory} />
                </div>
                <p className="mt-3 font-medium leading-snug">{it.title}</p>
                {it.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {it.summary}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Saved {formatDate(it.created_at)}
                </p>
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs",
          active ? "bg-primary-foreground/20" : "bg-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}
