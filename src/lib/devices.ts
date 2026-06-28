// ----------------------------------------------------------------------------
// Per-plan device limits. Each browser gets a stable device id (kept in
// localStorage) that we register against the user's account metadata. Free
// accounts are capped at one device; Pro is unlimited. This is honest-user
// enforcement (the same altitude as the rest of our plan gating) — a real,
// un-bypassable limit would need a billing backend and server-side session
// revocation, which we don't have yet.
// ----------------------------------------------------------------------------

export const DEVICE_ID_KEY = "dailyos-device-id";

/** How many devices each plan may be signed in on. */
export const DEVICE_LIMITS = { free: 1, pro: Infinity } as const;

export interface DeviceRecord {
  id: string;
  label: string;
  lastSeen: string; // ISO date
}

/** Read this browser's device id, creating one the first time. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev-${Math.random().toString(36).slice(2)}-${new Date().getTime()}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/** A friendly, best-effort name for this device from the user agent. */
export function deviceLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;

  let os = "Device";
  if (/iphone/i.test(ua)) os = "iPhone";
  else if (/ipad/i.test(ua)) os = "iPad";
  else if (/android/i.test(ua)) os = "Android";
  else if (/mac os x/i.test(ua)) os = "Mac";
  else if (/windows/i.test(ua)) os = "Windows PC";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  return browser ? `${os} · ${browser}` : os;
}
