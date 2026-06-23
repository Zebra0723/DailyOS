import "server-only";

import { createClient } from "@/lib/supabase/server";
import { extractFromText } from "@/lib/ai/extract";
import type { ExtractionResult, InboxItem } from "@/lib/types";

/**
 * Core extraction pipeline.
 *
 * 1. Load the inbox item (RLS scopes it to the current user).
 * 2. Resolve text content. For PDFs/images without text we mark the item as
 *    "needs text extraction" and bail gracefully (OCR is a later milestone).
 * 3. Send the text to the LLM asking for strict JSON.
 * 4. Validate the JSON (see lib/ai/schema.ts).
 * 5. Persist into inbox_items.raw_ai_json + summary + item_type.
 * 6. Set status to `review`.
 *
 * On any failure the item is saved with status `failed` so the UI can show a
 * "Needs review" state rather than losing the upload.
 */
export async function processInboxItem(
  itemId: string,
): Promise<{ ok: boolean; status: InboxItem["status"]; message?: string }> {
  const supabase = createClient();

  const { data: item, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("id", itemId)
    .single<InboxItem>();

  if (error || !item) {
    return { ok: false, status: "failed", message: "Item not found." };
  }

  await logStatus(itemId, item.user_id, "processing", "Started extraction");
  await supabase
    .from("inbox_items")
    .update({ status: "processing" })
    .eq("id", itemId);

  // 2. Resolve text content.
  const text = (item.original_text ?? "").trim();

  if (!text) {
    // A file was uploaded but we couldn't read text from it yet.
    const message =
      "No machine-readable text yet. Open the item to add text or wait for OCR.";
    await supabase
      .from("inbox_items")
      .update({ status: "review", needs_text_extraction: true })
      .eq("id", itemId);
    await logStatus(itemId, item.user_id, "review", message);
    return { ok: true, status: "review", message };
  }

  try {
    const result: ExtractionResult = await extractFromText(item.title, text);

    await supabase
      .from("inbox_items")
      .update({
        status: "review",
        item_type: result.item_type,
        summary: result.summary,
        raw_ai_json: result,
        needs_text_extraction: false,
      })
      .eq("id", itemId);

    await logStatus(
      itemId,
      item.user_id,
      "review",
      `Extracted ${result.suggested_tasks.length} task(s) and ${result.suggested_calendar_events.length} event(s).`,
    );

    return { ok: true, status: "review" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("inbox_items")
      .update({ status: "failed" })
      .eq("id", itemId);
    await logStatus(itemId, item.user_id, "failed", message);
    return { ok: false, status: "failed", message };
  }
}

async function logStatus(
  inboxItemId: string,
  userId: string,
  status: string,
  message: string,
) {
  const supabase = createClient();
  await supabase.from("processing_logs").insert({
    inbox_item_id: inboxItemId,
    user_id: userId,
    status,
    message,
  });
}
