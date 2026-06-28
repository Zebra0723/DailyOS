"use client";

import * as React from "react";
import { Check } from "lucide-react";
import {
  CALM_BGS,
  BG_KEY,
  APPEARANCE_EVENT,
  applyAppearance,
} from "@/lib/calm";
import { cn } from "@/lib/utils";

export function CalmBackgroundPicker() {
  const [bg, setBg] = React.useState("none");

  React.useEffect(() => {
    setBg(localStorage.getItem(BG_KEY) ?? "none");
  }, []);

  function pick(key: string) {
    setBg(key);
    localStorage.setItem(BG_KEY, key);
    applyAppearance();
    window.dispatchEvent(new Event(APPEARANCE_EVENT));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Calm background</p>
      <div className="flex flex-wrap gap-2.5">
        {CALM_BGS.map((b) => {
          const selected = bg === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => pick(b.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-1.5 pr-3 transition-colors",
                selected
                  ? "border-primary ring-2 ring-primary/30"
                  : "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-lg",
                  b.key === "none" && "border",
                )}
                style={{ backgroundColor: b.key === "none" ? undefined : b.swatch }}
              >
                {selected && (
                  <Check
                    className={cn(
                      "size-4",
                      b.key === "none" ? "text-foreground" : "text-white",
                    )}
                  />
                )}
              </span>
              <span className="text-sm font-medium">{b.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        A gentle moving backdrop. Off by default; pick one to make it yours.
      </p>
    </div>
  );
}
