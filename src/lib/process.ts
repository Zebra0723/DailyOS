import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  extractFromText,
  extractFromImage,
  extractPdfText,
} from "@/lib/ai/extract";
import { localExtract, ensureSuggestions } from "@/lib/ai/local";
import { getAIProvider } from "@/lib/ai/provider";
import type { ExtractionResult, InboxItem } from "@/lib/types";

function looksLikeImage(item: InboxItem): boolean {
  return (
    (item.file_type ?? "").includes("image") ||
    /\.(png|jpe?g|gif|webp)$/i.test(item.file_name ?? "")
  );
}
function looksLikePdf(item: InboxItem): boolean {
  return (
    (item.file_type ?? "").includes("pdf") ||
    /\.pdf$/i.test(item.file_name ?? "")
  );
}

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

  // Log + flip to "processing" are independent — run together.
  await Promise.all([
    logStatus(itemId, item.user_id, "processing", "Started extraction"),
    supabase.from("inbox_items").update({ status: "processing" }).eq("id", itemId),
  ]);

  try {
    const provider = getAIProvider();
    const aiOn = provider.isConfigured();

    // 2. Resolve content. Prefer pasted text; otherwise read the uploaded file:
    //    images → vision (if AI on); PDFs → embedded text layer.
    let text = (item.original_text ?? "").trim();
    let result: ExtractionResult | null = null;
    let note = aiOn ? "AI extraction" : "Smart extraction (no AI key set)";

    if (!text && item.file_url) {
      const { data: blob, error: dlErr } = await supabase.storage
        .from("inbox-files")
        .download(item.file_url);

      if (dlErr || !blob) throw new Error("Could not read the uploaded file.");
      const buffer = Buffer.from(await blob.arrayBuffer());

      if (looksLikeImage(item) && aiOn) {
        try {
          const mime = item.file_type?.includes("/")
            ? item.file_type
            : "image/jpeg";
          const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
          result = await extractFromImage(item.title, dataUrl);
        } catch {
          // Vision unavailable — fall through to local extraction on the title.
        }
      } else if (looksLikePdf(item)) {
        text = await extractPdfText(buffer);
      }
    }

    // 3. Produce a result. Always succeed: use the LLM when available, but fall
    //    back to local heuristics so an item never ends up "failed".
    if (!result) {
      const seed = text || item.title;
      if (aiOn) {
        try {
          result = await extractFromText(item.title, seed);
        } catch (err) {
          note = "Smart extraction (AI unavailable)";
          await logStatus(
            itemId,
            item.user_id,
            "info",
            `AI call failed, used local extraction: ${
              err instanceof Error ? err.message : "error"
            }`,
          );
          result = localExtract(item.title, seed);
        }
      } else {
        result = localExtract(item.title, seed);
      }
    }

    // Guarantee a clear summary + at least one suggestion, whatever the source.
    result = ensureSuggestions(result, item.title);

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
      `${note}: ${result.suggested_tasks.length} task(s), ${result.suggested_calendar_events.length} event(s).`,
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
