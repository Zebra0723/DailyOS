import "server-only";

import { getAIProvider } from "./provider";
import { extractionResultSchema, type ExtractionResultParsed } from "./schema";
import type { ExtractionResult } from "@/lib/types";

const SYSTEM_PROMPT = `You are DailyOS, a meticulous personal chief-of-staff that turns messy life-admin
content (receipts, bookings, school letters, warranties, travel plans, emails,
screenshots) into clean structured data.

You will be given the text of one item. Extract useful information and respond
with a SINGLE JSON object and nothing else. Do not wrap it in markdown.

Rules:
- Output ONLY valid JSON matching the schema below. No prose, no code fences.
- Use null for unknown scalar fields. Use [] for unknown lists.
- Dates must be ISO "YYYY-MM-DD". Times "HH:mm" (24h) or null.
- Calendar start_time/end_time must be full ISO datetimes (YYYY-MM-DDTHH:mm:ss)
  or null if no clear time exists.
- ALWAYS return a clear, SPECIFIC, non-empty summary. Name the concrete details
  you found — who/what, the amount, the date, the place, the reference number —
  e.g. "Currys receipt for £429.00 (Dyson V11), paid 3 Jun. Ref 9921-AB." Never
  write a vague summary like "a receipt" or "a travel item".
- ALWAYS include at least ONE genuinely useful, specific suggested_task. Never
  return an empty suggested_tasks array. Phrase tasks as concrete actions
  ("Check in for TP8842K by 11 Jul"), not generic ones.
- If the item mentions any date/time, include a matching suggested_calendar_event.
- Choose the single best item_type and vault_category.

Act like a personal chief of staff writing a short ACTION REPORT. As well as the
basics, decide:
- confidence: how sure you are about the extraction ("low" | "medium" | "high").
- main_date: the single most important date/deadline (YYYY-MM-DD) or null.
- For each suggested task, add a one-line "reason" explaining why it matters.
- watch_outs: practical heads-ups the user shouldn't miss (e.g. return window
  ending, check-in needed, cancellation deadline, warranty expiry, missing
  information, renewal coming up, travel prep). [] if none.
- source_snippets: for the most important details, quote the short bit of the
  original text it came from, so the user can trust it. Each is { label, snippet }.
- entities: also capture order_numbers and booking_numbers separately from
  generic reference_numbers, and any explicit deadlines.

Schema:
{
  "item_type": "travel | receipt | warranty | booking | school | finance | health | subscription | event | general",
  "summary": "short summary",
  "confidence": "low | medium | high",
  "main_date": "YYYY-MM-DD or null",
  "key_dates": [ { "date": "YYYY-MM-DD", "time": "HH:mm or null", "description": "what happens" } ],
  "suggested_tasks": [ { "title": "task title", "reason": "why it matters", "description": "optional detail or null", "due_date": "YYYY-MM-DD or null", "priority": "low | medium | high" } ],
  "suggested_calendar_events": [ { "title": "event title", "description": "optional detail or null", "start_time": "ISO datetime or null", "end_time": "ISO datetime or null", "location": "location or null" } ],
  "entities": { "people": [], "companies": [], "places": [], "prices": [], "reference_numbers": [], "order_numbers": [], "booking_numbers": [], "deadlines": [] },
  "watch_outs": [ { "title": "short heading", "detail": "what to do / why" } ],
  "source_snippets": [ { "label": "what this proves", "snippet": "quoted text from the item" } ],
  "vault_category": "travel | home | school | finance | purchases | health | subscriptions | general"
}`;

/** Strip markdown fences / stray text and grab the first JSON object. */
function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in AI response.");
  }
  return candidate.slice(start, end + 1);
}

function parseExtraction(raw: string): ExtractionResult {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    parsedJson = JSON.parse(extractJsonBlock(raw));
  }
  const result: ExtractionResultParsed = extractionResultSchema.parse(parsedJson);
  return result as ExtractionResult;
}

/**
 * Run the LLM over a block of text and return a validated extraction result.
 * Throws if the provider errors or the JSON cannot be parsed/validated.
 */
export async function extractFromText(
  title: string,
  text: string,
): Promise<ExtractionResult> {
  const provider = getAIProvider();

  const today = new Date().toISOString().slice(0, 10);
  const userContent = `Today's date is ${today}.
Item title: ${title || "(untitled)"}

Item content:
"""
${text.slice(0, 12_000)}
"""`;

  const raw = await provider.chat({
    json: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  return parseExtraction(raw);
}

/**
 * Use a vision-capable model to read ALL text in an image (OCR) and extract the
 * structured data in one pass. `dataUrl` is a base64 data URL of the image.
 */
export async function extractFromImage(
  title: string,
  dataUrl: string,
): Promise<ExtractionResult> {
  const provider = getAIProvider();
  const today = new Date().toISOString().slice(0, 10);

  const raw = await provider.chat({
    json: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Today's date is ${today}. Item title: ${title || "(untitled)"}.
Read ALL the text visible in this image (it may be a receipt, screenshot, letter
or ticket) and extract the structured data per the schema.`,
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  return parseExtraction(raw);
}

/**
 * Extract plain text from a PDF buffer. Returns "" for image-only / scanned
 * PDFs (no embedded text layer) so the caller can fall back gracefully.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // Import the parser directly to avoid pdf-parse's debug harness running.
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const pdf = (mod.default ?? mod) as (b: Buffer) => Promise<{ text: string }>;
  try {
    const data = await pdf(buffer);
    return (data.text ?? "").trim();
  } catch {
    return "";
  }
}
