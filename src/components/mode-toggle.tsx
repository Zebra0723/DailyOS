"use client";

import * as React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODE_KEY, APPEARANCE_EVENT, applyAppearance } from "@/lib/calm";

const MODES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const;

export function ModeToggle() {
  const [mode, setMode] = React.useState<string>("system");

  React.useEffect(() => {
    setMode(localStorage.getItem(MODE_KEY) ?? "system");
  }, []);

  function pick(next: string) {
    setMode(next);
    localStorage.setItem(MODE_KEY, next);
    applyAppearance();
    window.dispatchEvent(new Event(APPEARANCE_EVENT));
  }

  return (
    <div className="inline-flex rounded-xl border bg-muted/60 p-1">
      {MODES.map((m) => {
        const active = mode === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => pick(m.key)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <m.icon className="size-4" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
