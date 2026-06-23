"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { THEMES, DEFAULT_THEME_KEY } from "@/lib/themes";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dailyos-theme";

export function ThemeSwitcher() {
  const [active, setActive] = React.useState<string>(DEFAULT_THEME_KEY);

  React.useEffect(() => {
    setActive(localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_KEY);
  }, []);

  function apply(key: string) {
    const theme = THEMES.find((t) => t.key === key);
    if (!theme) return;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(theme.vars)) {
      root.style.setProperty(k, v);
    }
    localStorage.setItem(STORAGE_KEY, key);
    setActive(key);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {THEMES.map((t) => {
        const selected = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => apply(t.key)}
            title={t.label}
            aria-label={t.label}
            aria-pressed={selected}
            className={cn(
              "grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-105",
              selected && "ring-2 ring-foreground",
            )}
            style={{ backgroundColor: t.swatch }}
          >
            {selected && <Check className="size-4 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
