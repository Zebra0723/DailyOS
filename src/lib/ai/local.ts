// ----------------------------------------------------------------------------
// Local, no-API extraction.
//
// Runs when no AI provider is configured (or an AI call fails) so DailyOS works
// end-to-end with zero keys and never leaves an item "failed". It composes a
// SPECIFIC, professional result from the item's real content — leading with the
// user's own first line and the concrete facts it can find (amounts, dates,
// reference numbers) rather than generic filler. With a real AI key the richer
// LLM path is used instead.
// ----------------------------------------------------------------------------

import type {
  ExtractionResult,
  ItemType,
  Priority,
  SuggestedTask,
  VaultCategory,
} from "@/lib/types";

const TYPE_RULES: { type: ItemType; cat: VaultCategory; kw: RegExp }[] = [
  {
    type: "travel",
    cat: "travel",
    kw: /\b(flight|airline|boarding|airport|departure|arrival|gate|terminal|hotel|reservation|check[\s-]?in|itinerary|train|eurostar|ryanair|easyjet|british airways|seat \d|pnr)\b/i,
  },
  {
    type: "receipt",
    cat: "purchases",
    kw: /\b(receipt|order\s*#|order no|subtotal|total|paid|vat|qty|amount due|purchase|invoice no)\b/i,
  },
  {
    type: "warranty",
    cat: "home",
    kw: /\b(warranty|guarantee|coverage|covered until|expires?|policy)\b/i,
  },
  {
    type: "school",
    cat: "school",
    kw: /\b(school|teacher|parents'? evening|pupil|class|homework|term dates?|headteacher|nursery|p\.?t\.?a)\b/i,
  },
  {
    type: "finance",
    cat: "finance",
    kw: /\b(bank|statement|tax|hmrc|salary|payment due|direct debit|balance|sort code|invoice)\b/i,
  },
  {
    type: "health",
    cat: "health",
    kw: /\b(appointment|doctor|dentist|\bgp\b|nhs|clinic|prescription|vaccine|hospital|optician|surgery)\b/i,
  },
  {
    type: "subscription",
    cat: "subscriptions",
    kw: /\b(subscription|renew(s|al)?|membership|auto[\s-]?renew|monthly plan|netflix|spotify|prime|disney\+?)\b/i,
  },
  {
    type: "event",
    cat: "general",
    kw: /\b(event|party|meeting|invite|rsvp|concert|fixture|kick[\s-]?off|\bmatch\b|ticket|wedding)\b/i,
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
function niceDate(isoStr: string): string {
  const d = new Date(`${isoStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function findDates(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    if (valid(+m[1], +m[2], +m[3])) out.add(iso(+m[1], +m[2], +m[3]));
  }
  for (const m of text.matchAll(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?\s+(\d{4})\b/g,
  )) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mo && valid(+m[3], mo, +m[1])) out.add(iso(+m[3], mo, +m[1]));
  }
  for (const m of text.matchAll(
    /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g,
  )) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mo && valid(+m[3], mo, +m[2])) out.add(iso(+m[3], mo, +m[2]));
  }
  for (const m of text.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/g)) {
    let y = +m[3];
    if (y < 100) y += 2000;
    if (valid(y, +m[2], +m[1])) out.add(iso(y, +m[2], +m[1]));
  }
  return Array.from(out).slice(0, 5);
}

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
  return Array.from(out).slice(0, 8);
}

function findReferences(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(
    /\b(?:ref(?:erence)?|booking|order|confirmation|policy|account|invoice|pnr)\s*(?:no\.?|number|#|:)?\s*([A-Z0-9][A-Z0-9-]{3,})\b/gi,
  )) {
    out.add(m[1].toUpperCase());
  }
  return Array.from(out).slice(0, 6);
}

const KNOWN_BRANDS =
  /\b(amazon|currys|argos|tesco|sainsbury'?s|asda|aldi|lidl|john lewis|apple|samsung|dyson|ikea|netflix|spotify|disney\+?|amazon prime|ryanair|easyjet|british airways|tap|eurostar|airbnb|booking\.com|nhs|hmrc|vodafone|ee|o2|three|sky|bt|virgin)\b/i;

function findCompanies(text: string): string[] {
  const out = new Set<string>();
  const brand = text.match(KNOWN_BRANDS);
  if (brand) out.add(brand[0].replace(/\b\w/g, (c) => c.toUpperCase()));
  for (const m of text.matchAll(
    /\b([A-Z][A-Za-z&'.]+(?:\s+[A-Z][A-Za-z&'.]+)?)\s+(Ltd|Limited|Inc|PLC|LLP|Airlines|Airways|Bank|School|Hotel|Insurance|Dental|Clinic|Surgery)\b/g,
  )) {
    out.add(`${m[1]} ${m[2]}`);
  }
  return Array.from(out).slice(0, 5);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** A specific, professional one-liner composed from the real content. */
function buildSummary(
  type: ItemType,
  title: string,
  text: string,
  facts: { amount: string | null; dateLabel: string | null; time: string | null; ref: string | null; company: string | null },
): string {
  const { amount, dateLabel, time, ref, company } = facts;
  const clean = text.replace(/\s+/g, " ").trim();

  // When there's real text, lead with the user's own first line, then append
  // any concrete facts that aren't already mentioned.
  if (clean) {
    const first = clean.split(/(?<=[.!?])\s/)[0];
    let base =
      first.length >= 18 && first.length <= 180 ? first : clean.slice(0, 150);
    base = base.replace(/[\s.,;:–-]+$/, "");
    const extras: string[] = [];
    const has = (v: string | null) =>
      v ? base.toLowerCase().includes(v.toLowerCase()) : true;
    if (!has(amount)) extras.push(amount!);
    if (!has(dateLabel)) extras.push(dateLabel!);
    if (ref && !has(ref)) extras.push(`ref ${ref}`);
    return extras.length ? `${base} — ${extras.join(", ")}.` : `${base}.`;
  }

  // No text (e.g. a photo with only a title and no AI). Build a typed line.
  const who = company ? ` from ${company}` : "";
  const when = dateLabel ? ` on ${dateLabel}${time ? ` at ${time}` : ""}` : "";
  const cost = amount ? ` for ${amount}` : "";
  const reference = ref ? ` (ref ${ref})` : "";
  switch (type) {
    case "receipt":
      return `Receipt${who}${cost}${when ? `,${when.slice(3)}` : ""}${reference}.`;
    case "travel":
    case "booking":
      return `${capitalize(type)}${who}${when}${reference}.`.replace(" .", ".");
    case "subscription":
      return `Subscription${who}${cost}${dateLabel ? ` renewing ${dateLabel}` : ""}.`;
    case "warranty":
      return `Warranty${who}${dateLabel ? ` — expires ${dateLabel}` : ""}${reference}.`;
    case "finance":
      return `Finance item${cost}${dateLabel ? ` due ${dateLabel}` : ""}${reference}.`;
    case "health":
      return `Appointment${who}${when}.`;
    case "school":
      return `School item${when}: “${title}”.`;
    case "event":
      return `Event${when}: “${title}”.`;
    default:
      return `“${title}”${when}${cost}${reference}.`;
  }
}

const DEFAULT_TASK_BY_TYPE: Record<ItemType, string> = {
  travel: "Prepare and check in for your trip",
  receipt: "File this receipt for returns or warranty",
  warranty: "Set a reminder before the warranty expires",
  booking: "Confirm your booking details",
  school: "Add this to the family calendar and reply if needed",
  finance: "Review this and action any payment",
  health: "Confirm your appointment",
  subscription: "Decide whether to keep it before it renews",
  event: "Reply / RSVP and add it to your calendar",
  general: "Review this and decide your next step",
};

export function defaultTaskTitle(type: ItemType, title: string): string {
  const base = DEFAULT_TASK_BY_TYPE[type] ?? DEFAULT_TASK_BY_TYPE.general;
  return `${base}: ${title}`.slice(0, 90);
}

function findTagged(text: string, words: string): string[] {
  const out = new Set<string>();
  const re = new RegExp(
    `\\b(?:${words})\\s*(?:no\\.?|number|#|:)?\\s*([A-Z0-9][A-Z0-9-]{3,})\\b`,
    "gi",
  );
  for (const m of text.matchAll(re)) out.add(m[1].toUpperCase());
  return Array.from(out).slice(0, 5);
}

/** Pull the short line of original text containing a value, as proof. */
function snippetFor(text: string, value: string | null): string | null {
  if (!value) return null;
  const clean = text.replace(/\s+/g, " ");
  const idx = clean.toLowerCase().indexOf(value.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 40);
  const end = Math.min(clean.length, idx + value.length + 40);
  return `${start > 0 ? "…" : ""}${clean.slice(start, end).trim()}${end < clean.length ? "…" : ""}`;
}

function buildWatchOuts(type: ItemType, haystack: string, hasText: boolean) {
  const out: { title: string; detail: string }[] = [];
  const add = (title: string, detail: string) => out.push({ title, detail });

  if (/\breturn/i.test(haystack) || type === "receipt")
    add("Return window", "Keep this receipt — returns are usually time-limited.");
  if (/warranty|guarantee/i.test(haystack) || type === "warranty")
    add("Warranty", "Note the expiry date and register the product if needed.");
  if (/check[\s-]?in/i.test(haystack) || type === "travel")
    add("Check-in", "Check in ahead of time to avoid fees or missing your slot.");
  if (/cancel/i.test(haystack))
    add("Cancellation deadline", "Note the free-cancellation cut-off date.");
  if (/renew|auto[\s-]?renew|subscription/i.test(haystack) || type === "subscription")
    add("Renewal", "Decide whether to keep it before it auto-renews.");
  if (!hasText)
    add("Missing information", "We couldn't read much text — check the original to be sure.");

  return out.slice(0, 4);
}

/** Heuristic extraction mirroring the LLM's ExtractionResult shape. */
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
  const companies = findCompanies(haystack);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = dates.filter((d) => d >= today).sort();
  const sorted = dates.slice().sort();
  const headlineDate = upcoming[0] ?? sorted[0] ?? null;

  const summary = buildSummary(rule.type, title, text, {
    amount: prices[0] ?? null,
    dateLabel: headlineDate ? niceDate(headlineDate) : null,
    time,
    ref: references[0] ?? null,
    company: companies[0] ?? null,
  });

  const key_dates = dates.map((d, i) => ({
    date: d,
    time: i === 0 ? time : null,
    description: `${capitalize(rule.type)} date`,
  }));

  const renewish = /\b(renew|expire|expiry|due|check[\s-]?in|deadline|by)\b/i.test(
    haystack,
  );
  const priority: Priority = renewish || upcoming.length ? "high" : "medium";

  const taskDetail = [
    references[0] ? `Ref ${references[0]}` : null,
    prices[0] ? prices[0] : null,
    companies[0] ? companies[0] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const orderNumbers = findTagged(text, "order");
  const bookingNumbers = findTagged(text, "booking|reservation|pnr|confirmation");

  const suggested_tasks: SuggestedTask[] = [
    {
      title: defaultTaskTitle(rule.type, title),
      reason: headlineDate
        ? `Tied to ${niceDate(headlineDate)} — don't let it slip.`
        : "Keeps this item from falling through the cracks.",
      description: taskDetail || "Suggested by DailyOS — edit, keep or remove.",
      due_date: upcoming[0] ?? null,
      priority,
    },
  ];

  const suggested_calendar_events = dates.length
    ? [
        {
          title: title.slice(0, 80),
          description: companies[0] ? `With ${companies[0]}` : null,
          start_time: `${headlineDate}T${time ?? "09:00"}:00`,
          end_time: null,
          location: null,
        },
      ]
    : [];

  const source_snippets = [
    { label: "Key date", value: headlineDate ? niceDate(headlineDate) : null, raw: headlineDate },
    { label: "Amount", value: prices[0] ?? null, raw: prices[0] ?? null },
    { label: "Reference", value: references[0] ?? null, raw: references[0] ?? null },
  ]
    .map((s) => {
      const snip = snippetFor(text, s.raw);
      return snip ? { label: s.label, snippet: snip } : null;
    })
    .filter((s): s is { label: string; snippet: string } => s !== null);

  return {
    item_type: rule.type,
    summary,
    confidence: "low",
    main_date: headlineDate,
    key_dates,
    suggested_tasks,
    suggested_calendar_events,
    entities: {
      people: [],
      companies,
      places: [],
      prices,
      reference_numbers: references,
      order_numbers: orderNumbers,
      booking_numbers: bookingNumbers,
      deadlines: renewish && headlineDate ? [niceDate(headlineDate)] : [],
    },
    watch_outs: buildWatchOuts(rule.type, haystack, Boolean(text)),
    source_snippets,
    vault_category: rule.cat,
  };
}

/**
 * Guarantee a useful response: a non-empty summary, at least one suggested
 * task, and an event when a date is known. Applied to BOTH the AI and local
 * results so the review screen is never empty.
 */
export function ensureSuggestions(
  result: ExtractionResult,
  title: string,
): ExtractionResult {
  const r = { ...result };

  // Defensive defaults so the report renders even from partial/old data.
  r.confidence = r.confidence ?? "medium";
  r.watch_outs = r.watch_outs ?? [];
  r.source_snippets = r.source_snippets ?? [];
  r.entities = {
    people: r.entities?.people ?? [],
    companies: r.entities?.companies ?? [],
    places: r.entities?.places ?? [],
    prices: r.entities?.prices ?? [],
    reference_numbers: r.entities?.reference_numbers ?? [],
    order_numbers: r.entities?.order_numbers ?? [],
    booking_numbers: r.entities?.booking_numbers ?? [],
    deadlines: r.entities?.deadlines ?? [],
  };
  if (!r.main_date) r.main_date = r.key_dates?.[0]?.date ?? null;

  if (!r.summary || !r.summary.trim()) {
    r.summary = `“${title}” — review the suggestions below.`;
  }

  if (!r.suggested_tasks || r.suggested_tasks.length === 0) {
    const firstDate = r.key_dates?.[0]?.date ?? null;
    r.suggested_tasks = [
      {
        title: defaultTaskTitle(r.item_type, title),
        description: "Suggested by DailyOS — edit, keep or remove.",
        due_date: firstDate,
        priority: "medium",
      },
    ];
  }

  if (
    (!r.suggested_calendar_events || r.suggested_calendar_events.length === 0) &&
    r.key_dates?.length
  ) {
    const kd = r.key_dates[0];
    r.suggested_calendar_events = [
      {
        title: title.slice(0, 80),
        description: null,
        start_time: `${kd.date}T${kd.time ?? "09:00"}:00`,
        end_time: null,
        location: null,
      },
    ];
  }

  return r;
}
