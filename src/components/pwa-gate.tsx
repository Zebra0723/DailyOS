"use client";

import * as React from "react";
import {
  Smartphone,
  Inbox,
  Sparkles,
  CalendarCheck,
  Archive,
  WifiOff,
  BellRing,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { InstallApp } from "@/components/install-app";

// When true, a normal browser tab shows the install wall and only the
// installed PWA (opened from the home screen) can use the app. When false,
// DailyOS also works straight in the browser — no install required.
const PWA_ONLY = true;

const POINTS = [
  {
    icon: Inbox,
    title: "Drop anything in",
    desc: "Receipts, letters, bookings, screenshots — straight into the Drop.",
  },
  {
    icon: Sparkles,
    title: "DailyOS reads it",
    desc: "It pulls out the dates, tasks and details that matter — automatically.",
  },
  {
    icon: CalendarCheck,
    title: "It becomes handled",
    desc: "Turned into tasks, calendar events and reminders you won't miss.",
  },
  {
    icon: Archive,
    title: "Filed for later",
    desc: "Everything kept in a calm, searchable vault you actually trust.",
  },
];

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Gates the app to the installed PWA. In a normal browser tab it shows a
 * welcome/overview + install wall instead of the app; once DailyOS is opened
 * from the home screen (standalone) the real app renders. Auth/marketing pages
 * are NOT wrapped in this, so people can still sign up and install first.
 */
export function PwaGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [standalone, setStandalone] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    setStandalone(isStandalone());
  }, []);

  // Render the app during SSR / until we can check, and whenever it's installed.
  if (!PWA_ONLY || !mounted || standalone) return <>{children}</>;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-xl px-6 py-12">
        {/* Hero */}
        <div className="flex justify-center">
          <Logo tagline />
        </div>
        <div className="mt-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-accent/40 px-3 py-1 text-xs font-semibold text-primary">
            <Smartphone className="size-3.5" /> Install to use
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Life admin, handled.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            DailyOS turns the messy pile of receipts, letters, bookings and
            reminders into tasks, events and a tidy vault — so nothing slips.
          </p>
        </div>

        {/* What it does */}
        <div className="mt-8 grid gap-3">
          {POINTS.map((p) => (
            <div
              key={p.title}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <p.icon className="size-5" />
              </div>
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Install callout */}
        <div className="mt-8 rounded-2xl border border-primary/30 bg-gradient-to-b from-accent/50 to-accent/20 p-6 shadow-elevated">
          <h2 className="text-lg font-bold">Add DailyOS to your home screen</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            DailyOS runs as an app, not a website — so it opens full-screen, works
            offline and can send you reminders. It&apos;s only usable once
            installed and opened from your home screen.
          </p>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Smartphone className="size-4 text-primary" /> Full-screen app
            </span>
            <span className="inline-flex items-center gap-1.5">
              <WifiOff className="size-4 text-primary" /> Works offline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BellRing className="size-4 text-primary" /> Reminders
            </span>
          </div>

          <div className="mt-5 rounded-xl border bg-card p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Works on iPhone, iPad, Android, Mac and Windows. Here&apos;s how on
              your device:
            </p>
            <InstallApp />
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Already installed? Open DailyOS from your home-screen icon.
        </p>
      </div>
    </div>
  );
}
