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
  React.useEffect(() => {
    if (tourRequested) {
      sessionStorage.setItem(TOUR_KEY, "1");
      setStep(0);
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.toString());
    } else if (sessionStorage.getItem(TOUR_KEY) === "1") {
      const idx = STEPS.findIndex((s) => s.page === pathname);
      setStep((s) => (idx >= 0 ? idx : s >= 0 ? s : 0));
    }
  }, [pathname, tourRequested]);

  function navigate(idx: number) {
    setStep(idx);
    const target = STEPS[idx].page;
    if (target !== pathname) {
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

  return (
    <>
      {/* Light scrim — page content stays clearly visible */}
      <div
        className="fixed inset-0 z-[100] bg-black/15"
        onClick={finish}
      />

      {/* Bottom-docked card so the page is visible above */}
      <div className="fixed inset-x-0 bottom-0 z-[101] mx-auto w-full max-w-lg animate-slide-up px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
        <div className="rounded-2xl border bg-card shadow-elevated">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex gap-1.5 flex-1 mr-8">
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
            <button
              onClick={finish}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close tour"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-5 pb-2 pt-4" key={step}>
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
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {current.body}
            </p>
          </div>

          <div className="flex items-center justify-between border-t px-5 py-3">
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
        </div>
      </div>
    </>
  );
}

export function GuidedTour() {
  return (
    <React.Suspense fallback={null}>
      <GuidedTourInner />
    </React.Suspense>
  );
}
