"use client";

import * as React from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { APPICON_LS_KEY, APPICON_EVENT } from "@/components/app-icon-link";

function DefaultIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#D62828" />
      <g
        transform="translate(12 12)"
        fill="none"
        stroke="#fffdf9"
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
  );
}

export function AppIconUploader() {
  const { toast } = useToast();
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    const read = () => {
      try {
        setSrc(localStorage.getItem(APPICON_LS_KEY));
      } catch {
        /* ignore */
      }
    };
    read();
    const onChange = (e: Event) =>
      setSrc((e as CustomEvent<string | null>).detail ?? null);
    window.addEventListener(APPICON_EVENT, onChange as EventListener);
    return () =>
      window.removeEventListener(APPICON_EVENT, onChange as EventListener);
  }, []);

  function reset() {
    setSrc(null);
    try {
      localStorage.removeItem(APPICON_LS_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(APPICON_EVENT, { detail: null }));
    toast({ variant: "info", title: "Back to the default icon" });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="size-16 shrink-0">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Your app icon" className="size-16 rounded-2xl object-cover" />
          ) : (
            <DefaultIcon className="size-16 rounded-2xl" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Home-screen icon</p>
          <p className="text-xs text-muted-foreground">
            {src
              ? "A custom icon is set on this device."
              : "Using the default DailyOS icon."}
          </p>
          {src && (
            <div className="mt-2">
              <Button size="sm" variant="ghost" onClick={reset}>
                Reset to default
              </Button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Your phone caches the icon when you install, so remove DailyOS from the
        home screen and add it again to see any change.
      </p>
    </div>
  );
}
