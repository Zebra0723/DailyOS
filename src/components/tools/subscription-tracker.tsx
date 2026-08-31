"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// A self-contained, no-login subscription cost calculator. It exists to rank on
// Google for "subscription tracker" / "how much do I spend on subscriptions"
// and funnel visitors into DailyOS — so it must be instantly useful with zero
// friction and no account. State lives only in the visitor's browser.

type Cycle = "weekly" | "monthly" | "quarterly" | "annual";

interface Sub {
  id: string;
  name: string;
  cost: number;
  cycle: Cycle;
}

const CYCLES: { value: Cycle; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

const PRESETS = [
  "Netflix",
  "Spotify",
  "Amazon Prime",
  "Disney+",
  "iCloud",
  "YouTube Premium",
  "Gym",
  "PlayStation Plus",
];

const STORAGE_KEY = "dailyos-subtracker";

function monthlyOf(s: Sub): number {
  switch (s.cycle) {
    case "weekly":
      return (s.cost * 52) / 12;
    case "quarterly":
      return s.cost / 3;
    case "annual":
      return s.cost / 12;
    default:
      return s.cost;
  }
}

const gbp = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const gbp0 = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

export function SubscriptionTracker() {
  const [subs, setSubs] = React.useState<Sub[]>([]);
  const [name, setName] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [cycle, setCycle] = React.useState<Cycle>("monthly");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSubs(parsed);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
    } catch {
      /* ignore quota */
    }
  }, [subs, loaded]);

  function add() {
    const n = name.trim();
    const c = parseFloat(cost);
    if (!n || Number.isNaN(c) || c <= 0) return;
    setSubs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: n, cost: c, cycle },
    ]);
    setName("");
    setCost("");
    setCycle("monthly");
  }

  const monthlyTotal = subs.reduce((sum, s) => sum + monthlyOf(s), 0);
  const annualTotal = monthlyTotal * 12;
  const dearest = [...subs].sort((a, b) => monthlyOf(b) - monthlyOf(a))[0];

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <Input
            placeholder="Subscription name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            aria-label="Subscription name"
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="£"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            aria-label="Cost"
            className="sm:w-28"
          />
          <select
            value={cycle}
            onChange={(e) => setCycle(e.target.value as Cycle)}
            aria-label="Billing cycle"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {CYCLES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <Button onClick={add} className="shrink-0">
            <Plus className="size-4" /> Add
          </Button>
        </div>

        {/* Preset quick-adds */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRESETS.filter((p) => !subs.some((s) => s.name === p)).map((p) => (
            <button
              key={p}
              onClick={() => setName(p)}
              className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              + {p}
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      {subs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Per month
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
              {gbp(monthlyTotal)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Per year
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {gbp0(annualTotal)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-5 text-center shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subscriptions
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{subs.length}</p>
          </div>
        </div>
      )}

      {/* List */}
      {subs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          {subs.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 border-b px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {gbp(s.cost)} · {s.cycle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {gbp(monthlyOf(s))}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    /mo
                  </span>
                </span>
                <button
                  onClick={() => setSubs((prev) => prev.filter((x) => x.id !== s.id))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${s.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The funnel: turn the result into a reason to sign up */}
      {subs.length > 0 && (
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-accent/30 to-background p-6 text-center shadow-elevated">
          <Sparkles className="mx-auto size-6 text-primary" />
          <h2 className="mt-3 text-xl font-bold tracking-tight">
            You&apos;re spending {gbp0(annualTotal)} a year on subscriptions
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {dearest
              ? `Your biggest is ${dearest.name} at ${gbp(monthlyOf(dearest))}/mo. `
              : ""}
            DailyOS tracks every subscription automatically, reminds you before
            each renewal, and flags the ones you could cancel — alongside the
            rest of your life admin.
          </p>
          <Button size="lg" asChild className="mt-5 h-12 px-7 text-base shadow-elevated">
            <Link href="/signup?ref=subtracker">
              Track these free in DailyOS
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Free to start · No card required
          </p>
        </div>
      )}

      {subs.length === 0 && loaded && (
        <p className="text-center text-sm text-muted-foreground">
          Add your subscriptions above to see what they really cost you each year.
        </p>
      )}
    </div>
  );
}
