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
  Clock,
  ChevronRight,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { markOnboarded } from "@/app/welcome/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { InstallApp } from "@/components/install-app";
import { cn } from "@/lib/utils";

type TourStep = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  blurb: string;
  preview: React.ComponentType;
};

const TOUR: TourStep[] = [
  {
    icon: Inbox,
    eyebrow: "The Drop",
    title: "One place for everything",
    blurb: "Drop anything in — a photo of a letter, a quick thought, an email — and DailyOS reads it and handles it.",
    preview: DropPreview,
  },
  {
    icon: Sun,
    eyebrow: "Today",
    title: "Your day at a glance",
    blurb: "Everything happening today, what's due, and what needs attention — without digging.",
    preview: TodayPreview,
  },
  {
    icon: CheckSquare,
    eyebrow: "Tasks",
    title: "Nothing slips",
    blurb: "Every to-do with due dates. The ones you add and the ones DailyOS spots for you.",
    preview: TasksPreview,
  },
  {
    icon: Calendar,
    eyebrow: "Calendar",
    title: "Dates, handled",
    blurb: "Events land on your calendar as they come in, with reminders so nothing catches you off guard.",
    preview: CalendarPreview,
  },
  {
    icon: Archive,
    eyebrow: "Vault",
    title: "Safe & searchable",
    blurb: "Warranties, passports, receipts — private, organised, and a search away.",
    preview: VaultPreview,
  },
  {
    icon: Sparkles,
    eyebrow: "Ask DailyOS",
    title: "Your assistant, on call",
    blurb: "Ask a question, plan your day, or get something done in plain words.",
    preview: AskPreview,
  },
  {
    icon: CalendarCheck,
    eyebrow: "Review",
    title: "Stay a step ahead",
    blurb: "A calm weekly look at what got done and what's coming up next.",
    preview: ReviewPreview,
  },
];

const LAST = TOUR.length;

export function WelcomeScreen({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [leaving, setLeaving] = React.useState(false);

  async function done() {
    setLeaving(true);
    try {
      await markOnboarded();
    } catch {}
    router.push("/today");
    router.refresh();
  }

  const isIntro = step === 0;
  const total = LAST + 1;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative w-full max-w-md">
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

        <div key={step} className="animate-fade-in">
          {isIntro ? (
            <IntroStep name={name} />
          ) : (
            <FeatureStep {...TOUR[step - 1]} />
          )}
        </div>

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

// ---------------------------------------------------------------- Step 0: intro
const RESULTS = [
  { icon: CalendarCheck, title: "Museum trip", sub: "Thu 09:00 · reminder set" },
  { icon: ListChecks, title: "Sign & return the slip", sub: "Task · due Tuesday" },
  { icon: Wallet, title: "Pay £12 trip fee", sub: "Task · due Tuesday" },
];

function IntroStep({ name }: { name: string }) {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const durations = [1700, 1400, 3200];
    const id = setTimeout(() => setStage((s) => (s + 1) % 3), durations[stage]);
    return () => clearTimeout(id);
  }, [stage]);

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome{name ? `, ${name}` : ""}
      </h1>
      <p className="mt-2 text-balance text-muted-foreground">
        Here&apos;s DailyOS in action — watch one dropped letter become handled.
      </p>

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
    </div>
  );
}

// -------------------------------------------------- Feature steps: show the inside
function FeatureStep({ icon: Icon, eyebrow, title, blurb, preview: Preview }: TourStep) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-balance text-sm text-muted-foreground">{blurb}</p>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-card shadow-elevated">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <Icon className="size-4 text-primary" />
          <span className="text-xs font-semibold">{eyebrow}</span>
        </div>
        <div className="p-4 text-left">
          <Preview />
        </div>
      </div>
    </div>
  );
}

// --- Mockup helper components ------------------------------------------------

function MockRow({ icon: Icon, label, sub, accent }: { icon: LucideIcon; label: string; sub: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40" />
    </div>
  );
}

// --- The Drop: shows what it looks like after you've dropped things in --------
function DropPreview() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-3">
        <Plus className="size-4 text-primary" />
        <span className="text-sm text-muted-foreground">Drop a photo, note, or email here</span>
      </div>
      <MockRow icon={FileText} label="School trip letter" sub="3 items extracted · 2 hours ago" accent />
      <MockRow icon={FileText} label="Car insurance renewal" sub="Saved to Vault · yesterday" />
      <MockRow icon={FileText} label="Dentist appointment" sub="Added to Calendar · Mon" />
    </div>
  );
}

// --- Today: shows the daily overview -----------------------------------------
function TodayPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Wednesday 30 Jul</p>
        <span className="text-xs text-muted-foreground">09:41</span>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s events</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Clock className="size-3.5 text-primary" />
            <span className="font-medium">10:00</span>
            <span className="text-muted-foreground">Team standup</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Clock className="size-3.5 text-primary" />
            <span className="font-medium">14:30</span>
            <span className="text-muted-foreground">Dentist</span>
          </div>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due today</p>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <CheckSquare className="size-3.5 text-primary" />
          <span>Pay £12 trip fee</span>
        </div>
      </div>
    </div>
  );
}

// --- Tasks: shows a task list ------------------------------------------------
function TasksPreview() {
  const tasks = [
    { label: "Sign & return the slip", due: "Due tomorrow", done: false },
    { label: "Pay £12 trip fee", due: "Due today", done: false },
    { label: "Book restaurant for Saturday", due: "Due Fri", done: false },
    { label: "Reply to landlord", due: "Done yesterday", done: true },
  ];
  return (
    <div className="space-y-1.5">
      {tasks.map((t) => (
        <div key={t.label} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
          <div className={cn("size-4 shrink-0 rounded border", t.done ? "border-primary bg-primary" : "border-muted-foreground/30")} />
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm", t.done && "text-muted-foreground line-through")}>{t.label}</p>
            <p className="text-xs text-muted-foreground">{t.due}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Calendar: shows a mini month + events -----------------------------------
function CalendarPreview() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const dates = [28, 29, 30, 31, 1, 2, 3];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {days.map((d, i) => (
          <span key={i} className="py-1 font-semibold text-muted-foreground">{d}</span>
        ))}
        {dates.map((d, i) => (
          <span key={i} className={cn("rounded-full py-1.5", d === 30 ? "bg-primary text-primary-foreground font-semibold" : d > 27 ? "" : "text-muted-foreground")}>
            {d}
          </span>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <div className="size-2 shrink-0 rounded-full bg-blue-500" />
          <span className="font-medium">10:00</span>
          <span className="text-muted-foreground">Team standup</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <div className="size-2 shrink-0 rounded-full bg-emerald-500" />
          <span className="font-medium">14:30</span>
          <span className="text-muted-foreground">Dentist</span>
        </div>
      </div>
    </div>
  );
}

// --- Vault: shows stored documents -------------------------------------------
function VaultPreview() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search documents</span>
      </div>
      <MockRow icon={Archive} label="Car insurance policy" sub="PDF · Expires Dec 2026" />
      <MockRow icon={Archive} label="Passport scan" sub="Image · Added 3 months ago" />
      <MockRow icon={Archive} label="Washing machine warranty" sub="PDF · Expires Jun 2028" />
    </div>
  );
}

// --- Ask DailyOS: shows a chat-style interaction -----------------------------
function AskPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl rounded-bl-sm bg-muted/60 px-3.5 py-2.5 text-sm">
        What&apos;s on my calendar this week?
      </div>
      <div className="rounded-xl rounded-br-sm bg-primary/10 px-3.5 py-2.5 text-sm">
        <p>You have <span className="font-semibold">4 events</span> this week:</p>
        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
          <li>Wed 10:00 — Team standup</li>
          <li>Wed 14:30 — Dentist</li>
          <li>Thu 09:00 — Museum trip</li>
          <li>Sat 19:30 — Dinner at Comptoir</li>
        </ul>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm text-muted-foreground">Ask anything...</span>
      </div>
    </div>
  );
}

// --- Review: shows the weekly summary view -----------------------------------
function ReviewPreview() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This week</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted/50 px-2 py-2.5">
          <p className="text-lg font-bold text-primary">7</p>
          <p className="text-[10px] text-muted-foreground">Tasks done</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-2 py-2.5">
          <p className="text-lg font-bold text-primary">4</p>
          <p className="text-[10px] text-muted-foreground">Events</p>
        </div>
        <div className="rounded-lg bg-muted/50 px-2 py-2.5">
          <p className="text-lg font-bold text-primary">2</p>
          <p className="text-[10px] text-muted-foreground">Overdue</p>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming up</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <CalendarCheck className="size-3.5 text-primary" />
            <span>Museum trip — Thursday</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <CalendarCheck className="size-3.5 text-primary" />
            <span>Dinner at Comptoir — Saturday</span>
          </div>
        </div>
      </div>
    </div>
  );
}
