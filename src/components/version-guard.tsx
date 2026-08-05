"use client";

import * as React from "react";
import { APP_VERSION } from "@/lib/version";

const ATTEMPT_KEY = "dailyos-update-attempt";
const ATTEMPT_COUNT_KEY = "dailyos-update-count";
const RETRY_AFTER_MS = 10_000;
const MAX_ATTEMPTS = 10;

export function VersionGuard() {
  React.useEffect(() => {
    let checking = false;

    async function check() {
      if (checking) return;
      checking = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version } = (await res.json()) as { version?: string };
        if (!version || version === APP_VERSION) {
          sessionStorage.removeItem(ATTEMPT_KEY);
          sessionStorage.removeItem(ATTEMPT_COUNT_KEY);
          return;
        }

        const last = Number(sessionStorage.getItem(ATTEMPT_KEY) || 0);
        if (last && Date.now() - last < RETRY_AFTER_MS) return;

        const count = Number(sessionStorage.getItem(ATTEMPT_COUNT_KEY) || 0);
        if (count >= MAX_ATTEMPTS) return;

        sessionStorage.setItem(ATTEMPT_KEY, String(Date.now()));
        sessionStorage.setItem(ATTEMPT_COUNT_KEY, String(count + 1));

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
      } catch {
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
