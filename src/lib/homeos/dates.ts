// Date helpers for HomeOS. All dates are stored as ISO strings (or undefined).

export function safeParseDate(value?: string | null): Date | null {
  if (!value) return null;
  // A bare date ("YYYY-MM-DD") is parsed as UTC midnight by `new Date`, which
  // can land on the previous/next calendar day in a non-UTC timezone. Pin it to
  // local midnight so day counts and formatting reflect the intended day.
  const s = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days from today until `date`. Negative if in the past. */
export function daysUntil(value?: string | null): number | null {
  const d = safeParseDate(value);
  if (!d) return null;
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function isToday(value?: string | null): boolean {
  return daysUntil(value) === 0;
}

export function isTomorrow(value?: string | null): boolean {
  return daysUntil(value) === 1;
}

/** True if the date is strictly before today. */
export function isOverdue(value?: string | null): boolean {
  const n = daysUntil(value);
  return n !== null && n < 0;
}

/** True if the date is between today and `days` from now (inclusive). */
export function isWithinDays(value: string | null | undefined, days: number): boolean {
  const n = daysUntil(value);
  return n !== null && n >= 0 && n <= days;
}

export function formatDate(value?: string | null): string {
  const d = safeParseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Short, human relative label e.g. "Today", "Tomorrow", "in 4 days", "3 days ago". */
export function relativeLabel(value?: string | null): string {
  const n = daysUntil(value);
  if (n === null) return "—";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1) return `in ${n} days`;
  return `${Math.abs(n)} days ago`;
}

/** Add days to an ISO date and return a new ISO date string. */
export function addDays(value: string | null | undefined, days: number): string | null {
  const d = safeParseDate(value);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** ISO string for `days` from now (used by demo data so it stays current). */
export function fromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function nowIso(): string {
  return new Date().toISOString();
}
