// How long a login survives before DailyOS makes you sign in again.
//
// The Supabase session cookie would otherwise refresh forever, keeping you
// logged in on a device indefinitely. We bound that with an absolute deadline
// stamped at login time and enforced in middleware:
//
//   • "Remember me" ticked  → 4 weeks, then you're logged out.
//   • left unticked         → 3 days,  then you're logged out.
//
// The deadline lives in a plain cookie (readable by middleware) whose own
// Max-Age matches, so the browser also drops it exactly when it lapses.

export const SESSION_DEADLINE_COOKIE = "dailyos-session-deadline";

export const REMEMBER_DAYS = 28; // "Remember me" → 4 weeks
export const SESSION_DAYS = 3; //   default      → 3 days

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionMaxAgeSeconds(remember: boolean): number {
  return (remember ? REMEMBER_DAYS : SESSION_DAYS) * 24 * 60 * 60;
}

export function deadlineFromNow(remember: boolean, now: number): number {
  return now + (remember ? REMEMBER_DAYS : SESSION_DAYS) * DAY_MS;
}

/** A session is expired if the cookie is missing, unparseable, or in the past. */
export function isSessionExpired(
  cookieValue: string | undefined,
  now: number,
): boolean {
  if (!cookieValue) return true;
  const deadline = Number(cookieValue);
  return !Number.isFinite(deadline) || deadline < now;
}

/**
 * Client-only: stamp the session deadline immediately after a successful login
 * or signup. Called before the hard navigation into the app so the very next
 * request carries it.
 */
export function markSessionStart(remember: boolean): void {
  if (typeof document === "undefined") return;
  const maxAge = sessionMaxAgeSeconds(remember);
  const deadline = deadlineFromNow(remember, Date.now());
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${SESSION_DEADLINE_COOKIE}=${deadline}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}
