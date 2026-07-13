// ----------------------------------------------------------------------------
// "Ask DailyOS" — the chief-of-staff assistant. It answers using the user's
// real data (passed in as `context`) and proposes actions (task/event/note)
// the user can add with one tap. Server-only.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";
import { searchWeb, formatResults } from "./web-search";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantAction {
  type: "task" | "event" | "note" | "complete_task" | "reschedule_task";
  label: string;
  id?: string; // for complete_task / reschedule_task — an existing task's id
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
  type: z.enum(["task", "event", "note", "complete_task", "reschedule_task"]),
  label: z.string().optional().default(""),
  id: z.string().optional(),
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
  // When set, the model wants to look this up on the web before answering.
  search: z.string().optional(),
});

function systemPrompt(context: string, today: string): string {
  return [
    "You are DailyOS — the user's personal chief of staff. You are a genuinely capable AI assistant: match the helpfulness, reasoning and depth of a top general assistant, but you are purpose-built for DailyOS and this user's life admin.",
    "",
    "ANSWER QUALITY: Give complete, genuinely useful answers — think it through, explain, break things into steps, weigh options, and add proactive, relevant suggestions. Do NOT be terse or reply in one or two lines unless the question truly warrants it. Write in clear plain-text sentences and short line-separated points (no markdown symbols like # or *). It is fine to write several sentences or a short list when that helps.",
    "",
    "YOU KNOW DAILYOS. When the user mentions any part of the app, understand it and point them to the right place:",
    "- LifeOS: Today (daily brief); Ask DailyOS (you); The Drop (drop in receipts, letters, screenshots — AI turns them into tasks, events and vault entries); Build My Day (plan a calm schedule); Interests; World Clock; Notes; Calendar (shows ALL dates, including home ones); Tasks (support repeats); Vault (searchable store for files and documents).",
    "- HomeOS (a Pro area for running a home): Subscriptions (renewals, trials, spend), Arrivals (deliveries), Rooms, Devices (warranties, maintenance), a Home Vault (documents), Alerts, and a Home Control Score.",
    "Example: if they ask about a subscription or renewal, tell them it lives in HomeOS → Subscriptions.",
    "",
    "WEB SEARCH: you can look things up on the live internet. If answering well needs current, real-world or external information — news, prices, weather, sports fixtures, showtimes, opening hours, holidays, release dates, product or place details, how-tos, or any fact you are not fully confident is current — then set \"search\" to a concise web query, and leave \"reply\" empty and \"actions\" empty. You will be given the results and asked again. Only search when it genuinely helps; for small talk, or questions about the user's own tasks/events/notes, just answer directly without searching.",
    "SEARCH → CALENDAR: when the user asks you to add something to their calendar (or set a reminder/to-do) that depends on a real date or time you don't know — e.g. \"add the next Arsenal home game\", \"put the new Dune film's release in my calendar\", \"when do the clocks change, add it\" — SEARCH for it first. Then, using the results, propose an `event` action with the actual date and time in start_time (and a `task` if they asked for a to-do). Only use dates/times you found or the user gave — never guess one. If the search doesn't reveal a date, say so instead of inventing one.",
    "",
    "USE THEIR REAL DATA below to be specific: reference their actual tasks and events by name and date, give real counts, and flag anything overdue or clashing. Never invent data that isn't there. If they have none, say so and suggest a good first step.",
    "",
    "ACTIONS: propose actions in `actions` so the user can apply them with one tap, and mention them in your reply. Only propose what the user clearly implied; if they're just asking a question, leave actions empty.",
    "Create new things:",
    "- task: to-dos. Fields: title, due_date (YYYY-MM-DD or null), recurrence (none|daily|weekly|monthly), priority (low|medium|high).",
    "- event: things at a specific time. Fields: title, start_time (ISO 8601, include the time), location (or null).",
    "- note: information to keep. Field: content.",
    "Act on EXISTING tasks (each pending task below is listed with its id):",
    "- complete_task: mark a task done. Fields: id (the task's id).",
    "- reschedule_task: change a task's due date. Fields: id, due_date (YYYY-MM-DD).",
    "Only use complete_task / reschedule_task with an id that appears in the data below — never invent an id.",
    "Always set a short `label` summarising each action (e.g. \"Task: Pay rent — 1 Aug, repeats monthly\" or \"Complete: Call the dentist\").",
    `Resolve relative dates ("tomorrow", "next Tuesday", "the 1st") using TODAY = ${today}.`,
    "",
    "THE USER'S CURRENT DATA:",
    context || "(no tasks, events or notes yet)",
    "",
    'Respond as STRICT JSON: {"reply": string, "actions": Action[], "search"?: string}. Put your full written answer in "reply". No text outside the JSON.',
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
      const baseMessages = [
        { role: "system" as const, content: systemPrompt(context, today) },
        ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      ];

      const raw = await provider.chat({
        json: true,
        temperature: 0.4,
        timeoutMs: 18_000,
        messages: baseMessages,
      });
      let parsed = Schema.parse(JSON.parse(extractJson(raw)));

      // If the model asked to look something up, run the search and give it one
      // more turn to answer (and propose actions) using the results. Capped at a
      // single round. We honour a search request even if the model also drafted a
      // reply, so grounded facts always win over a guess.
      const wantsSearch = parsed.search?.trim();
      if (wantsSearch) {
        const results = await searchWeb(wantsSearch);
        const grounding = results.length
          ? formatResults(wantsSearch, results)
          : `WEB SEARCH RESULTS for "${wantsSearch}": (no results found — answer as best you can and say the search came up empty.)`;
        const raw2 = await provider.chat({
          json: true,
          temperature: 0.4,
          timeoutMs: 18_000,
          messages: [
            ...baseMessages,
            {
              role: "system" as const,
              content:
                grounding +
                "\n\nNow answer the user's question using these results. Weave in the relevant facts, and cite sources by site name inline (e.g. \"(bbc.com)\"). If the user asked you to add something to their calendar or tasks, include the matching `event`/`task` action(s) using the real date and time from these results (never a guessed one). Do NOT set \"search\" again.",
            },
          ],
        });
        parsed = Schema.parse(JSON.parse(extractJson(raw2)));
      }

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
