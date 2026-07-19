import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slice the first {...} object out of a possibly-noisy LLM response. */
export function extractJson(raw: string): string {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  return s >= 0 && e > s ? raw.slice(s, e + 1) : raw;
}

/**
 * Parse a date value. A bare "YYYY-MM-DD" is parsed as *local* midnight (not
 * UTC), so relative-day counts and formatting don't drift by a day in non-UTC
 * timezones.
 */
function parseLocal(value: string): Date {
  const s = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  return new Date(s);
}

/** Format an ISO date string into a friendly label, e.g. "23 Jun 2026". */
export function formatDate(value?: string | null): string {
  if (!value) return "";
  const d = parseLocal(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO datetime into "23 Jun, 14:30". */
export function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const d = parseLocal(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a floating event time (stored as wall-clock, e.g. "2026-07-10T14:00:00Z")
 * literally, in UTC, so it reads the same in any timezone — a 2pm event stays
 * "2pm" after you travel. Use this for event start/end times.
 */
export function formatFloating(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "in 3 days", "today", "2 days ago" style relative label for a date. */
export function relativeDay(value?: string | null): string {
  if (!value) return "";
  const d = parseLocal(value);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((a - b) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

export function isToday(value?: string | null): boolean {
  if (!value) return false;
  const d = parseLocal(value);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

export function initials(value?: string | null): string {
  if (!value) return "U";
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
