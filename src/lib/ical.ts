// Minimal iCalendar (.ics) builder for the DailyOS calendar feed.

export interface FeedEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  description?: string | null;
}

export interface FeedTask {
  id: string;
  title: string;
  due_date: string;
}

function esc(s: string): string {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** ISO datetime → UTC iCal stamp, e.g. 20260703T140000Z */
function dtUtc(iso: string): string {
  const d = new Date(iso);
  return `${d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")}`;
}

/** YYYY-MM-DD → YYYYMMDD (all-day) */
function dateOnly(value: string): string {
  return value.slice(0, 10).replace(/-/g, "");
}

export function buildICS(events: FeedEvent[], tasks: FeedTask[]): string {
  const now = dtUtc(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DailyOS//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:DailyOS",
    "X-WR-CALDESC:Your DailyOS events and due tasks",
  ];

  for (const e of events) {
    if (!e.start_time) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:evt-${e.id}@dailyos`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtUtc(e.start_time)}`,
    );
    if (e.end_time) lines.push(`DTEND:${dtUtc(e.end_time)}`);
    lines.push(`SUMMARY:${esc(e.title)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push("END:VEVENT");
  }

  for (const t of tasks) {
    if (!t.due_date) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:task-${t.id}@dailyos`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateOnly(t.due_date)}`,
      `SUMMARY:${esc(`Task: ${t.title}`)}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
