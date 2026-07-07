"use client";

import * as React from "react";

/** Registers the service worker (production only) so DailyOS works offline and
 *  feels like a real installed app. Renders nothing. */
export function PwaRegister() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // When a new worker takes control, reload once so the fixed version (and any
    // cache purge it does) actually applies — this is how a fix reaches an
    // already-installed app without a manual reinstall.
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for an updated worker on every load so fixes roll out fast.
          reg.update().catch(() => {});
        })
        .catch(() => {
          /* offline is a progressive enhancement — ignore failures */
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);
  return null;
}
