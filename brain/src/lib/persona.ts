// Shared, framework-neutral (no "server-only"/"use client") so both the server
// pages and the client playground import the same persona + compose logic.

/** Short representative base persona — the real DailyOS app prepends the admin
 *  override to this when it talks to the model. Shown for preview only. */
export const BASE_PERSONA =
  "You are the DailyOS assistant — a calm, capable daily-operations partner. You help the user plan their day, track tasks and habits, and answer questions grounded in their data. You are concise, proactive about deadlines, and never invent information.";

/** Compose the system message the way the real app would: base persona + the
 *  current admin override. Kept in one place so the chat + preview agree. */
export function composeSystem(override: string): string {
  const o = override.trim();
  return o ? `${BASE_PERSONA}\n\n${o}` : BASE_PERSONA;
}

/** Built-in instruction presets offered as one-click chips. */
export const BUILTIN_PRESETS: { label: string; text: string }[] = [
  { label: "Concise & direct", text: "Always be extremely concise. Prefer short bullet points over paragraphs, skip pleasantries, and get straight to the answer." },
  { label: "Warm & encouraging", text: "Adopt a warm, encouraging tone. Celebrate progress, be gentle about missed tasks, and end each reply with a short motivating nudge." },
  { label: "Very detailed", text: "Give thorough, step-by-step explanations. Include relevant context, caveats, and concrete examples so nothing is left ambiguous." },
  { label: "Deadline-focused", text: "Proactively surface upcoming deadlines and overdue items in every relevant reply, sorted by urgency, before answering anything else." },
];
