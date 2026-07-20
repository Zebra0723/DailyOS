"use client";

import * as React from "react";
import { Sunrise } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";

/**
 * Opt in/out of the morning brief — a single push at ~7am (your timezone)
 * summarising the day's events and tasks. Stored in user_state.prefs so the
 * scheduled job can read it. Defaults ON; only sends on days with something.
 */
export function DailyBriefToggle() {
  const [prefs, setPrefs] = React.useState<Record<string, unknown> | null>(null);
  // Default ON until we've loaded the saved value.
  const on = prefs ? (prefs as { dailyBrief?: boolean }).dailyBrief !== false : true;

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      const p = (await loadRemote<Record<string, unknown>>("prefs")) ?? {};
      if (alive) setPrefs(p);
    })();
    return () => {
      alive = false;
    };
  }, []);

  function toggle() {
    const next = { ...(prefs ?? {}), dailyBrief: !on };
    setPrefs(next);
    void saveRemote("prefs", next);
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="flex items-start gap-2.5">
        <Sunrise className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">Morning brief</p>
          <p className="text-xs text-muted-foreground">
            A 7am summary of your day — only on days with events or tasks.
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Morning brief"
        onClick={toggle}
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
          (on ? "bg-primary" : "bg-muted")
        }
      >
        <span
          className={
            "absolute top-0.5 size-5 rounded-full bg-background shadow transition-all " +
            (on ? "left-[1.375rem]" : "left-0.5")
          }
        />
      </button>
    </div>
  );
}
