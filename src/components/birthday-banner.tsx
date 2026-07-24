"use client";

import * as React from "react";
import { X } from "lucide-react";

// A one-off celebration banner. Flip SHOW to false (or remove the
// <BirthdayBanner /> mount in the app layout) once the day is over.
const SHOW = true;
const KEY = "dailyos-arjun-bday-2026";

export function BirthdayBanner() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (!SHOW) return;
    try {
      if (localStorage.getItem(KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(90deg,#bf502b,#e0864f,#f2b705,#e0864f,#bf502b)",
      }}
    >
      <div className="relative flex items-center justify-center gap-2 px-10 py-3.5 text-center sm:gap-4 sm:py-4">
        <span className="animate-bounce text-2xl sm:text-3xl" aria-hidden="true">
          🎉🎂🎈
        </span>
        <p className="text-sm font-extrabold uppercase tracking-wide text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] sm:text-base md:text-lg">
          Co-founder, Arjun Jain, is celebrating his birthday today!
        </p>
        <span className="hidden animate-bounce text-2xl sm:inline sm:text-3xl" aria-hidden="true">
          🎈🎂🎉
        </span>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/85 transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
