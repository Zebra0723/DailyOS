"use client";

import * as React from "react";
import { syncSubscription } from "@/lib/push";

export function PwaRegister() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // If we just landed from a VersionGuard nuclear update (_v param in URL),
    // we're already on the fresh build. Clean the param and skip the
    // controllerchange reload — otherwise users see two flashes.
    const params = new URLSearchParams(window.location.search);
    const justUpdated = params.has("_v");
    if (justUpdated) {
      params.delete("_v");
      const qs = params.toString();
      const clean =
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
      window.history.replaceState(null, "", clean);
    }

    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded || justUpdated) return;
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
          reg.update().catch(() => {});
        })
        .catch(() => {});
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
