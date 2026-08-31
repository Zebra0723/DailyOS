"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Free, no-login renewal / warranty / free-trial date tracker. SEO funnel for
// "renewal reminder" / "warranty tracker" / "when does my free trial end".
// State stays in the visitor's browser; the CTA is DailyOS doing it for real
// (automatic reminders before every date).

interface Item {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
}

const STORAGE_KEY = "dailyos-renewals";

function daysUntil(dateStr: string): number | null {
  const t = Date.parse(`${dateStr}T00:00:00`);
  if (Number.isNaN(t)) return null;
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((t - midnight) / 86_400_000);
}

function label(days: number | null): { text: string; tone: string } {
  if (days === null) return { text: "—", tone: "text-muted-foreground" };
  if (days < 0) return { text: `${Math.abs(days)}d ago`, tone: "text-muted-foreground" };
  if (days === 0) return { text: "Today", tone: "text-red-600 dark:text-red-400" };
  if (days <= 7) return { text: `${days}d`, tone: "text-red-600 dark:text-red-400" };
  if (days <= 30) return { text: `${days}d`, tone: "text-amber-600 dark:text-amber-400" };
  return { text: `${days}d`, tone: "text-muted-foreground" };
}

export function RenewalTracker() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, loaded]);

  function add() {
    const n = name.trim();
    if (!n || !date) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name: n, date }]);
    setName("");
    setDate("");
  }

  const sorted = [...items].sort((a, b) => {
    const da = daysUntil(a.date) ?? Infinity;
    const db = daysUntil(b.date) ?? Infinity;
    return da - db;
  });
  const soon = sorted.filter((i) => {
    const d = daysUntil(i.date);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder="e.g. Car insurance, Amazon Prime trial, boiler warranty"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            aria-label="What renews"
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            aria-label="Renewal date"
            className="sm:w-44"
          />
          <Button onClick={add} className="shrink-0">
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      {items.length > 0 && (
        <>
          {soon > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-300">
              {soon} {soon === 1 ? "renewal is" : "renewals are"} coming up in the
              next 30 days.
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
            {sorted.map((i) => {
              const d = daysUntil(i.date);
              const l = label(d);
              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-3 border-b px-5 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${i.date}T00:00:00`).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${l.tone}`}>{l.text}</span>
                    <button
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Remove ${i.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-accent/30 to-background p-6 text-center shadow-elevated">
            <Bell className="mx-auto size-6 text-primary" />
            <h2 className="mt-3 text-xl font-bold tracking-tight">
              This list won&apos;t remind you. DailyOS will.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Forward a renewal email or snap a letter and DailyOS logs the date
              for you — then sends a notification before every renewal, trial end
              and warranty expiry, even when the app is closed.
            </p>
            <Button size="lg" asChild className="mt-5 h-12 px-7 text-base shadow-elevated">
              <Link href="/signup?ref=renewals">
                Get reminders free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Free to start · No card required
            </p>
          </div>
        </>
      )}

      {items.length === 0 && loaded && (
        <p className="text-center text-sm text-muted-foreground">
          Add anything with a date you don&apos;t want to miss — insurance
          renewals, free-trial end dates, warranties, subscriptions.
        </p>
      )}
    </div>
  );
}
