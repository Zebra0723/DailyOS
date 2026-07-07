"use client";

// Browser-side Web Push helpers: feature detection, opt-in (subscribe) and
// opt-out (unsubscribe). The heavy lifting (encrypting + sending) happens on the
// server; here we just register a subscription with the browser's push service
// and hand the resulting keys to our server action to store.

import {
  savePushSubscription,
  deletePushSubscription,
} from "@/app/(app)/settings/push-actions";

/** The VAPID public key, exposed to the client at build time. */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushSupport =
  | "ready" // everything present — we can ask for permission
  | "unconfigured" // no VAPID key set on the server yet
  | "unsupported" // browser has no Push API
  | "needs-install"; // iOS Safari: only works once added to the home screen

/** What, if anything, is standing between this device and push. */
export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "unconfigured";
  const hasApi =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  if (!hasApi) {
    // iOS gained Push API support in 16.4 — but only for installed PWAs. If it's
    // an iPhone/iPad without the API, the likely fix is "add to home screen".
    if (isIos() && !isStandalone()) return "needs-install";
    return "unsupported";
  }
  if (isIos() && !isStandalone()) return "needs-install";
  return "ready";
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac; detect the touch screen instead.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS-specific standalone flag.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** The browser's current Notification permission, or "default" if unavailable. */
export function notificationPermission(): NotificationPermission {
  if (typeof Notification === "undefined") return "default";
  return Notification.permission;
}

/** True if this device already has an active push subscription. */
export async function isSubscribed(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Ask for permission and subscribe this device to push. Resolves to an outcome
 * so the UI can explain what happened. Stores the subscription server-side.
 */
export async function enablePush(): Promise<
  "subscribed" | "denied" | "unsupported" | "error"
> {
  const support = pushSupport();
  if (support !== "ready") return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY,
        ) as BufferSource,
      });
    }

    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "error";
    const res = await savePushSubscription({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
    return res.ok ? "subscribed" : "error";
  } catch {
    return "error";
  }
}

/** Unsubscribe this device and forget it server-side. */
export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      await deletePushSubscription(endpoint).catch(() => {});
    }
  } catch {
    /* best effort */
  }
}
