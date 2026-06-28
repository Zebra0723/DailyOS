// ----------------------------------------------------------------------------
// OrganizerOS — analyzer registry.
//
// Each analyzer describes one source of messages (Gmail, Apple Mail, WhatsApp,
// SMS, …). Adding a future source is just a new entry here — the upload UI,
// OCR, server action and AI prompt are all driven off this config.
//
// Pure data only (no server-only or React imports) so it can be shared by both
// the client component and the server action.
// ----------------------------------------------------------------------------

export interface AnalyzerConfig {
  /** Stable key + route segment, e.g. "gmail" -> /ai-suggestions/gmail */
  key: string;
  /** Sidebar / page label, e.g. "Gmail" */
  label: string;
  /** Short page description. */
  description: string;
  /** Upload-area helper text. */
  uploadHint: string;
  /** How to refer to the source in copy, e.g. "Gmail inbox", "WhatsApp chat". */
  channelNoun: string;
  /** Extra guidance fed to the AI for this source. */
  promptHint: string;
}

const EMAIL_HINT =
  "This is email. Flag anything time-sensitive, surface actions and deadlines for the calendar, and call out newsletters, promotions and no-reply mail that are safe to delete to save space.";

export const ANALYZERS: Record<string, AnalyzerConfig> = {
  gmail: {
    key: "gmail",
    label: "Gmail",
    description:
      "Upload a screenshot or PDF of your Gmail and OrganizerOS tells you what to do, what's urgent, what to put in your calendar, and what to delete.",
    uploadHint: "Upload a screenshot or PDF of your Gmail inbox or an email.",
    channelNoun: "Gmail inbox",
    promptHint: EMAIL_HINT,
  },
  applemail: {
    key: "applemail",
    label: "Apple Mail",
    description:
      "Upload a screenshot or PDF of Apple Mail and OrganizerOS tells you what to do, what's urgent, what to put in your calendar, and what to delete.",
    uploadHint: "Upload a screenshot or PDF of your Apple Mail inbox or an email.",
    channelNoun: "Apple Mail inbox",
    promptHint: EMAIL_HINT,
  },
  whatsapp: {
    key: "whatsapp",
    label: "WhatsApp",
    description:
      "Upload a screenshot or PDF of a WhatsApp chat and OrganizerOS surfaces what needs a reply, what's urgent, and any plans to add to your calendar.",
    uploadHint: "Upload a screenshot or PDF of your WhatsApp chat.",
    channelNoun: "WhatsApp chat",
    promptHint:
      "This is a WhatsApp chat. Surface anything needing a reply, anything urgent, and any plans/dates worth adding to the calendar. Keep it concise.",
  },
  sms: {
    key: "sms",
    label: "SMS",
    description:
      "Upload a screenshot or PDF of a text conversation and OrganizerOS surfaces what needs a reply, what's urgent, and any plans to add to your calendar.",
    uploadHint: "Upload a screenshot or PDF of your SMS conversation.",
    channelNoun: "text message",
    promptHint:
      "This is an SMS/text message. Surface anything needing a reply, anything urgent, and any plans/dates worth adding to the calendar. Keep it concise.",
  },
  // Kept as a generic alias so older /ai-suggestions/email links still work.
  email: {
    key: "email",
    label: "E-Mail",
    description:
      "Upload a screenshot or PDF of an email and OrganizerOS tells you what to do, what's urgent, what to put in your calendar, and what to delete.",
    uploadHint: "Upload a screenshot or PDF of your email.",
    channelNoun: "email",
    promptHint: EMAIL_HINT,
  },
};

export function getAnalyzer(key: string): AnalyzerConfig | null {
  return ANALYZERS[key] ?? null;
}

/** Sources shown in the nav / hub (in order). */
export const ANALYZER_NAV = ["gmail", "applemail", "whatsapp", "sms"];
export const ANALYZER_LIST = ANALYZER_NAV.map((k) => ANALYZERS[k]);
