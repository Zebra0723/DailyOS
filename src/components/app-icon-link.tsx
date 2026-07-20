"use client";

import * as React from "react";

// A per-DEVICE custom home-screen icon. The chosen image lives only in this
// device's localStorage; we inject it as the apple-touch-icon <link> so iOS
// uses it when DailyOS is added to the home screen. Nothing is sent to a server.
export const APPICON_LS_KEY = "dailyos-appicon";
export const APPICON_EVENT = "dailyos-appicon-changed";

function applyIcon(dataUrl: string | null) {
  if (typeof document === "undefined") return;
  const head = document.head;
  const existing = Array.from(
    head.querySelectorAll('link[rel="apple-touch-icon"]'),
  ) as HTMLLinkElement[];

  if (dataUrl) {
    existing.forEach((l) => l.remove());
    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.setAttribute("sizes", "180x180");
    link.href = dataUrl;
    head.appendChild(link);
  } else if (!existing.some((l) => l.href.includes("/apple-icon"))) {
    // Revert to the default generated icon.
    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.href = "/apple-icon";
    head.appendChild(link);
  }
}

export function AppIconLink() {
  React.useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(APPICON_LS_KEY);
    } catch {
      /* ignore */
    }
    if (saved) applyIcon(saved);
    const onChange = (e: Event) =>
      applyIcon((e as CustomEvent<string | null>).detail ?? null);
    window.addEventListener(APPICON_EVENT, onChange as EventListener);
    return () =>
      window.removeEventListener(APPICON_EVENT, onChange as EventListener);
  }, []);
  return null;
}
