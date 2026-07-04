"use server";

import { createClient } from "@/lib/supabase/server";
import { askDailyOS, type ChatTurn, type AssistantReply } from "@/lib/ai/assistant";
import { formatDate } from "@/lib/utils";

/** Build a compact snapshot of the user's data for the assistant's context. */
async function buildContext(
  supabase: ReturnType<typeof createClient>,
): Promise<string> {
  const nowIso = new Date().toISOString();
  const [tasksRes, eventsRes, notesRes] = await Promise.all([
    supabase
      .from("extracted_tasks")
      .select("id,title,due_date,priority,recurrence")
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .limit(25),
    supabase
      .from("calendar_events")
      .select("title,start_time,location")
      .gte("start_time", nowIso)
      .order("start_time", { ascending: true })
      .limit(15),
    supabase
      .from("notes")
      .select("content")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const tasks = (tasksRes.data ?? []) as {
    id: string;
    title: string;
    due_date: string | null;
    priority: string;
    recurrence?: string;
  }[];
  const events = (eventsRes.data ?? []) as {
    title: string;
    start_time: string;
    location: string | null;
  }[];
  const notes = (notesRes.data ?? []) as { content: string }[];

  const parts: string[] = [];
  if (tasks.length) {
    parts.push(
      "PENDING TASKS (id in brackets):\n" +
        tasks
          .map(
            (t) =>
              `- [${t.id}] ${t.title}` +
              (t.due_date ? ` (due ${formatDate(t.due_date)})` : "") +
              (t.priority && t.priority !== "medium" ? ` [${t.priority}]` : "") +
              (t.recurrence && t.recurrence !== "none" ? ` [repeats ${t.recurrence}]` : ""),
          )
          .join("\n"),
    );
  }
  if (events.length) {
    parts.push(
      "UPCOMING EVENTS:\n" +
        events
          .map(
            (e) =>
              `- ${e.title} (${formatDate(e.start_time)})` +
              (e.location ? ` @ ${e.location}` : ""),
          )
          .join("\n"),
    );
  }
  if (notes.length) {
    parts.push(
      "RECENT NOTES:\n" +
        notes.map((n) => `- ${n.content.slice(0, 120)}`).join("\n"),
    );
  }
  return parts.join("\n\n");
}

export async function askAssistant(
  history: ChatTurn[],
): Promise<AssistantReply> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { reply: "Please sign in to chat.", actions: [], usedAI: false };
  }
  const context = await buildContext(supabase);
  return askDailyOS(history, context);
}
