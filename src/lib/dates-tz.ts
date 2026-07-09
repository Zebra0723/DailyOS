// Calendar-correct date helpers that don't drift by timezone and respect month
// lengths + leap years. Dates here are bare "YYYY-MM-DD" calendar days (the same
// shape as a task's due_date), computed in a specific timezone where it matters.

/** The calendar day (YYYY-MM-DD) for an instant, in the given IANA timezone. */
export function ymdInTz(date: Date, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value;
    const y = get("year");
    const m = get("month");
    const d = get("day");
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    /* invalid timezone — fall back to UTC below */
  }
  return date.toISOString().slice(0, 10);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ---- Floating event times ---------------------------------------------------
// Event times are stored as "floating" wall-clock: the time you picked, kept
// literally, so a 2pm event still reads 2pm after you travel to another
// timezone. We store the wall-clock as a UTC-literal ("...T14:00:00Z") and
// always render/compare it in UTC, so no timezone conversion ever shifts it.

/** A datetime-local value ("YYYY-MM-DDTHH:MM") → the stored floating form. */
export function wallClockToStored(localInput: string): string {
  return `${localInput.slice(0, 16)}:00Z`;
}

/**
 * Normalize ANY event time we might receive — a datetime-local value, a full ISO
 * (with or without Z, an offset, or milliseconds), or a bare date — into our
 * stored floating form "YYYY-MM-DDTHH:MM:00Z". A missing time defaults to 09:00.
 * Returns null when there isn't even a valid date, so a malformed value can never
 * become a broken timestamp that fails the insert (dropping the event) or hides
 * it from the calendar. Use this whenever the source of the string is uncertain
 * (e.g. AI-suggested inbox events).
 */
export function normalizeEventTime(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const m = String(value)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, hh, mi] = m;
  return `${y}-${mo}-${d}T${hh ?? "09"}:${mi ?? "00"}:00Z`;
}

/** A stored floating time → the "YYYY-MM-DDTHH:MM" a datetime-local input wants. */
export function storedToInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

/** "Now" as a floating time in the user's timezone, comparable to stored event
 *  times (e.g. to decide what's still upcoming). */
export function nowFloatingInTz(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const g = (t: string) => parts.find((p) => p.type === t)?.value;
    const y = g("year");
    const mo = g("month");
    const d = g("day");
    let h = g("hour");
    const mi = g("minute");
    const s = g("second");
    if (h === "24") h = "00"; // some engines report midnight as 24
    if (y && mo && d && h && mi && s) return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  } catch {
    /* invalid tz — fall back to real UTC now */
  }
  return new Date().toISOString();
}

/** Add whole days to a YYYY-MM-DD, rolling over months/years correctly. */
export function addDaysYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/**
 * Add whole months to a YYYY-MM-DD, clamping to the end of the target month so
 * Jan 31 + 1 month → Feb 28 (or Feb 29 in a leap year), never spilling into
 * March.
 */
export function addMonthsYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, 1));
  base.setUTCMonth(base.getUTCMonth() + n);
  const yy = base.getUTCFullYear();
  const mm = base.getUTCMonth();
  // Day 0 of next month = last day of this month (leap-year aware).
  const lastDay = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
  return `${yy}-${pad(mm + 1)}-${pad(Math.min(d, lastDay))}`;
}
