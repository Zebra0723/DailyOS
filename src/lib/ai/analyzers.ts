// ----------------------------------------------------------------------------
// AI Suggestions — analyzer registry.
//
// Each analyzer describes one kind of conversation (email, SMS, …). Adding a
// future channel (WhatsApp, Messenger, LinkedIn, Letters, Contracts) is just a
// new entry here — the upload UI, OCR, server action and AI prompt are all
// driven off this config, so no other code needs to change.
//
// Pure data only (no server-only or React imports) so it can be shared by both
// the client component and the server action.
// ----------------------------------------------------------------------------

export interface AnalyzerConfig {
  /** Stable key + route segment, e.g. "email" -> /ai-suggestions/email */
  key: string;
  /** Sidebar / page label, e.g. "E-Mail" */
  label: string;
  /** Short page description. */
  description: string;
  /** Upload-area helper text. */
  uploadHint: string;
  /** How to refer to the message in copy, e.g. "email", "text message". */
  channelNoun: string;
  /** Extra guidance fed to the AI for this channel. */
  promptHint: string;
}

export const ANALYZERS: Record<string, AnalyzerConfig> = {
  email: {
    key: "email",
    label: "E-Mail",
    description:
      "Upload a screenshot or PDF of an email and get suggestions for what to include in your reply.",
    uploadHint: "Upload a screenshot or PDF of your email conversation.",
    channelNoun: "email",
    promptHint:
      "This is an email, so a fuller, professional reply is expected. Consider greeting, structure, clear asks, and a polite sign-off.",
  },
  sms: {
    key: "sms",
    label: "SMS",
    description:
      "Upload a screenshot or PDF of a text conversation and get suggestions for what to include in your reply.",
    uploadHint: "Upload a screenshot or PDF of your SMS conversation.",
    channelNoun: "text message",
    promptHint:
      "This is an SMS/text message, so replies are usually short and casual. Keep suggestions concise and to the point.",
  },
};

export function getAnalyzer(key: string): AnalyzerConfig | null {
  return ANALYZERS[key] ?? null;
}

export const ANALYZER_LIST = Object.values(ANALYZERS);
