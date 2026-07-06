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
