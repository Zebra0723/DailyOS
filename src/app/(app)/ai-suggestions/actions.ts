"use server";

import { getAnalyzer } from "@/lib/ai/analyzers";
import { analyzeConversation, type SuggestionResult } from "@/lib/ai/suggest";
import { extractPdfText } from "@/lib/ai/extract";

export type SuggestResponse =
  | { ok: true; result: SuggestionResult }
  | { ok: false; error: string };

/**
 * Analyse a conversation. `text` is OCR output from the client (images);
 * `pdfBase64` is sent for PDFs and has its text extracted server-side.
 */
export async function getSuggestions(input: {
  channel: string;
  text?: string;
  pdfBase64?: string;
}): Promise<SuggestResponse> {
  const cfg = getAnalyzer(input.channel);
  if (!cfg) return { ok: false, error: "Unknown analyzer type." };

  try {
    let text = (input.text ?? "").trim();

    if (text.replace(/\s+/g, "").length < 15 && input.pdfBase64) {
      try {
        const buf = Buffer.from(input.pdfBase64, "base64");
        const pdfText = (await extractPdfText(buf)).trim();
        text = [text, pdfText].filter(Boolean).join("\n\n").trim();
      } catch {
        return {
          ok: false,
          error:
            "We couldn't read that PDF. Make sure it has selectable text, or upload a screenshot instead.",
        };
      }
    }

    if (text.replace(/\s+/g, "").length < 15) {
      return {
        ok: false,
        error:
          "We couldn't read enough text from that. Try a clearer, well-lit screenshot of the whole conversation.",
      };
    }

    const result = await analyzeConversation(cfg, text);
    return { ok: true, result };
  } catch {
    return {
      ok: false,
      error: "Something went wrong while analysing your message. Please try again.",
    };
  }
}
