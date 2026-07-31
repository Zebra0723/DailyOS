"use client";

import * as React from "react";
import { X } from "lucide-react";

function keyFor(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `dailyos-ann:${h}`;
}

export function AnnouncementBanner({ text }: { text: string }) {
  const [hidden, setHidden] = React.useState(true);
  React.useEffect(() => {
    try {
      setHidden(localStorage.getItem(keyFor(text)) === "1");
    } catch {
      setHidden(false);
    }
  }, [text]);
  if (hidden || !text) return null;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #E0864F 0%, #9A3412 60%, #7C2D12 100%)",
      }}
    >
      {/* Decorative circles */}
      <div
        className="pointer-events-none absolute -left-8 -top-8 size-32 rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 size-24 rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto flex max-w-3xl items-center gap-4 px-5 py-5 pr-12 sm:py-6">
        {/* Brand glyph */}
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm sm:size-12">
          <svg viewBox="0 0 24 24" className="size-6 sm:size-7" aria-hidden="true">
            <g
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
              <path d="M8.5 12.2l2.4 2.4 4.6-5.4" strokeWidth="2.4" />
            </g>
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
            DailyOS
          </p>
          <p className="mt-0.5 text-base font-bold leading-snug text-white sm:text-lg">
            {text}
          </p>
        </div>
      </div>

      <button
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(keyFor(text), "1");
          } catch {}
          setHidden(true);
        }}
        className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
