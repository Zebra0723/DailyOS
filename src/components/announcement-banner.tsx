"use client";

import * as React from "react";
import { Megaphone, X } from "lucide-react";

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
    <div className="relative bg-gradient-to-r from-primary to-primary/80 px-4 py-3.5 text-primary-foreground shadow-md sm:py-4">
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 pr-8">
        <Megaphone className="size-5 shrink-0 sm:size-6" />
        <p className="text-sm font-semibold leading-snug sm:text-base">
          {text}
        </p>
      </div>
      <button
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(keyFor(text), "1");
          } catch {}
          setHidden(true);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-80 transition-opacity hover:bg-primary-foreground/20 hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
