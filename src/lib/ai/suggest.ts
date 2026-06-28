// ----------------------------------------------------------------------------
// OrganizerOS — analysis engine (server-only).
//
// Takes already-extracted text (OCR/PDF done elsewhere) plus an analyzer config
// and returns an organised view: what's urgent, what to do, what to put in the
// calendar, and what's safe to delete to save space. Uses the shared LLM
// provider when configured, with a local heuristic fallback otherwise.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";
import type { AnalyzerConfig } from "./analyzers";

export interface SuggestionResult {
  reply: string[];
  urgent: string[];
  todo: string[];
  calendar: string[];
  declutter: string[];
  overall: string;
  usedAI: boolean;
}

const Schema = z.object({
  reply: z.array(z.string()).default([]),
  urgent: z.array(z.string()).default([]),
  todo: z.array(z.string()).default([]),
  calendar: z.array(z.string()).default([]),
  declutter: z.array(z.string()).default([]),
  overall: z.string().default(""),
});

function systemPrompt(cfg: AnalyzerConfig): string {
  return [
    `You are OrganizerOS, an assistant that helps people get on top of their ${cfg.channelNoun}.`,
    cfg.promptHint,
    "The user uploaded a screenshot or PDF — it may be a list/inbox or a single conversation.",
    "Analyse it and produce a short, practical, organised view. Do NOT write full replies.",
    "Respond as strict JSON with this shape:",
    `{"reply": string[], "urgent": string[], "todo": string[], "calendar": string[], "declutter": string[], "overall": string}`,
    "- reply: if there's a message to respond to, what the user should INCLUDE in their reply (not the full reply). Empty for an inbox overview.",
    "- urgent: things that need attention soon (deadlines, final notices, anything time-sensitive).",
    "- todo: concrete actions to take (reply, pay, confirm, send something).",
    "- calendar: events/dates/appointments worth adding to a calendar, with the date/time if visible.",
    "- declutter: messages that look safe to delete or archive to save space (newsletters, promos, no-reply, old notifications).",
    "- overall: one or two sentences summarising what to focus on.",
    "Any array may be empty if nothing applies. Keep each item to one short line.",
  ].join("\n");
}

export async function analyzeConversation(
  cfg: AnalyzerConfig,
  text: string,
): Promise<SuggestionResult> {
  const provider = getAIProvider();

  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt(cfg) },
          {
            role: "user",
            content: `Here is the ${cfg.channelNoun} content:\n\n"""\n${text.slice(0, 8000)}\n"""`,
          },
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      const result: SuggestionResult = { ...parsed, usedAI: true };
      const empty =
        result.reply.length === 0 &&
        result.urgent.length === 0 &&
        result.todo.length === 0 &&
        result.calendar.length === 0 &&
        result.declutter.length === 0 &&
        !result.overall;
      if (empty) return localSuggest(cfg, text);
      return result;
    } catch {
      return localSuggest(cfg, text);
    }
  }

  return localSuggest(cfg, text);
}

function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return raw;
}

// ---- Local heuristic fallback ---------------------------------------------

function localSuggest(cfg: AnalyzerConfig, text: string): SuggestionResult {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 3);
  const lower = text.toLowerCase();
  const has = (...words: string[]) => words.some((w) => lower.includes(w));

  const reply: string[] = [];
  const urgent: string[] = [];
  const todo: string[] = [];
  const calendar: string[] = [];
  const declutter: string[] = [];

  // What to include in a reply (kept from the original suggestions feature).
  if (has("?")) reply.push("Answer the question(s) they asked");
  if (has("price", "cost", "quote", "pricing", "£", "$"))
    reply.push("Address their pricing question");
  if (has("deadline", "by ", "due", "when"))
    reply.push("Confirm the deadline or timing");
  if (has("available", "availability", "free", "meet"))
    reply.push("Share your availability");
  if (has("thank", "thanks", "appreciate")) reply.push("Thank them");
  if (reply.length && reply.length < 3)
    reply.push("Be clear about the next steps");

  // Urgent cues.
  const urgentLine = lines.find((l) =>
    /urgent|asap|immediately|final notice|action required|overdue|past due|payment due/i.test(l),
  );
  if (urgentLine) urgent.push(truncate(urgentLine));
  if (has("overdue", "final notice", "past due"))
    urgent.push("There's an overdue / final-notice item — handle it first");

  // To-do cues.
  if (has("?")) todo.push("Reply to the question(s) raised");
  if (has("please", "can you", "could you", "need you to"))
    todo.push("Action the request they made");
  if (has("pay", "invoice", "payment", "bill", "£", "$"))
    todo.push("Sort the payment / invoice mentioned");
  if (has("confirm", "rsvp", "let me know"))
    todo.push("Confirm and let them know");

  // Calendar cues — lines that mention a date/time/meeting.
  const dateLines = lines.filter((l) =>
    /\b(\d{1,2}(:\d{2})?\s?(am|pm))|\b(mon|tue|wed|thu|fri|sat|sun)|\b\d{1,2}(st|nd|rd|th)?\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|meeting|appointment|call at|deadline/i.test(l),
  );
  dateLines.slice(0, 3).forEach((l) => calendar.push(truncate(l)));

  // Declutter cues.
  if (has("unsubscribe", "newsletter", "no-reply", "noreply", "promotion", "% off", "sale", "deal"))
    declutter.push("Newsletters / promos here look safe to delete to save space");
  if (has("notification", "do not reply", "automated"))
    declutter.push("Automated notifications can be archived");

  // Guarantees so it's never empty.
  if (todo.length === 0) todo.push("Skim for anything needing a reply, then file the rest");
  if (calendar.length === 0 && has("when", "schedule", "date"))
    calendar.push("There may be a date to add — check and pop it in your calendar");

  const overall = urgent.length
    ? "Start with the urgent item, action the to-dos, then clear out the clutter to free up space."
    : "Nothing screams urgent — work through the to-dos and delete the newsletters/promos to keep things tidy.";

  return {
    reply: dedupe(reply).slice(0, 5),
    urgent: dedupe(urgent).slice(0, 4),
    todo: dedupe(todo).slice(0, 5),
    calendar: dedupe(calendar).slice(0, 4),
    declutter: dedupe(declutter).slice(0, 3),
    overall,
    usedAI: false,
  };
}

function truncate(s: string, n = 90): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
