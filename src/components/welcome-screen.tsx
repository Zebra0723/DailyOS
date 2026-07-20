"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  CalendarCheck,
  ListChecks,
  Wallet,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { InstallApp } from "@/components/install-app";

// The three "handled" results the demo reveals from one dropped letter.
const RESULTS = [
  {
    icon: CalendarCheck,
    title: "Museum trip",
    sub: "Thu 09:00 · reminder set",
  },
  {
    icon: ListChecks,
    title: "Sign & return the slip",
    sub: "Task · due Tuesday",
  },
  {
    icon: Wallet,
    title: "Pay £12 trip fee",
    sub: "Task · due Tuesday",
  },
];

export function WelcomeScreen({ name }: { name: string }) {
  // Looping demo: 0 = dropped, 1 = reading, 2 = handled, then round again.
  const [stage, setStage] = React.useState(0);

  React.useEffect(() => {
    const durations = [1700, 1400, 3200]; // ms per stage
    const id = setTimeout(
      () => setStage((s) => (s + 1) % 3),
      durations[stage],
    );
    return () => clearTimeout(id);
  }, [stage]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-10">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative w-full max-w-md animate-fade-in text-center">
        <Logo className="mx-auto" />

        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-2 text-balance text-muted-foreground">
          Here&apos;s DailyOS in action — watch one dropped letter become handled.
        </p>

        {/* ------------------------------------------------ The magic moment */}
        <div className="mt-7 rounded-3xl border bg-card p-5 text-left shadow-elevated">
          {/* The thing you drop in */}
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

          {/* Reading indicator */}
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

          {/* What it becomes */}
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

        {/* --------------------------------------------------------- CTAs */}
        <div className="mt-7 space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/inbox/new">
              Drop your first thing <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/today">Take a look around first</Link>
          </Button>
        </div>

        {/* Install DailyOS — add it to the home screen for the full app feel */}
        <div className="mt-5 rounded-xl border border-primary/30 bg-accent/20 p-4 text-left">
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
      </div>
    </div>
  );
}
