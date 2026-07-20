"use client";

import * as React from "react";

/** Registers the service worker so the pitch site is installable as a PWA. */
export function PwaRegister() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore — the site still works without it */
      });
    }
  }, []);
  return null;
}
