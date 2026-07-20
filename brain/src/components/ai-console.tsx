"use client";

import * as React from "react";
import { Loader2, Send, Save, Sparkles } from "lucide-react";
import { testAIAction, saveAIConfig } from "@/app/brain/actions";

const VIOLET = "#7c3aed";

export function AiConsole({ initialOverride }: { initialOverride: string }) {
  const [prompt, setPrompt] = React.useState("");
  const [reply, setReply] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);

  const [override, setOverride] = React.useState(initialOverride);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function test() {
    setTesting(true);
    setReply(null);
    setErr(null);
    const r = await testAIAction(prompt);
    setTesting(false);
    if (r.ok) setReply(r.reply ?? "");
    else setErr(r.error ?? "Failed");
  }

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    const r = await saveAIConfig(override);
    setSaving(false);
    setSaveMsg(r.ok ? "Saved ✓ — the assistant will follow this from its next reply." : r.error ?? "Failed");
  }

  const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

  return (
    <div className="grid gap-4">
      {/* Test prompt */}
      <section className={card}>
        <div className="flex items-center gap-2"><Sparkles className="size-4" style={{ color: VIOLET }} /><h2 className="text-base font-bold">Test the AI</h2></div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask the model something to check it's working…" className="mt-2 h-20 w-full rounded-lg border border-[#d9d2c6] bg-white p-2.5 text-sm outline-none focus:border-[#7c3aed]" />
        <button onClick={test} disabled={testing} className="mt-2 inline-flex items-center gap-2" style={{ background: VIOLET, color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: testing ? 0.6 : 1 }}>
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Run test
        </button>
        {err && <div className="mt-3 rounded-lg border border-[#f0c4bd] bg-[#fbe9e7] p-2.5 text-sm text-[#9a3412]">{err}</div>}
        {reply !== null && <div className="mt-3 whitespace-pre-wrap rounded-lg border border-[#ddd6fe] bg-[#f5f3ff] p-2.5 text-sm text-[#3b0764]">{reply}</div>}
      </section>

      {/* System-prompt override */}
      <section className={card}>
        <div className="flex items-center gap-2"><Save className="size-4" style={{ color: VIOLET }} /><h2 className="text-base font-bold">Assistant instruction</h2></div>
        <p className="mt-1 text-sm text-[#6b6157]">Extra instruction the DailyOS assistant follows on every chat (tone, rules, focus). Leave empty for default behaviour.</p>
        <textarea value={override} onChange={(e) => setOverride(e.target.value)} placeholder="e.g. Always be extra concise and proactive about deadlines." className="mt-2 h-28 w-full rounded-lg border border-[#d9d2c6] bg-white p-2.5 text-sm outline-none focus:border-[#7c3aed]" />
        <div className="mt-2 flex items-center gap-3">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2" style={{ background: VIOLET, color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save instruction
          </button>
          {saveMsg && <span className="text-sm text-[#4b443b]">{saveMsg}</span>}
        </div>
      </section>
    </div>
  );
}
