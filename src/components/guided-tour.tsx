"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Inbox,
  Sun,
  CheckSquare,
  Calendar,
  Archive,
  Sparkles,
  Home,
  ArrowRight,
  ArrowLeft,
  X,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = {
  page: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    page: "/today",
    icon: Sun,
    eyebrow: "Today",
    title: "Your daily brief",
    body: "Everything happening today in one place — tasks due, upcoming events, items needing review, and quick links to the rest of your DailyOS.",
  },
  {
    page: "/inbox",
    icon: Inbox,
    eyebrow: "The Drop",
    title: "Drop anything in",
    body: "Forward an email, snap a photo of a letter, paste text, or upload a PDF. DailyOS reads it and pulls out dates, tasks, and key details automatically.",
  },
  {
    page: "/tasks",
    icon: CheckSquare,
    eyebrow: "Tasks",
    title: "Nothing slips through",
    body: "Every to-do in one list — the ones you add and the ones DailyOS spots for you. Due dates, priorities, and one-tap completion.",
  },
  {
    page: "/calendar",
    icon: Calendar,
    eyebrow: "Calendar",
    title: "Dates, handled",
    body: "Events land on your calendar as you drop things in. Syncs to your phone calendar so reminders reach you wherever you are.",
  },
  {
    page: "/vault",
    icon: Archive,
    eyebrow: "Vault",
    title: "Safe and searchable",
    body: "Warranties, passports, receipts, insurance — stored privately and findable in seconds when you need them.",
  },
  {
    page: "/assistant",
    icon: Sparkles,
    eyebrow: "Ask DailyOS",
    title: "Your AI chief of staff",
    body: "Ask a question about anything you've saved, plan your day, or get something done — in plain words.",
  },
  {
    page: "/homeos",
    icon: Home,
    eyebrow: "HomeOS",
    title: "Run your home",
    body: "Track subscriptions, deliveries, warranties, rooms and devices — your household command centre.",
  },
];

const TOUR_KEY = "dailyos-tour-active";

function GuidedTourInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tourRequested = searchParams.get("tour") === "1";
  const [step, setStep] = React.useState(-1);
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (tourRequested) {
      sessionStorage.setItem(TOUR_KEY, "1");
      setStep(0);
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.toString());
    } else if (sessionStorage.getItem(TOUR_KEY) === "1") {
      const idx = STEPS.findIndex((s) => s.page === pathname);
      // On a page the tour doesn't cover (Settings, a note, …) hold the step
      // we were on rather than snapping the user back to the start.
      setStep((s) => (idx >= 0 ? idx : s >= 0 ? s : 0));
    }
  }, [pathname, tourRequested]);

  React.useEffect(() => {
    if (navigatingTo && pathname === navigatingTo) {
      setNavigatingTo(null);
    }
  }, [pathname, navigatingTo]);

  function navigate(idx: number) {
    setStep(idx);
    const target = STEPS[idx].page;
    if (target !== pathname) {
      setNavigatingTo(target);
      router.push(target);
    }
  }

  function finish() {
    sessionStorage.removeItem(TOUR_KEY);
    setStep(-1);
  }

  if (step < 0) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const onCorrectPage = pathname === current.page && !navigatingTo;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={finish}
      />

      <div className="relative mx-4 mb-4 w-full max-w-md animate-fade-in rounded-2xl border bg-card shadow-elevated sm:mb-0">
        <button
          onClick={finish}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close tour"
        >
          <X className="size-4" />
        </button>

        <div className="flex gap-1.5 px-6 pt-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                i <= step ? "bg-primary" : "bg-muted",
              )}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <div className="px-6 pb-2 pt-5" key={step}>
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                {current.eyebrow}
              </p>
              <h2 className="text-lg font-bold tracking-tight">
                {current.title}
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {current.body}
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
            <Compass className="size-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              {onCorrectPage
                ? "You're looking at it now — scroll around to explore."
                : `Taking you to ${current.eyebrow}…`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(step - 1)}
            disabled={isFirst}
            className={cn(isFirst && "invisible")}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>

          <span className="text-xs text-muted-foreground">
            {step + 1} of {STEPS.length}
          </span>

          {isLast ? (
            <Button size="sm" onClick={finish}>
              Done <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate(step + 1)}>
              Next <ArrowRight className="size-4" />
            </Button>
          )}
        </div>

        <div className="border-t px-6 py-3 text-center">
          <button
            onClick={finish}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuidedTour() {
  return (
    <React.Suspense fallback={null}>
      <GuidedTourInner />
    </React.Suspense>
  );
}
