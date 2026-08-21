"use client";

// New users landed on an empty dashboard and a nearly empty nav with nothing
// explaining that this is deliberate, what a widget is versus a section, or how
// to build the app up. This is that explanation, shown on Today until it's
// dismissed, and always available from Settings.

import * as React from "react";
import { LayoutGrid, Compass, Sparkles, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWidgetStore } from "@/components/widget-store";

const DISMISS_KEY = (userId?: string) =>
  userId ? `dailyos-how-it-works-dismissed:${userId}` : null;

const STEPS = [
  {
    icon: LayoutGrid,
    title: "Widgets fill this page",
    body: "Your dashboard starts blank. Add widgets — tasks due, upcoming events, habits, your home summary — and drag them into the order you want.",
  },
  {
    icon: Compass,
    title: "Sections are your navigation",
    body: "The pages along the top are yours to choose too. Switch on only what you need: Tasks, Calendar, Vault, HomeOS and the rest are all optional.",
  },
  {
    icon: Sparkles,
    title: "Nothing is lost when you remove something",
    body: "Removing a widget or a section only hides it. Your data stays exactly where it is, and you can add it back any time.",
  },
];

export function HowDailyOSWorks({ userId }: { userId?: string }) {
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);
  const { openWidgetStore } = useWidgetStore();

  // null until we've read storage, so the card can't flash in for someone who
  // dismissed it a week ago.
  React.useEffect(() => {
    const key = DISMISS_KEY(userId);
    if (!key) {
      setDismissed(true);
      return;
    }
    try {
      setDismissed(localStorage.getItem(key) === "1");
    } catch {
      setDismissed(false);
    }
  }, [userId]);

  function dismiss() {
    setDismissed(true);
    const key = DISMISS_KEY(userId);
    if (!key) return;
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* private mode — it'll just show again next time */
    }
  }

  if (dismissed !== false) return null;

  return (
    <Card className="relative mb-6 border-primary/20 bg-primary/[0.03]">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <CardContent className="p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          DailyOS starts empty — on purpose
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Most apps decide what you see. This one doesn&apos;t: you build it from
          the pieces you actually want, and ignore the rest.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-xl border bg-card p-3">
                <Icon className="size-4 text-primary" />
                <p className="mt-2 text-sm font-medium">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={openWidgetStore}>
            <LayoutGrid className="size-4" /> Add your first widget
          </Button>
          <Button size="sm" variant="outline" onClick={openWidgetStore}>
            <Compass className="size-4" /> Choose your sections
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Got it
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
