"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";

/**
 * A slim notice shown when the device goes offline, so it's clear why some
 * things (saving, syncing, AI, search) are paused. Pages already opened this
 * session keep working — the service worker serves them from cache. Renders
 * nothing while online.
 */
export function OfflineBanner() {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500/15 px-4 py-1.5 text-center text-xs font-medium text-amber-800 dark:text-amber-300">
      <WifiOff className="size-3.5 shrink-0" />
      You&apos;re offline — you can still browse what&apos;s loaded; changes
      won&apos;t save until you reconnect.
    </div>
  );
}
