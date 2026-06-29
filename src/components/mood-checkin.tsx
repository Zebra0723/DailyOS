"use client";

import * as React from "react";
import Link from "next/link";
import {
  Flower2,
  ArrowRight,
  Sparkles,
  Frown,
  Annoyed,
  Meh,
  Smile,
  Laugh,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KEY_PREFIX = "dailyos-mood-";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function moodIconFor(score: number): LucideIcon {
  if (score <= 2) return Frown;
  if (score <= 4) return Annoyed;
  if (score <= 6) return Meh;
  if (score <= 8) return Smile;
  return Laugh;
}

const LOW_TIPS = [
  "Take 3 slow, deep breaths.",
  "Step outside for 5 minutes of fresh air.",
  "Do one tiny task — a quick, easy win.",
  "Message someone you like.",
  "Drink some water and stretch.",
];

export function MoodCheckin() {
  const [mounted, setMounted] = React.useState(false);
  const [score, setScore] = React.useState(7);
  const [checkedIn, setCheckedIn] = React.useState(false);
  const [week, setWeek] = React.useState<(number | null)[]>([]);

  const loadWeek = React.useCallback(() => {
    const days: (number | null)[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const v = localStorage.getItem(KEY_PREFIX + ymd(d));
      days.push(v ? Number(v) : null);
    }
    setWeek(days);
  }, []);

  React.useEffect(() => {
    setMounted(true);
    const todayVal = localStorage.getItem(KEY_PREFIX + ymd(new Date()));
    if (todayVal) {
      setScore(Number(todayVal));
      setCheckedIn(true);
    }
    loadWeek();
  }, [loadWeek]);

  function checkIn() {
    localStorage.setItem(KEY_PREFIX + ymd(new Date()), String(score));
    setCheckedIn(true);
    loadWeek();
  }

  const recorded = week.filter((n): n is number => n != null);
  const average = recorded.length
    ? Math.round((recorded.reduce((a, b) => a + b, 0) / recorded.length) * 10) / 10
    : null;

  if (!mounted) return <Card className="h-48 animate-pulse" />;

  const low = score < 5;
  const MoodIcon = moodIconFor(score);

  return (
    <div className="space-y-5">
      {/* Slider check-in */}
      <Card>
        <CardContent className="space-y-5 py-8 text-center">
          <MoodIcon className="mx-auto size-14 text-primary" strokeWidth={1.5} />
          <p className="text-lg font-semibold">How are you feeling today?</p>
          <div className="px-2">
            <input
              type="range"
              min={1}
              max={10}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>1 · rough</span>
              <span className="text-base font-semibold text-foreground">{score}</span>
              <span>great · 10</span>
            </div>
          </div>
          <Button onClick={checkIn} className="px-8">
            {checkedIn ? "Update today" : "Check in"}
          </Button>
        </CardContent>
      </Card>

      {/* Result after checking in */}
      {checkedIn &&
        (low ? (
          <Card className="border-amber-200/70 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/5">
            <CardContent className="space-y-3 pt-6">
              <p className="font-semibold">Sounds like a tough one.</p>
              <p className="text-sm text-muted-foreground">
                A few small things that might help your day:
              </p>
              <ul className="space-y-2">
                {LOW_TIPS.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-sm">
                    <Sparkles className="size-4 shrink-0 text-amber-500" />
                    {t}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-2">
                <Link href="/mindfulness">
                  <Flower2 className="size-4" /> Take a mindful moment
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Glad you&apos;re doing alright!
                </p>
                <p className="text-sm text-muted-foreground">
                  Have a good one — your day&apos;s waiting.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/today">
                  Back to my day <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

      {/* Your week */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Your week</p>
            {average != null && (
              <p className="text-sm text-muted-foreground">
                avg <span className="font-semibold text-foreground">{average}</span>/10
              </p>
            )}
          </div>
          <div className="mt-4 flex items-end justify-between gap-1.5">
            {week.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      v == null ? "bg-muted" : "bg-primary",
                    )}
                    style={{ height: v == null ? "4px" : `${(v / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {["S", "M", "T", "W", "T", "F", "S"][
                    new Date(Date.now() - (6 - i) * 86400000).getDay()
                  ]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
