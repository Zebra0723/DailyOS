"use client";

import * as React from "react";
import { syncSubscription } from "@/lib/push";
import { APP_VERSION } from "@/lib/version";

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
      // Register with the build version in the URL. The worker's bytes are the
      // same file every deploy, so a plain /sw.js never looks "changed" and the
      // browser skips the update. A versioned URL changes each deploy → the
      // browser installs the new worker → it activates and claims the page →
      // controllerchange fires → we reload once onto the fresh build.
      navigator.serviceWorker
        .register(`/sw.js?v=${encodeURIComponent(APP_VERSION)}`)
        .then((reg) => {
          // Check for an updated worker on every load so fixes roll out fast.
          reg.update().catch(() => {});
        })
        .catch(() => {
          /* offline is a progressive enhancement — ignore failures */
        });
      // Heal any push-subscription drift: browsers/push services can rotate a
      // subscription's endpoint out from under us, so re-save the live one to
      // the server on every load. No-op if this device never opted in. This is
      // what stops "notifications are on" but a test finding "no active device".
      void syncSubscription();
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
