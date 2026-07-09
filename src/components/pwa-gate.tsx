"use client";

import * as React from "react";
import { Smartphone, Share, Plus } from "lucide-react";
import { Logo } from "@/components/logo";
import { InstallApp } from "@/components/install-app";

// Flip to false to allow the app in a normal browser again (one line).
const PWA_ONLY = true;

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Gates the app to the installed PWA. In a normal browser tab it shows an
 * install wall instead of the app; once DailyOS is opened from the home screen
 * (standalone display mode) the real app renders. Auth/marketing pages are NOT
 * wrapped in this, so people can still sign up and install first.
 */
export function PwaGate({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [standalone, setStandalone] = React.useState(true);
  const [ios, setIos] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setStandalone(isStandalone());
    setIos(isIos());
  }, []);

  // Render the app during SSR / until we can check, and whenever it's installed.
  if (!PWA_ONLY || !mounted || standalone) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <div className="absolute inset-0 bg-grid opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="relative w-full max-w-md">
        <Logo className="mx-auto" />

        <div className="mx-auto mt-8 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-lg shadow-primary/30">
          <Smartphone className="size-8" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          Add DailyOS to your home screen
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          DailyOS runs as an app, not a website. Install it once and open it from
          your home screen — it&apos;s full-screen, works offline, and can send you
          reminders.
        </p>

        <div className="mt-6 rounded-2xl border bg-card p-5 text-left shadow-card">
          {ios ? (
            <ol className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold">
                  1
                </span>
                Tap the <Share className="mx-1 inline size-4 align-text-bottom" />
                <strong>Share</strong> button in the browser bar.
              </li>
              <li className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold">
                  2
                </span>
                Choose{" "}
                <Plus className="mx-1 inline size-4 align-text-bottom" />
                <strong>Add to Home Screen</strong>.
              </li>
              <li className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold">
                  3
                </span>
                Open <strong>DailyOS</strong> from your home screen.
              </li>
            </ol>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tap below to install, or use your browser menu →{" "}
                <strong>Install app</strong> / <strong>Add to Home screen</strong>,
                then open DailyOS from your home screen.
              </p>
              <InstallApp />
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Already installed? Open DailyOS from your home-screen icon.
        </p>
      </div>
    </div>
  );
}
