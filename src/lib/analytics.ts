// Ad-network conversion tracking, all client-side and best-effort. Each call
// no-ops unless the matching pixel is loaded (i.e. its env var is set), so this
// is safe to call unconditionally and costs nothing when ads aren't running.

type Spdt = (event: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    spdt?: Spdt;
  }
}

/**
 * Fire a "signup" conversion to every configured ad pixel. Call once, right
 * after a successful account creation, so cost-per-signup and retargeting/
 * lookalike audiences work. Add Meta (fbq) / TikTok (ttq) / Google (gtag) here
 * the same way when those pixels are added.
 */
export function trackSignupConversion(): void {
  if (typeof window === "undefined") return;
  try {
    window.spdt?.("conversion", { type: "signup" });
  } catch {
    /* a pixel error must never break signup */
  }
}
