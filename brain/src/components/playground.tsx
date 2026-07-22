"use client";

import * as React from "react";
import { Loader2, Send, MessageSquare, Clock, Trash2 } from "lucide-react";
import { runChatAction } from "@/app/brain/actions";
import { composeSystem } from "@/lib/persona";
import { card, inputCls, btnStyle, replyBox, errBox, ACCENT } from "@/components/brain-ui";
import type { ChatResult, ChatMessage, ChatUsage } from "@/lib/ai";

type ChatTurn = { role: "user" | "assistant"; content: string; latencyMs?: number; usage?: ChatUsage; error?: boolean };

function Pills({ latencyMs, usage }: { latencyMs?: number; usage?: ChatUsage }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
      {typeof latencyMs === "number" && (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#e6ded2] bg-[#fffdf9] px-2 py-0.5 font-medium text-[#bf502b]"><Clock className="size-3" /> {latencyMs} ms</span>
      )}
      {usage?.prompt_tokens != null && <span className="rounded-full border border-[#e6ded2] bg-[#fffdf9] px-2 py-0.5 font-medium text-[#4b443b]">prompt {usage.prompt_tokens}</span>}
      {usage?.completion_tokens != null && <span className="rounded-full border border-[#e6ded2] bg-[#fffdf9] px-2 py-0.5 font-medium text-[#4b443b]">completion {usage.completion_tokens}</span>}
      {usage?.total_tokens != null && <span className="rounded-full border border-[#e6ded2] bg-[#fffdf9] px-2 py-0.5 font-medium text-[#4b443b]">total {usage.total_tokens}</span>}
    </div>
  );
}

/** Multi-turn chat playground. Sends the whole conversation history plus the
 *  saved system-prompt override each turn so it previews the real assistant. */
export function Playground({ defaultTemperature, override }: { defaultTemperature: number; override: string }) {
  const [turns, setTurns] = React.useState<ChatTurn[]>([]);
  const [input, setInput] = React.useState("");
  const [temperature, setTemperature] = React.useState(String(defaultTemperature));
  const [running, setRunning] = React.useState(false);

  async function send() {
    const text = input.trim();
    if (!text || running) return;
    const history = [...turns, { role: "user" as const, content: text }];
    setTurns(history);
    setInput("");
    setRunning(true);
    // Send the full conversation so far (user/assistant only) as history.
    const apiMessages: ChatMessage[] = history
      .filter((t) => !t.error)
      .map((t) => ({ role: t.role, content: t.content }));
    const r: ChatResult = await runChatAction(apiMessages, Number(temperature), composeSystem(override));
    setRunning(false);
    if (r.ok) {
      setTurns((prev) => [...prev, { role: "assistant", content: r.reply ?? "", latencyMs: r.latencyMs, usage: r.usage }]);
    } else {
      setTurns((prev) => [...prev, { role: "assistant", content: r.error ?? "Failed", latencyMs: r.latencyMs, error: true }]);
    }
  }

  function clear() {
    setTurns([]);
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2">
        <MessageSquare className="size-4" style={{ color: ACCENT }} />
        <h2 className="text-base font-bold">Chat playground</h2>
        {turns.length > 0 && (
          <button onClick={clear} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-[#d9d2c6] bg-white px-2.5 py-1 text-xs font-semibold text-[#6b6157] transition hover:bg-[#f2e6da]">
            <Trash2 className="size-3.5" /> Clear
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-[#6b6157]">A real multi-turn conversation. The whole thread plus your current assistant instruction is sent each turn, so it previews the actual assistant. ⌘/Ctrl+Enter to send.</p>

      {turns.length > 0 && (
        <div className="mt-3 grid gap-2">
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[85%]">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a8073]">{t.role === "user" ? "You" : "Assistant"}</div>
                {t.role === "user" ? (
                  <div className="whitespace-pre-wrap rounded-lg px-3 py-2 text-sm text-white" style={{ background: ACCENT }}>{t.content}</div>
                ) : (
                  <div className={t.error ? errBox : replyBox}>{t.content}</div>
                )}
                {t.role === "assistant" && !t.error && <Pills latencyMs={t.latencyMs} usage={t.usage} />}
              </div>
            </div>
          ))}
          {running && (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#f2e6da] bg-[#faf7f1] px-3 py-2 text-sm text-[#6b6157]">
                <Loader2 className="size-4 animate-spin" /> thinking…
              </div>
            </div>
          )}
        </div>
      )}

      <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} placeholder="Type a message…" className={`mt-3 h-20 ${inputCls}`} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[#4b443b]">Temp</span>
          <input type="number" min={0} max={2} step={0.1} value={temperature} onChange={(e) => setTemperature(e.target.value)} className="w-24 rounded-lg border border-[#d9d2c6] bg-white p-2 text-sm outline-none focus:border-[#bf502b]" />
        </label>
        <button onClick={send} disabled={running || !input.trim()} className="inline-flex items-center gap-2" style={{ ...btnStyle, opacity: running || !input.trim() ? 0.6 : 1 }}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send
        </button>
      </div>
    </section>
  );
}
