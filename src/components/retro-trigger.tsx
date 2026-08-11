"use client";

import * as React from "react";
import { Timer } from "lucide-react";
import { useRetroMode } from "@/components/retro-mode";

export function RetroTrigger() {
  const { active, toggle } = useRetroMode();
  const [taps, setTaps] = React.useState(0);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  function handleTap() {
    if (active) {
      toggle();
      return;
    }
    clearTimeout(timer.current);
    const next = taps + 1;
    setTaps(next);
    if (next >= 5) {
      setTaps(0);
      toggle();
      return;
    }
    timer.current = setTimeout(() => setTaps(0), 2000);
  }

  return (
    <div
      onClick={handleTap}
      className="flex cursor-pointer select-none items-center justify-center gap-2 pt-1 text-xs text-muted-foreground transition-colors hover:text-foreground/50"
    >
      <Timer className="size-3" />
      {active ? (
        <span>Exit time machine</span>
      ) : taps > 0 ? (
        <span>{"· ".repeat(taps).trim()}</span>
      ) : (
        <span className="opacity-0 hover:opacity-100 transition-opacity">v1.0</span>
      )}
    </div>
  );
}
