// ----------------------------------------------------------------------------
// "Ask DailyOS" — the chief-of-staff assistant. It answers using the user's
// real data (passed in as `context`) and proposes actions (task/event/note)
// the user can add with one tap. Server-only.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantAction {
  type: "task" | "event" | "note";
  label: string;
  title?: string;
  content?: string;
  due_date?: string | null;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  priority?: "low" | "medium" | "high";
  start_time?: string | null;
  location?: string | null;
}

export interface AssistantReply {
  reply: string;
  actions: AssistantAction[];
  usedAI: boolean;
}

const ActionSchema = z.object({
  type: z.enum(["task", "event", "note"]),
  label: z.string().optional().default(""),
  title: z.string().optional(),
  content: z.string().optional(),
  due_date: z.string().nullish(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  start_time: z.string().nullish(),
  location: z.string().nullish(),
});

const Schema = z.object({
  reply: z.string().default(""),
  actions: z.array(ActionSchema).default([]),
});

function systemPrompt(context: string, today: string): string {
  return [
    "You are DailyOS — the user's personal chief of staff. You are NOT a generic chatbot.",
    "You can see the user's real data below. Use it to give specific, tailored answers: reference their actual tasks and events by name and date, give real counts, and notice what's overdue or clashing. Never invent data that isn't there.",
    "Voice: warm, concise, practical — like a sharp assistant who knows their life. A few sentences, not an essay. No markdown headings.",
    "",
    "CAPTURING THINGS: If the user mentions anything worth saving — a to-do, an appointment/event, or a note — add it to `actions` so they can save it in one tap. Ask/confirm in your reply (e.g. \"Want me to add these?\"). Only propose what the user clearly implied; if they're just asking a question, leave actions empty.",
    "- task: for to-dos. Fields: title, due_date (YYYY-MM-DD or null), recurrence (none|daily|weekly|monthly), priority (low|medium|high).",
    "- event: for things at a specific time. Fields: title, start_time (ISO 8601, include the time), location (or null).",
    "- note: for information to keep. Field: content.",
    "Always set a short `label` summarising each action (e.g. \"Task: Pay rent — 1 Aug, repeats monthly\").",
    `Resolve relative dates ("tomorrow", "next Tuesday", "the 1st") using TODAY = ${today}.`,
    "",
    "The user's current data:",
    context || "(no tasks, events or notes yet)",
    "",
    'Respond as STRICT JSON: {"reply": string, "actions": Action[]}. No text outside the JSON.',
  ].join("\n");
}

function extractJson(raw: string): string {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  return s >= 0 && e > s ? raw.slice(s, e + 1) : raw;
}

function withLabels(actions: AssistantAction[]): AssistantAction[] {
  return actions.map((a) => {
    if (a.label && a.label.trim()) return a;
    const name = a.title || a.content || a.type;
    return { ...a, label: `${a.type[0].toUpperCase()}${a.type.slice(1)}: ${name}` };
  });
}

export async function askDailyOS(
  history: ChatTurn[],
  context: string,
): Promise<AssistantReply> {
  const provider = getAIProvider();
  const today = new Date().toISOString().slice(0, 10);

  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        temperature: 0.4,
        timeoutMs: 20_000,
        messages: [
          { role: "system", content: systemPrompt(context, today) },
          ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      return {
        reply: parsed.reply.trim() || "Done.",
        actions: withLabels(parsed.actions as AssistantAction[]),
        usedAI: true,
      };
    } catch {
      /* fall through to local */
    }
  }

  return {
    reply:
      "I can't reach the AI right now, so I can't chat this second — but you can still add tasks, events and notes from their pages, and I'll be back shortly.",
    actions: [],
    usedAI: false,
  };
}
