"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const ACCENT = "#bf502b";

/** Small client control that periodically calls router.refresh() to re-pull
 *  server data. Off by default. Shows a "last updated" relative time. */
export function AutoRefresh({ intervalSec = 30 }: { intervalSec?: number }) {
  const router = useRouter();
  const [on, setOn] = React.useState(false);
  const [last, setLast] = React.useState<number>(() => Date.now());
  // tick forces a re-render so the "updated Xs ago" label stays current.
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      router.refresh();
      setLast(Date.now());
    }, Math.max(5, intervalSec) * 1000);
    return () => clearInterval(id);
  }, [on, intervalSec, router]);

  React.useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const secsAgo = Math.max(0, Math.round((Date.now() - last) / 1000));
  const ago =
    secsAgo < 60 ? `${secsAgo}s ago` : `${Math.round(secsAgo / 60)}m ago`;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#e6ded2] bg-[#fffdf9] px-3 py-1.5 text-xs">
      <RefreshCw
        className={`size-3.5 ${on ? "animate-spin" : ""}`}
        style={{ color: ACCENT, animationDuration: "3s" }}
      />
      <span className="hidden text-[#6b6157] sm:inline">
        Updated {ago}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Auto-refresh"
        title={on ? `Auto-refresh every ${intervalSec}s` : "Auto-refresh off"}
        onClick={() => {
          const n = !on;
          setOn(n);
          if (n) {
            router.refresh();
            setLast(Date.now());
          }
        }}
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ background: on ? ACCENT : "#d9d2c6" }}
      >
        <span
          className="absolute top-0.5 size-4 rounded-full bg-white shadow transition-all"
          style={{ left: on ? "1.125rem" : "0.125rem" }}
        />
      </button>
      <span className="font-medium text-[#4b443b]">{on ? "Auto" : "Manual"}</span>
    </div>
  );
}
