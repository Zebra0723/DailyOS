"use client";

import * as React from "react";
import { APP_VERSION } from "@/lib/version";

// Keeps the installed PWA current. iOS keeps a PWA's web view alive and resumes
// the old page instead of reloading, so a new deploy can go unseen for ages.
// On open (and when refocused), we ask the server for the live version; if it
// differs from the one baked into this bundle, we purge caches and hard-reload
// so the newest build loads. A per-version guard prevents reload loops.
export function VersionGuard() {
  React.useEffect(() => {
    let checking = false;

    async function check() {
      if (checking) return;
      checking = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version } = (await res.json()) as { version?: string };
        if (!version || version === APP_VERSION) return;

        const key = "dailyos-updated-" + version;
        if (sessionStorage.getItem(key)) return; // already tried for this version
        sessionStorage.setItem(key, "1");

        // Clear caches + refresh the worker so the reload is guaranteed fresh.
        try {
          if (window.caches) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          const regs = await navigator.serviceWorker?.getRegistrations?.();
          if (regs) await Promise.all(regs.map((r) => r.update()));
        } catch {
          /* best effort */
        }
        window.location.reload();
      } catch {
        /* offline or transient — try again next time */
      } finally {
        checking = false;
      }
    }

    void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return null;
}
