"use client";

import * as React from "react";
import { APP_VERSION } from "@/lib/version";

// Keeps the installed PWA current. iOS keeps a PWA's web view frozen and resumes
// the old page instead of reloading, so a new deploy can go unseen for ages —
// this is why a bookmarked/home-screen app can sit on an old version forever.
// On open, on refocus, and on a slow poll while open, we ask the server for the
// live version; if it differs from the one baked into this bundle, we purge
// caches and hard-reload so the newest build loads.
//
// IMPORTANT: we debounce reloads by TIME, not by a permanent per-version flag.
// The old code set a per-version flag and never retried — so if a single reload
// got interrupted (a momentary blip, or the worker serving the cached page), the
// app was stranded on the old version FOREVER, since sessionStorage survives the
// long-lived frozen PWA process on iOS. A short time window still stops a tight
// reload loop, but lets a failed update try again seconds later.
const ATTEMPT_KEY = "dailyos-update-attempt";
const RETRY_AFTER_MS = 20_000;

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

        // Time-based debounce: don't hammer reloads, but never give up either.
        const last = Number(sessionStorage.getItem(ATTEMPT_KEY) || 0);
        if (last && Date.now() - last < RETRY_AFTER_MS) return;
        sessionStorage.setItem(ATTEMPT_KEY, String(Date.now()));

        // Nuclear update: unregister every service worker so no stale SW can
        // intercept the reload, purge the Cache API, then navigate (not reload)
        // with a cache-busting param to bypass the browser's HTTP cache too.
        try {
          const regs = await navigator.serviceWorker?.getRegistrations?.();
          if (regs) await Promise.all(regs.map((r) => r.unregister()));
        } catch { /* best effort */ }
        try {
          if (window.caches) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch { /* best effort */ }
        const url = new URL(window.location.href);
        url.searchParams.set("_v", Date.now().toString(36));
        window.location.replace(url.toString());
      } catch {
        /* offline or transient — try again next time */
      } finally {
        checking = false;
      }
    }

    void check();
    const onWake = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    // Also poll slowly while the app stays open, so a deploy shipped mid-session
    // is picked up without needing a reopen.
    const iv = window.setInterval(() => void check(), 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
      window.clearInterval(iv);
    };
  }, []);

  return null;
}
