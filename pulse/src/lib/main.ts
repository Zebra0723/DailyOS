import "server-only";

// The live DailyOS app Pulse watches over.
export const MAIN_APP_URL =
  process.env.MAIN_APP_URL || "https://daily-os-lac.vercel.app";

export function cronConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET);
}

/** Fetch the deployed app version (via /api/version). */
export async function fetchVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/version`, { cache: "no-store" });
    if (!res.ok) return null;
    const { version } = (await res.json()) as { version?: string };
    return version ?? null;
  } catch {
    return null;
  }
}

/** Fire the reminder/broadcast cron on demand. */
export async function runCron(): Promise<{ ok: boolean; status?: number; error?: string }> {
  const secret = process.env.CRON_SECRET;
  const url = secret
    ? `${MAIN_APP_URL}/api/push/run?key=${encodeURIComponent(secret)}`
    : `${MAIN_APP_URL}/api/push/run`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
