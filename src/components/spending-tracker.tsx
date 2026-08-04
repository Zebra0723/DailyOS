"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import {
  LOCALES,
  SPEND_CATEGORIES,
  formatAmount,
  localeFor,
  type LocaleDef,
  type SpendCategory,
} from "@/lib/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Purchase = {
  id: string;
  amount: number;
  label: string;
  category: SpendCategory;
  date: string; // YYYY-MM-DD
};

type SpendingData = {
  purchases: Purchase[];
  currency: string;
  locale: string;
};

type Period = "day" | "week" | "month" | "year" | "lifetime";

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "lifetime", label: "Lifetime" },
];

const CATEGORY_ICONS: Record<SpendCategory, string> = {
  food: "🍔",
  shopping: "🛍️",
  transport: "🚗",
  bills: "📄",
  entertainment: "🎬",
  health: "💊",
  education: "📚",
  gifts: "🎁",
  subscriptions: "🔄",
  home: "🏠",
  travel: "✈️",
  other: "📌",
};

function startOfPeriod(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - d.getDay());
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "lifetime":
      return new Date(0);
  }
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const persist = debounce((data: SpendingData) => {
  void saveRemote("spending", data);
}, 800);

export function SpendingTracker() {
  const [data, setData] = React.useState<SpendingData>({
    purchases: [],
    currency: "GBP",
    locale: "en-GB",
  });
  const [period, setPeriod] = React.useState<Period>("month");
  const [showForm, setShowForm] = React.useState(false);
  const [expandedCat, setExpandedCat] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  // Form state
  const [amount, setAmount] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [category, setCategory] = React.useState<SpendCategory>("food");
  const [date, setDate] = React.useState(todayYmd);

  React.useEffect(() => {
    loadRemote<SpendingData>("spending").then((remote) => {
      if (remote) setData(remote);
      setLoaded(true);
    });
  }, []);

  function update(next: SpendingData) {
    setData(next);
    persist(next);
  }

  function addPurchase(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !label.trim()) return;
    const purchase: Purchase = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      amount: parsed,
      label: label.trim(),
      category,
      date,
    };
    const next = {
      ...data,
      purchases: [purchase, ...data.purchases],
    };
    update(next);
    setAmount("");
    setLabel("");
    setCategory("food");
    setDate(todayYmd());
    setShowForm(false);
  }

  function removePurchase(id: string) {
    update({ ...data, purchases: data.purchases.filter((p) => p.id !== id) });
  }

  function setCurrency(code: string) {
    const loc = localeFor(LOCALES.find((l) => l.currency === code)?.code);
    update({ ...data, currency: code, locale: loc.code });
  }

  const cutoff = startOfPeriod(period);
  const filtered = data.purchases.filter(
    (p) => new Date(p.date + "T00:00:00") >= cutoff,
  );
  const total = filtered.reduce((s, p) => s + p.amount, 0);

  // Category breakdown
  const byCategory = SPEND_CATEGORIES.map((cat) => {
    const items = filtered.filter((p) => p.category === cat.key);
    const sum = items.reduce((s, p) => s + p.amount, 0);
    return { ...cat, sum, items, count: items.length };
  }).filter((c) => c.count > 0);

  byCategory.sort((a, b) => b.sum - a.sum);

  const uniqueCurrencies = [...new Set(LOCALES.map((l) => l.currency))];

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with currency picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Spending
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track purchases and see where your money goes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={data.currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-28"
          >
            {uniqueCurrencies.map((c) => {
              const loc = LOCALES.find((l) => l.currency === c);
              return (
                <option key={c} value={c}>
                  {loc?.symbol} {c}
                </option>
              );
            })}
          </Select>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Add purchase form */}
      {showForm && (
        <Card>
          <CardContent className="pt-5">
            <form onSubmit={addPurchase} className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Input
                placeholder="What did you buy?"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
              <Select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as SpendCategory)
                }
              >
                {SPEND_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {CATEGORY_ICONS[c.key]} {c.label}
                  </option>
                ))}
              </Select>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" className="flex-1">
                  Save purchase
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Period filter */}
      <div className="flex gap-1.5 overflow-x-auto">
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              period === p.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Total card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total spent ({PERIOD_LABELS.find((p) => p.key === period)?.label?.toLowerCase()})
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {formatAmount(total, data.currency, data.locale)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">
              {filtered.length} purchase{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" />
              By category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byCategory.map((cat) => {
              const pct = total > 0 ? (cat.sum / total) * 100 : 0;
              const isExpanded = expandedCat === cat.key;
              return (
                <div key={cat.key}>
                  <button
                    onClick={() =>
                      setExpandedCat(isExpanded ? null : cat.key)
                    }
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent/40"
                  >
                    <span className="text-lg">
                      {CATEGORY_ICONS[cat.key as SpendCategory]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {cat.label}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatAmount(cat.sum, data.currency, data.locale)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary transition-all"
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {cat.count} item{cat.count !== 1 ? "s" : ""}
                        </span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-9 space-y-1 pb-2">
                      {cat.items.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {p.label}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {p.date}
                          </span>
                          <span className="shrink-0 font-medium">
                            {formatAmount(p.amount, data.currency, data.locale)}
                          </span>
                          <button
                            onClick={() => removePurchase(p.id)}
                            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent purchases list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No purchases logged{" "}
              {period === "lifetime" ? "yet" : "for this period"}.
              <br />
              Tap &quot;Add&quot; to start tracking.
            </p>
          ) : (
            <div className="space-y-1.5">
              {filtered.slice(0, 30).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="text-lg">
                    {CATEGORY_ICONS[p.category]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {SPEND_CATEGORIES.find((c) => c.key === p.category)
                        ?.label ?? p.category}{" "}
                      · {p.date}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatAmount(p.amount, data.currency, data.locale)}
                  </span>
                  <button
                    onClick={() => removePurchase(p.id)}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Delete purchase"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
