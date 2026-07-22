"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Sparkles,
  CalendarCheck,
  ListChecks,
  Wallet,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  Inbox,
  Sun,
  CheckSquare,
  Calendar,
  Archive,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { markOnboarded } from "@/app/welcome/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { InstallApp } from "@/components/install-app";
import { cn } from "@/lib/utils";

// The three "handled" results the step-1 demo reveals from one dropped letter.
const RESULTS = [
  { icon: CalendarCheck, title: "Museum trip", sub: "Thu 09:00 · reminder set" },
  { icon: ListChecks, title: "Sign & return the slip", sub: "Task · due Tuesday" },
  { icon: Wallet, title: "Pay £12 trip fee", sub: "Task · due Tuesday" },
];

// The guided-tour stops. Step 0 is the warm "magic moment"; the rest are a quick
// walk through the core areas of the app. Each has a short, friendly blurb.
type TourStep = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  blurb: string;
};

const TOUR: TourStep[] = [
  {
    icon: Inbox,
    eyebrow: "The Drop",
    title: "One place for everything",
    blurb:
      "Snap a letter, forward an email, jot a thought. Drop anything in and DailyOS reads it, then turns it into the right events, tasks and reminders — automatically.",
  },
  {
    icon: Sun,
    eyebrow: "Today",
    title: "Your day at a glance",
    blurb:
      "Your home base. Today gathers what's happening, what's due and what needs a nudge — so you always know the next thing without digging.",
  },
  {
    icon: CheckSquare,
    eyebrow: "Tasks",
    title: "Nothing slips",
    blurb:
      "Every to-do — the ones you add and the ones DailyOS spots for you — lives here with due dates, so the little jobs actually get done.",
  },
  {
    icon: Calendar,
    eyebrow: "Calendar",
    title: "Dates, handled",
    blurb:
      "Appointments, trips and deadlines land on your calendar as they come in, with reminders set so nothing catches you off guard.",
  },
  {
    icon: Archive,
    eyebrow: "Vault",
    title: "Documents, safe & searchable",
    blurb:
      "Warranties, passports, policies and receipts — kept private, organised and a search away when you actually need them.",
  },
  {
    icon: Sparkles,
    eyebrow: "Ask DailyOS",
    title: "Your assistant, on call",
    blurb:
      "Ask a question, plan your day, or get something handled in plain words. The assistant knows your stuff and does the fiddly bits for you.",
  },
  {
    icon: CalendarCheck,
    eyebrow: "Review",
    title: "Stay a step ahead",
    blurb:
      "A calm weekly look at what's ahead and what got done — a moment to tidy up, catch loose ends and start the week clear.",
  },
];

// Total stops: the magic-moment intro (0) + every tour step above.
const LAST = TOUR.length; // index of the final step

export function WelcomeScreen({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [leaving, setLeaving] = React.useState(false);

  // Stamp the first-run flag (so the tour never auto-shows again) and head to
  // Today. Used by both "Skip tour" and "Finish" — a seen tour is a seen tour.
  async function done() {
    setLeaving(true);
    try {
      await markOnboarded();
    } catch {
      /* even if the flag write fails, don't trap the user on the tour */
    }
    router.push("/today");
    router.refresh();
  }

  const isIntro = step === 0;
  const total = LAST + 1;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative w-full max-w-md">
        {/* Header: logo + skip-any-time */}
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button
            onClick={done}
            disabled={leaving}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
          >
            Skip tour
          </button>
        </div>

        {/* Progress dots */}
        <div className="mb-7 flex gap-1.5" aria-hidden>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        {/* Body */}
        <div key={step} className="animate-fade-in text-center">
          {isIntro ? (
            <IntroStep name={name} />
          ) : (
            <FeatureStep {...TOUR[step - 1]} />
          )}
        </div>

        {/* Nav */}
        <div className="mt-7 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={isIntro || leaving}
            className={cn(isIntro && "invisible")}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>

          {step < LAST ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={leaving}>
              {isIntro ? "Take the tour" : "Next"} <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={done} disabled={leaving}>
              {leaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              Start using DailyOS
            </Button>
          )}
        </div>

        {/* Install DailyOS — offered on the final stop */}
        {step === LAST && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-accent/20 p-4 text-left animate-fade-in">
            <div className="flex items-center gap-2">
              <Smartphone className="size-4 text-primary" />
              <p className="text-sm font-medium">Install DailyOS</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Add it to your home screen — full-screen, offline, and a tap away.
            </p>
            <div className="mt-2">
              <InstallApp />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Step 1: intro
function IntroStep({ name }: { name: string }) {
  // Looping demo: 0 = dropped, 1 = reading, 2 = handled, then round again.
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const durations = [1700, 1400, 3200];
    const id = setTimeout(() => setStage((s) => (s + 1) % 3), durations[stage]);
    return () => clearTimeout(id);
  }, [stage]);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome{name ? `, ${name}` : ""}
      </h1>
      <p className="mt-2 text-balance text-muted-foreground">
        Here&apos;s DailyOS in action — watch one dropped letter become handled.
      </p>

      {/* The magic moment */}
      <div className="mt-7 rounded-3xl border bg-card p-5 text-left shadow-elevated">
        <div
          className={
            "flex items-center gap-3 rounded-xl border bg-accent/40 p-3 transition-all duration-500 " +
            (stage === 0 ? "opacity-100" : "opacity-60")
          }
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              St Mary&apos;s — school trip letter
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Dropped in · just now
            </p>
          </div>
        </div>

        <div className="my-2 flex items-center justify-center">
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-500 " +
              (stage === 1
                ? "bg-primary/10 text-primary opacity-100"
                : stage === 2
                  ? "bg-emerald-500/10 text-emerald-600 opacity-100"
                  : "opacity-0")
            }
          >
            <Sparkles className={"size-3 " + (stage === 1 ? "animate-pulse" : "")} />
            {stage === 2 ? "Handled" : "DailyOS is reading it…"}
          </span>
        </div>

        <div className="space-y-2">
          {RESULTS.map((r, i) => (
            <div
              key={r.title}
              className={
                "flex items-center gap-3 rounded-xl border bg-background p-3 transition-all duration-500 " +
                (stage === 2
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1.5 opacity-0")
              }
              style={{ transitionDelay: stage === 2 ? `${i * 160}ms` : "0ms" }}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <r.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Take a quick tour of the app — or skip and dive straight in.
      </p>
    </>
  );
}

// -------------------------------------------------------- Steps 2+: feature card
function FeatureStep({ icon: Icon, eyebrow, title, blurb }: TourStep) {
  return (
    <div className="rounded-3xl border bg-card p-8 shadow-elevated">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-balance text-muted-foreground">{blurb}</p>
    </div>
  );
}
