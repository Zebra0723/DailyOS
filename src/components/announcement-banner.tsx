"use client";

import * as React from "react";
import { Megaphone, X } from "lucide-react";

function keyFor(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `dailyos-ann:${h}`;
}

/** A dismissible app-wide announcement set by an admin. Hidden once dismissed
 *  (per message), and re-appears if the admin changes the text. */
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
    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 text-center text-sm font-medium text-primary">
      <Megaphone className="size-4 shrink-0" />
      <span className="flex-1">{text}</span>
      <button
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(keyFor(text), "1");
          } catch {
            /* ignore */
          }
          setHidden(true);
        }}
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
