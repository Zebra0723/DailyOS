"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Force the installed PWA to pull the latest build: clear caches, refresh the
 *  service worker, then hard-reload. Same purge the VersionGuard does on a new
 *  deploy — but on demand, for when something looks stale. */
export function RefreshAppButton() {
  const [busy, setBusy] = React.useState(false);

  async function refresh() {
    setBusy(true);
    try {
      if (typeof window !== "undefined" && window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      if (regs) await Promise.all(regs.map((r) => r.update()));
    } catch {
      /* best effort — reload regardless */
    }
    // Bypass the bfcache/HTTP cache so the freshest build loads.
    window.location.reload();
  }

  return (
    <Button variant="outline" onClick={refresh} loading={busy}>
      <RefreshCw className="size-4" /> Refresh app
    </Button>
  );
}
