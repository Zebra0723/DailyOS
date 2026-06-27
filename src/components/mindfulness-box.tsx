"use client";

import * as React from "react";
import { Check, Wind, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

  return (
    <>
      {/* When complete, wash the whole screen in a calming wavy blue. */}
      {done && (
        <div
          className="pointer-events-none fixed inset-0 z-0 animate-fade-in opacity-60 wavy-bg"
          aria-hidden
        />
      )}

      <div className="relative z-10">
        <Card
          className={cn(
            "overflow-hidden transition-colors",
            done && "border-blue-200 bg-white/80 backdrop-blur",
          )}
        >
          <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
            <div
              className={cn(
                "grid size-14 place-items-center rounded-2xl transition-colors",
                done
                  ? "bg-blue-500 text-white"
                  : "bg-accent text-accent-foreground",
              )}
            >
              {done ? <Check className="size-7" /> : <Wind className="size-7" />}
            </div>

            {done ? (
              <div className="space-y-1">
                <p className="text-lg font-semibold">Lovely. That&apos;s your moment of calm. 🌊</p>
                <p className="text-sm text-muted-foreground">
                  Come back tomorrow for a fresh one.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Today&apos;s mindful moment
                </p>
                <p className="text-xl font-semibold">{prompt}</p>
              </div>
            )}

            {done ? (
              <Button variant="ghost" size="sm" onClick={undo}>
                <RotateCcw className="size-4" /> Undo
              </Button>
            ) : (
              <Button size="lg" onClick={complete} className="px-8">
                <Check className="size-4" /> Mark done
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
