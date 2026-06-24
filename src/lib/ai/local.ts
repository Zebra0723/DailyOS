// ----------------------------------------------------------------------------
// Local, no-API extraction.
//
// This runs when no AI provider is configured (or when an AI call fails), so
// DailyOS works end-to-end with zero API keys and never leaves an item in a
// "failed" state. It uses lightweight heuristics — keyword classification plus
// date / price / reference regexes — to produce the same ExtractionResult shape
// the LLM would return. If a real AI key is added later, the richer LLM path is
// used automatically instead.
// ----------------------------------------------------------------------------

import type {
  ExtractionResult,
  ItemType,
  Priority,
  VaultCategory,
} from "@/lib/types";

const TYPE_RULES: { type: ItemType; cat: VaultCategory; kw: RegExp }[] = [
  {
    type: "travel",
    cat: "travel",
    kw: /\b(flight|airline|boarding|airport|departure|arrival|gate|hotel|booking|reservation|check[\s-]?in|itinerary|train|eurostar|ryanair|easyjet|british airways|tap|seat \d)\b/i,
  },
  {
    type: "receipt",
    cat: "purchases",
    kw: /\b(receipt|order\s*#|order no|subtotal|total|paid|vat|qty|amount due|purchase)\b/i,
  },
  {
    type: "warranty",
    cat: "home",
    kw: /\b(warranty|guarantee|coverage|covered until|policy)\b/i,
  },
  {
    type: "school",
    cat: "school",
    kw: /\b(school|teacher|parents'? evening|pupil|class|homework|term dates?|headteacher|nursery|p\.?t\.?a)\b/i,
  },
  {
    type: "finance",
    cat: "finance",
    kw: /\b(bank|statement|tax|hmrc|salary|payment due|direct debit|balance|invoice|sort code)\b/i,
  },
  {
    type: "health",
    cat: "health",
    kw: /\b(appointment|doctor|dentist|\bgp\b|nhs|clinic|prescription|vaccine|hospital|optician)\b/i,
  },
  {
    type: "subscription",
    cat: "subscriptions",
    kw: /\b(subscription|renew(s|al)?|membership|auto[\s-]?renew|monthly plan|netflix|spotify|prime|disney)\b/i,
  },
  {
    type: "event",
    cat: "general",
    kw: /\b(event|party|meeting|invite|rsvp|concert|fixture|kick[\s-]?off|match|ticket)\b/i,
  },
];

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8,
  sep: 9, oct: 10, nov: 11, dec: 12,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}
function valid(y: number, m: number, d: number) {
  return m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1970 && y <= 2100;
}

/** Find up to a few dates (ISO) in free text, in several common formats. */
function findDates(text: string): string[] {
  const out = new Set<string>();

  // ISO  2026-07-12
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (valid(y, mo, d)) out.add(iso(y, mo, d));
  }
  // 12 July 2026  /  12th Jul 2026
  for (const m of text.matchAll(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/g,
  )) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mo && valid(+m[3], mo, +m[1])) out.add(iso(+m[3], mo, +m[1]));
  }
  // July 12, 2026  /  Jul 12 2026
  for (const m of text.matchAll(
    /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g,
  )) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mo && valid(+m[3], mo, +m[2])) out.add(iso(+m[3], mo, +m[2]));
  }
  // 12/07/2026 or 12-07-26 (assume UK D/M/Y)
  for (const m of text.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/g)) {
    let y = +m[3];
    if (y < 100) y += 2000;
    if (valid(y, +m[2], +m[1])) out.add(iso(y, +m[2], +m[1]));
  }

  return [...out].slice(0, 5);
}

/** First time-of-day found, as "HH:mm" (24h), or null. */
function findTime(text: string): string | null {
  const m = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  if (!m) return null;
  let h = +m[1];
  const min = +m[2];
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${pad(h)}:${pad(min)}`;
}

function findPrices(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/[£$€]\s?\d[\d,]*(?:\.\d{1,2})?/g)) {
    out.add(m[0].replace(/\s/g, ""));
  }
  return [...out].slice(0, 8);
}

function findReferences(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(
    /\b(?:ref(?:erence)?|booking|order|confirmation|policy|account|invoice|pnr)\s*(?:no\.?|number|#|:)?\s*([A-Z0-9][A-Z0-9-]{3,})\b/gi,
  )) {
    out.add(m[1].toUpperCase());
  }
  return [...out].slice(0, 6);
}

function makeSummary(title: string, text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return `Saved “${title}”.`;
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0];
  const base =
    firstSentence.length > 12 && firstSentence.length < 180
      ? firstSentence
      : clean.slice(0, 160);
  return base.length < clean.length && !/[.!?]$/.test(base)
    ? `${base.trim()}…`
    : base.trim();
}

/** Heuristic extraction that mirrors the LLM's ExtractionResult shape. */
export function localExtract(title: string, rawText: string): ExtractionResult {
  const text = (rawText ?? "").trim();
  const haystack = `${title}\n${text}`;

  const rule =
    TYPE_RULES.find((r) => r.kw.test(haystack)) ?? {
      type: "general" as ItemType,
      cat: "general" as VaultCategory,
    };

  const dates = findDates(text);
  const time = findTime(text);
  const prices = findPrices(text);
  const references = findReferences(text);

  const key_dates = dates.map((d, i) => ({
    date: d,
    time: i === 0 ? time : null,
    description: "Date found in this item",
  }));

  // Suggest a sensible reminder if there's an upcoming date.
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = dates.filter((d) => d >= today).sort();
  const renewish = /\b(renew|expire|expiry|due|check[\s-]?in|deadline|by)\b/i.test(
    haystack,
  );

  const suggested_tasks =
    upcoming.length || renewish
      ? [
          {
            title: `Follow up: ${title}`.slice(0, 80),
            description: "Auto-suggested from your item — edit or remove.",
            due_date: upcoming[0] ?? null,
            priority: (renewish ? "high" : "medium") as Priority,
          },
        ]
      : [];

  const suggested_calendar_events =
    upcoming.length && time
      ? [
          {
            title: title.slice(0, 80),
            description: null,
            start_time: `${upcoming[0]}T${time}:00`,
            end_time: null,
            location: null,
          },
        ]
      : [];

  return {
    item_type: rule.type,
    summary: makeSummary(title, text),
    key_dates,
    suggested_tasks,
    suggested_calendar_events,
    entities: {
      people: [],
      companies: [],
      places: [],
      prices,
      reference_numbers: references,
    },
    vault_category: rule.cat,
  };
}
