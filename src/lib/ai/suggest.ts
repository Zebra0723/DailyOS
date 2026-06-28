// ----------------------------------------------------------------------------
// AI Suggestions — analysis engine (server-only).
//
// Takes already-extracted text (OCR/PDF done elsewhere) plus an analyzer config
// and returns actionable suggestions for the user's reply. Uses the shared LLM
// provider when configured, and falls back to a local heuristic so the feature
// always returns something useful even without an AI key.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";
import type { AnalyzerConfig } from "./analyzers";

export interface SuggestionResult {
  checklist: string[];
  missingInfo: string[];
  tone: string[];
  questions: string[];
  additions: string[];
  overall: string;
  usedAI: boolean;
}

const Schema = z.object({
  checklist: z.array(z.string()).default([]),
  missingInfo: z.array(z.string()).default([]),
  tone: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  additions: z.array(z.string()).default([]),
  overall: z.string().default(""),
});

function systemPrompt(cfg: AnalyzerConfig): string {
  return [
    `You are a helpful communication coach. The user received a ${cfg.channelNoun} and wants to reply well.`,
    cfg.promptHint,
    "Analyse the conversation and suggest what the user should INCLUDE in their reply.",
    "Do NOT write the full reply. Return short, actionable suggestions only.",
    "Focus on: missing information, unanswered questions, professionalism, tone, clarity, persuasiveness, and anything to address before sending.",
    "Respond as strict JSON with this shape:",
    `{"checklist": string[], "missingInfo": string[], "tone": string[], "questions": string[], "additions": string[], "overall": string}`,
    "`checklist` = 4-6 concise ✅-style action items (e.g. 'Confirm the deadline'). Other arrays may be empty if not relevant. `overall` = one or two sentences of feedback.",
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
            content: `Here is the ${cfg.channelNoun} conversation:\n\n"""\n${text.slice(0, 8000)}\n"""`,
          },
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      const result: SuggestionResult = { ...parsed, usedAI: true };
      // If the model returned nothing useful, fall back.
      if (result.checklist.length === 0 && !result.overall) {
        return localSuggest(cfg, text);
      }
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
  const lower = text.toLowerCase();
  const has = (...words: string[]) => words.some((w) => lower.includes(w));

  const checklist: string[] = [];
  const missingInfo: string[] = [];
  const additions: string[] = [];

  // Unanswered questions — pull a couple of the lines that contain a "?".
  const questions = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.includes("?") && l.length > 8)
    .slice(0, 4);
  if (questions.length) checklist.push("Answer the question(s) they asked");

  if (has("price", "cost", "quote", "pricing", "£", "$", "budget")) {
    checklist.push("Address their pricing question");
    missingInfo.push("A clear figure or quote for the pricing they raised");
  }
  if (has("deadline", "by ", "due", "when", "date", "schedule")) {
    checklist.push("Confirm the deadline or timing");
    missingInfo.push("The specific date/time you can commit to");
  }
  if (has("available", "availability", "free", "meet", "call")) {
    checklist.push("Share your availability");
  }
  if (has("thank", "thanks", "appreciate")) {
    checklist.push("Thank them for their message");
  }

  // Always-useful additions.
  additions.push("State the next steps clearly so nothing is left open");
  if (cfg.key === "email") {
    additions.push("Open with a greeting and close with a polite sign-off");
  }

  // Make sure there are always a few items.
  const base = [
    "Confirm you've understood their request",
    "Be specific about what you'll do and by when",
    "Re-read for clarity before sending",
  ];
  for (const b of base) {
    if (checklist.length >= 5) break;
    if (!checklist.includes(b)) checklist.push(b);
  }

  const tone =
    cfg.key === "email"
      ? ["Keep it professional but warm", "Avoid sounding abrupt — soften any direct asks"]
      : ["Keep it short and friendly", "Match the casual tone of a text"];

  const overall = `Your reply will land best if it directly answers what they asked, fills any gaps, and ends with a clear next step. ${
    questions.length
      ? "There " +
        (questions.length === 1 ? "is 1 question" : `are ${questions.length} questions`) +
        " to make sure you respond to."
      : ""
  }`.trim();

  return {
    checklist: checklist.slice(0, 6),
    missingInfo,
    tone,
    questions,
    additions,
    overall,
    usedAI: false,
  };
}
