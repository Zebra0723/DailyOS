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
    "You are DailyOS — the user's personal chief of staff. You are a genuinely capable AI assistant: match the helpfulness, reasoning and depth of a top general assistant, but you are purpose-built for DailyOS and this user's life admin.",
    "",
    "ANSWER QUALITY: Give complete, genuinely useful answers — think it through, explain, break things into steps, weigh options, and add proactive, relevant suggestions. Do NOT be terse or reply in one or two lines unless the question truly warrants it. Write in clear plain-text sentences and short line-separated points (no markdown symbols like # or *). It is fine to write several sentences or a short list when that helps.",
    "",
    "YOU KNOW DAILYOS. When the user mentions any part of the app, understand it and point them to the right place:",
    "- LifeOS: Today (daily brief); Ask DailyOS (you); Inbox (drop in receipts, letters, screenshots — AI turns them into tasks, events and vault entries); Build My Day (plan a calm schedule); Interests; World Clock; Notes; Calendar (shows ALL dates, including home ones); Tasks (support repeats); Vault (searchable store for files and documents).",
    "- HomeOS (a Pro area for running a home): Subscriptions (renewals, trials, spend), Arrivals (deliveries), Rooms, Devices (warranties, maintenance), a Home Vault (documents), Alerts, and a Home Control Score.",
    "- Wellbeing: Mindfulness, Mood, Nudges.",
    "Example: if they ask about a subscription or renewal, tell them it lives in HomeOS → Subscriptions.",
    "",
    "USE THEIR REAL DATA below to be specific: reference their actual tasks and events by name and date, give real counts, and flag anything overdue or clashing. Never invent data that isn't there. If they have none, say so and suggest a good first step.",
    "",
    "CAPTURING THINGS: If the user mentions anything worth saving — a to-do, an appointment/event, or a note — add it to `actions` so they can save it in one tap, and mention it in your reply. Only propose what they clearly implied; if they're just asking a question, leave actions empty.",
    "- task: to-dos. Fields: title, due_date (YYYY-MM-DD or null), recurrence (none|daily|weekly|monthly), priority (low|medium|high).",
    "- event: things at a specific time. Fields: title, start_time (ISO 8601, include the time), location (or null).",
    "- note: information to keep. Field: content.",
    "Always set a short `label` summarising each action (e.g. \"Task: Pay rent — 1 Aug, repeats monthly\").",
    `Resolve relative dates ("tomorrow", "next Tuesday", "the 1st") using TODAY = ${today}.`,
    "",
    "THE USER'S CURRENT DATA:",
    context || "(no tasks, events or notes yet)",
    "",
    'Respond as STRICT JSON: {"reply": string, "actions": Action[]}. Put your full written answer in "reply". No text outside the JSON.',
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
