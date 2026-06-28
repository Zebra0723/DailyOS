// ----------------------------------------------------------------------------
// Smart Notepad analysis.
//
// Runs instantly (no API needed) the moment a note is written:
//  - assigns a category
//  - if it reads like life admin (a date or an action word) → proposes a
//    one-tap "smart reminder" task that feeds the Life Inbox world
//  - if it sounds stressed / grateful → flags a gentle Mindfulness nudge
// ----------------------------------------------------------------------------

import type { NoteAnalysis, Priority } from "@/lib/types";

const CATEGORY_RULES: { category: string; kw: RegExp }[] = [
  { category: "travel", kw: /\b(flight|trip|hotel|train|holiday|airport|booking|pack)\b/i },
  { category: "finance", kw: /\b(pay|bill|invoice|tax|bank|salary|budget|refund|£|\$|€)\b/i },
  { category: "home", kw: /\b(boiler|landlord|rent|repair|clean|bin|garden|warranty|diy)\b/i },
  { category: "health", kw: /\b(doctor|dentist|gp|appointment|prescription|gym|workout|nhs)\b/i },
  { category: "school", kw: /\b(school|homework|teacher|class|exam|nursery|uni|coursework)\b/i },
  { category: "shopping", kw: /\b(buy|order|shop|groceries|gift|present|amazon|return)\b/i },
  { category: "work", kw: /\b(meeting|email|deadline|project|client|report|boss|invoice)\b/i },
  { category: "idea", kw: /\b(idea|maybe|what if|concept|brainstorm|someday)\b/i },
];

const ACTION_RE =
  /\b(call|email|text|book|buy|order|pay|renew|cancel|send|submit|return|collect|pick up|finish|sort|fix|remember to|need to|must|deadline|due|by)\b/i;

const WELLBEING_RE =
  /\b(stress(ed|ful)?|tired|knackered|exhausted|overwhelm(ed|ing)?|anxious|anxiety|worried|burnt? out|can'?t cope|too much|grateful|thankful|relax|breathe|calm|rest)\b/i;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8,
  sep: 9, oct: 10, nov: 11, dec: 12,
};
const WEEKDAYS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Best-effort date out of a note, including "today/tomorrow/next monday". */
function findNoteDate(text: string, now: Date): string | null {
  const t = text.toLowerCase();

  if (/\btoday\b/.test(t)) return iso(now);
  if (/\btomorrow\b/.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return iso(d);
  }
  // next <weekday> / on <weekday>
  const wd = t.match(/\b(?:next|on|this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (wd) {
    const target = WEEKDAYS[wd[1]];
    const d = new Date(now);
    let add = (target - d.getDay() + 7) % 7;
    if (add === 0) add = 7;
    d.setDate(d.getDate() + add);
    return iso(d);
  }
  // 12 July / 12 Jul
  const dm = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\b/);
  if (dm) {
    const mo = MONTHS[dm[2].slice(0, 3)];
    if (mo) {
      const day = +dm[1];
      let year = now.getFullYear();
      const candidate = new Date(year, mo - 1, day);
      if (candidate < now) year += 1;
      return iso(new Date(year, mo - 1, day));
    }
  }
  // dd/mm
  const dn = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dn) {
    let year = dn[3] ? +dn[3] : now.getFullYear();
    if (year < 100) year += 2000;
    return `${year}-${pad(+dn[2])}-${pad(+dn[1])}`;
  }
  return null;
}

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function analyzeNote(content: string): NoteAnalysis {
  const text = content.trim();
  const now = new Date();

  const category =
    CATEGORY_RULES.find((r) => r.kw.test(text))?.category ?? "general";

  const wellbeing = WELLBEING_RE.test(text);
  const date = findNoteDate(text, now);
  const isAdmin = Boolean(date) || ACTION_RE.test(text);

  let suggested_task: NoteAnalysis["suggested_task"] = null;
  if (isAdmin) {
    const firstLine = text.split(/[\n.!?]/)[0].trim();
    const title = titleCase(firstLine.slice(0, 80) || "Follow up on this note");
    const priority: Priority = /\b(urgent|asap|today|tomorrow|deadline|must)\b/i.test(text)
      ? "high"
      : "medium";
    suggested_task = { title, due_date: date, priority };
  }

  const kind: NoteAnalysis["kind"] = isAdmin
    ? "admin"
    : wellbeing
      ? "wellbeing"
      : "note";

  return { category, kind, suggested_task, wellbeing };
}
