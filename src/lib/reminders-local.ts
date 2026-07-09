// ----------------------------------------------------------------------------
// Pure helpers for the local (in-browser) reminder fallback. Kept free of any
// browser or server APIs so they can be unit-tested directly.
//
// The idea: while the app is open, schedule OS notifications for your timed
// event reminders straight from the browser — so reminders still arrive even
// when server push isn't configured or the cron is misfiring. The component in
// components/local-reminders.tsx wires these into real timers + notifications.
// ----------------------------------------------------------------------------

export interface UpcomingReminder {
  id: string;
  title: string;
  /** Absolute ISO instant the reminder should fire. */
  remind_at: string;
  /** Floating wall-clock start time (for the "— 14:30" label). */
  start_time: string | null;
}

/** How far ahead we schedule local reminders. Anything beyond this waits for a
 *  later refresh (or server push). */
export const LOCAL_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
/** setTimeout can't take a delay larger than a signed 32-bit int. */
export const MAX_TIMEOUT_MS = 2_147_483_647;
/** Fire reminders up to this late (e.g. app opened just after the instant). */
export const GRACE_MS = 60_000;

/**
 * Which reminders are worth scheduling right now: those whose fire instant sits
 * within [now - grace, now + window]. Ones long past (beyond the grace) are
 * dropped — too late to be useful, and server push covers the closed-app case.
 */
export function schedulable(
  reminders: UpcomingReminder[],
  now: number,
  windowMs: number = LOCAL_WINDOW_MS,
  graceMs: number = GRACE_MS,
): UpcomingReminder[] {
  return reminders.filter((r) => {
    const t = Date.parse(r.remind_at);
    if (!Number.isFinite(t)) return false;
    return t >= now - graceMs && t <= now + windowMs;
  });
}

/** Delay in ms before a reminder should fire, clamped to [0, setTimeout max]. */
export function fireDelayMs(remindAtIso: string, now: number): number {
  const t = Date.parse(remindAtIso);
  if (!Number.isFinite(t)) return 0;
  return Math.min(Math.max(t - now, 0), MAX_TIMEOUT_MS);
}

/** Short wall-clock label like "14:30" from a floating stored start time. */
export function eventTimeLabel(startTime: string | null): string {
  if (!startTime || startTime.length < 16) return "";
  return startTime.slice(11, 16);
}

/** The notification body: title, plus the start time when we have one. */
export function reminderBody(title: string, startTime: string | null): string {
  const label = eventTimeLabel(startTime);
  return label ? `${title} — ${label}` : title;
}

/** Stable key that identifies one reminder instant, so we fire it at most once
 *  even across reloads. Includes remind_at so editing the time re-arms it. */
export function reminderKey(id: string, remindAtIso: string): string {
  return `dailyos-localrem:${id}:${remindAtIso}`;
}
