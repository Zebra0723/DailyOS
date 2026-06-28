"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Wind, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// A different gentle prompt each day. Picked by day-of-year so it's stable
// for the whole day and rotates automatically.
const PROMPTS = [
  "Take 10 slow, deep breaths.",
  "Do some gentle yoga for 5 minutes.",
  "Step outside for a minute of fresh air.",
  "Write down one thing you're grateful for.",
  "Drop your shoulders and unclench your jaw.",
  "Sit quietly and notice 5 sounds around you.",
  "Have a glass of water and one slow breath.",
  "Roll your neck and shoulders slowly.",
  "Close your eyes for 30 seconds and just breathe.",
  "Take a short, slow walk — no phone.",
  "Stretch your arms up high and breathe out slowly.",
  "Name three things you can see right now.",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dayOfYear() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

const STORAGE_PREFIX = "dailyos-mindful-";

export function MindfulnessBox() {
  const [mounted, setMounted] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const prompt = PROMPTS[dayOfYear() % PROMPTS.length];

  React.useEffect(() => {
    setMounted(true);
    setDone(localStorage.getItem(STORAGE_PREFIX + todayKey()) === "1");
  }, []);

  function complete() {
    localStorage.setItem(STORAGE_PREFIX + todayKey(), "1");
    setDone(true);
  }
  function undo() {
    localStorage.removeItem(STORAGE_PREFIX + todayKey());
    setDone(false);
  }

  // Avoid a hydration flash before we've read localStorage.
  if (!mounted) {
    return <Card className="h-44 animate-pulse" />;
  }

  // Completed: flood the whole site with rising water + floating message.
  if (done) {
    return (
      <>
        <div
          className="pointer-events-none fixed inset-0 z-40 overflow-hidden animate-fade-in"
          aria-hidden
        >
          <div className="water-fill wavy-bg opacity-80" />
        </div>
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="animate-float text-center">
            <p className="text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:text-5xl">
              Well done, check back tomorrow!
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={undo}
                className="pointer-events-auto"
              >
                <RotateCcw className="size-4" /> Undo
              </Button>
              <Button size="sm" asChild className="pointer-events-auto">
                <Link href="/today">
                  <Home className="size-4" /> Back to Today
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Not yet done: today's prompt.
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Wind className="size-7" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Today&apos;s mindful moment
          </p>
          <p className="text-xl font-semibold">{prompt}</p>
        </div>
        <Button size="lg" onClick={complete} className="px-8">
          <Check className="size-4" /> Mark done
        </Button>
      </CardContent>
    </Card>
  );
}
