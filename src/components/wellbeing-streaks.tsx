"use client";

import * as React from "react";
import { Flame, Flower2, SmilePlus, ListChecks } from "lucide-react";
import { mindfulStreak, moodStreak, nudgesStreak } from "@/lib/streaks";
import { cn } from "@/lib/utils";

/** A row of wellbeing streaks — a gentle nudge to keep small habits going.
 *  Reads the same per-day storage the wellbeing pages already write. */
export function WellbeingStreaks() {
  const [streaks, setStreaks] = React.useState<{
    mindful: number;
    mood: number;
    nudges: number;
  } | null>(null);

  React.useEffect(() => {
    const read = () =>
      setStreaks({
        mindful: mindfulStreak(),
        mood: moodStreak(),
        nudges: nudgesStreak(),
      });
    read();
    window.addEventListener("focus", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("focus", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  // Avoid a hydration flash before localStorage is read.
  if (!streaks) return null;

  const best = Math.max(streaks.mindful, streaks.mood, streaks.nudges);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Flame className="size-4 text-primary" />
        <h2 className="text-sm font-medium">Your streaks</h2>
        {best > 0 && (
          <span className="text-xs text-muted-foreground">
            Keep the small things going.
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <StreakTile icon={Flower2} label="Mindful" days={streaks.mindful} />
        <StreakTile icon={SmilePlus} label="Mood" days={streaks.mood} />
        <StreakTile icon={ListChecks} label="Nudges" days={streaks.nudges} />
      </div>
    </div>
  );
}

function StreakTile({
  icon: Icon,
  label,
  days,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  days: number;
}) {
  const active = days > 0;
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-center",
        active
          ? "border-primary/30 bg-primary/5"
          : "bg-card text-muted-foreground",
      )}
    >
      <Icon
        className={cn(
          "mx-auto size-5",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <div className="mt-2 flex items-center justify-center gap-1">
        <span className="text-2xl font-bold tracking-tight">{days}</span>
        {active && <Flame className="size-4 text-amber-500" />}
      </div>
      <div className="text-xs">
        {label} · day{days === 1 ? "" : "s"}
      </div>
    </div>
  );
}
