"use client";

import * as React from "react";
import {
  Send,
  Loader2,
  Sparkles,
  CheckSquare,
  CalendarDays,
  StickyNote,
  Check,
  Plus,
  RotateCcw,
} from "lucide-react";
import { askAssistant } from "@/app/(app)/assistant/actions";
import type { AssistantAction, ChatTurn } from "@/lib/ai/assistant";
import {
  createTask,
  setTaskStatus,
  updateTask,
} from "@/app/(app)/tasks/actions";
import { createEvent } from "@/app/(app)/calendar/actions";
import { createNote } from "@/app/(app)/notes/actions";
import { normalizeEventTime } from "@/lib/dates-tz";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Msg = {
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
};

const STARTERS = [
  "What's on my plate today?",
  "Find the next UK bank holiday and add it to my calendar.",
  "Remind me to take the bins out every Tuesday.",
  "Anything overdue or clashing?",
];

const ACTION_ICON = {
  task: CheckSquare,
  event: CalendarDays,
  note: StickyNote,
  complete_task: Check,
  reschedule_task: CalendarDays,
} as const;

function actionVerb(type: AssistantAction["type"]): string {
  if (type === "complete_task") return "Complete";
  if (type === "reschedule_task") return "Reschedule";
  return "Add";
}

export function AssistantChat() {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [added, setAdded] = React.useState<Record<string, boolean>>({});
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const history: ChatTurn[] = next.map((m) => ({ role: m.role, content: m.content }));
      const res = await askAssistant(history);
      setMessages([...next, { role: "assistant", content: res.reply, actions: res.actions }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Something went wrong — try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function addAction(mi: number, ai: number, a: AssistantAction) {
    const key = `${mi}-${ai}`;
    if (added[key]) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      let res: { ok: boolean } = { ok: false };
      let done = "Added";
      if (a.type === "task") {
        res = await createTask({
          title: a.title || a.label || "Task",
          due_date: a.due_date ?? null,
          priority: a.priority ?? "medium",
          recurrence: a.recurrence ?? "none",
        });
        done = "Added to Tasks";
      } else if (a.type === "event") {
        res = await createEvent({
          title: a.title || a.label || "Event",
          // Normalize whatever date/time the model gave (it may have looked it up
          // on the web) into our stored floating form, so it lands on the right
          // day/time in the calendar. Falls back to 9am today if it's unusable.
          start_time: normalizeEventTime(a.start_time) ?? `${today}T09:00:00Z`,
          location: a.location ?? null,
        });
        done = "Added to Calendar";
      } else if (a.type === "note") {
        res = await createNote(a.content || a.title || a.label || "");
        done = "Added to Notes";
      } else if (a.type === "complete_task" && a.id) {
        res = await setTaskStatus(a.id, "completed");
        done = "Task completed";
      } else if (a.type === "reschedule_task" && a.id) {
        res = await updateTask(a.id, { due_date: a.due_date ?? null });
        done = "Task rescheduled";
      }
      if (res.ok) {
        setAdded((p) => ({ ...p, [key]: true }));
        toast({ variant: "success", title: done });
      } else {
        toast({ variant: "error", title: "Couldn't do that" });
      }
    } catch {
      toast({ variant: "error", title: "Couldn't do that" });
    }
  }

  function reset() {
    setMessages([]);
    setAdded({});
    setInput("");
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {messages.length > 0 && (
        <div className="flex justify-end pb-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-4" /> New chat
          </Button>
        </div>
      )}
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="mx-auto max-w-md pt-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevated">
              <Sparkles className="size-6" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">
              Ask DailyOS
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your chief of staff. Ask about your day, look things up on the web,
              or tell me what&apos;s happening and I&apos;ll file it — even adding
              what I find straight to your calendar.
            </p>
            <div className="mt-5 grid gap-2 text-left">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-xl border bg-card px-3.5 py-2.5 text-sm transition-colors hover:bg-accent/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, mi) => (
          <div key={mi} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%]", m.role === "user" && "order-2")}>
              {m.role === "assistant" && (
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="size-3.5 text-primary" /> DailyOS
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border bg-card",
                )}
              >
                {m.content}
              </div>

              {/* Proposed actions */}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 grid gap-2">
                  {m.actions.map((a, ai) => {
                    const Icon = ACTION_ICON[a.type] ?? Plus;
                    const key = `${mi}-${ai}`;
                    const isAdded = added[key];
                    return (
                      <div
                        key={ai}
                        className="flex items-center gap-3 rounded-xl border bg-card p-3"
                      >
                        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                          <Icon className="size-4" />
                        </div>
                        <span className="min-w-0 flex-1 text-sm">{a.label}</span>
                        <Button
                          size="sm"
                          variant={isAdded ? "secondary" : "default"}
                          disabled={isAdded}
                          onClick={() => addAction(mi, ai, a)}
                        >
                          {isAdded ? (
                            <>
                              <Check className="size-4" /> Done
                            </>
                          ) : (
                            <>
                              <Plus className="size-4" /> {actionVerb(a.type)}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> DailyOS is thinking…
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t bg-background pt-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask DailyOS anything…"
          className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" className="size-11 shrink-0" disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
      <div className="flex items-center justify-center gap-1.5 pt-2 text-center text-[11px] text-muted-foreground">
        <Logo withText={false} className="[&_svg]:size-3.5" />
        DailyOS can make mistakes — check anything important before you rely on it.
      </div>
    </div>
  );
}
