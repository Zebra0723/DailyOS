"use client";

import * as React from "react";
import { APP_VERSION } from "@/lib/version";

export function VersionTap() {
  const [taps, setTaps] = React.useState(0);
  const [updating, setUpdating] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  function handleTap() {
    clearTimeout(timer.current);
    const next = taps + 1;
    setTaps(next);
    if (next >= 3) {
      forceUpdate();
      return;
    }
    timer.current = setTimeout(() => setTaps(0), 1500);
  }

  async function forceUpdate() {
    setUpdating(true);
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      if (regs) await Promise.all(regs.map((r) => r.unregister()));
    } catch {}
    try {
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString(36));
    window.location.replace(url.toString());
  }

  return (
    <p
      className="cursor-pointer select-none pt-2 text-center text-xs text-muted-foreground"
      onClick={handleTap}
    >
      {updating ? "Updating…" : `DailyOS · ${APP_VERSION}`}
      {taps > 0 && !updating && (
        <span className="ml-1 text-primary">
          {taps === 1 ? "·" : "· ·"}
        </span>
      )}
    </p>
  );
}
