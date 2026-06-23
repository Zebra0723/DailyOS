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
- Only suggest tasks/events that are genuinely useful and actionable.
- Keep the summary to one or two friendly sentences.
- Choose the single best item_type and vault_category.

Schema:
{
  "item_type": "travel | receipt | warranty | booking | school | finance | health | subscription | event | general",
  "summary": "short summary",
  "key_dates": [ { "date": "YYYY-MM-DD", "time": "HH:mm or null", "description": "what happens" } ],
  "suggested_tasks": [ { "title": "task title", "description": "optional detail or null", "due_date": "YYYY-MM-DD or null", "priority": "low | medium | high" } ],
  "suggested_calendar_events": [ { "title": "event title", "description": "optional detail or null", "start_time": "ISO datetime or null", "end_time": "ISO datetime or null", "location": "location or null" } ],
  "entities": { "people": [], "companies": [], "places": [], "prices": [], "reference_numbers": [] },
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
