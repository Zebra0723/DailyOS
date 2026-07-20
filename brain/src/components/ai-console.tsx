"use client";

import * as React from "react";
import { Loader2, Send, Save, Sparkles, Settings, Wand2, Eye, Clock, Play } from "lucide-react";
import { testAIAction, saveAIConfig, saveAISettings, runPlaygroundAction, type AIConfig } from "@/app/brain/actions";
import type { ChatResult } from "@/lib/ai";

const VIOLET = "#bf502b";
const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";
const inputCls = "w-full rounded-lg border border-[#d9d2c6] bg-white p-2.5 text-sm outline-none focus:border-[#bf502b]";
const btnStyle: React.CSSProperties = { background: VIOLET, color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" };

/** Short representative base persona — the real DailyOS app prepends the admin
 *  override to this when it talks to the model. Shown for preview only. */
const BASE_PERSONA =
  "You are the DailyOS assistant — a calm, capable daily-operations partner. You help the user plan their day, track tasks and habits, and answer questions grounded in their data. You are concise, proactive about deadlines, and never invent information.";

const PRESETS: { label: string; text: string }[] = [
  { label: "Concise & direct", text: "Always be extremely concise. Prefer short bullet points over paragraphs, skip pleasantries, and get straight to the answer." },
  { label: "Warm & encouraging", text: "Adopt a warm, encouraging tone. Celebrate progress, be gentle about missed tasks, and end each reply with a short motivating nudge." },
  { label: "Very detailed", text: "Give thorough, step-by-step explanations. Include relevant context, caveats, and concrete examples so nothing is left ambiguous." },
  { label: "Deadline-focused", text: "Proactively surface upcoming deadlines and overdue items in every relevant reply, sorted by urgency, before answering anything else." },
];

export function AiConsole({ config }: { config: AIConfig }) {
  const [override, setOverride] = React.useState(config.systemPromptOverride);

  return (
    <div className="grid gap-4">
      <TestCard />
      <SettingsCard config={config} />
      <PlaygroundCard defaultTemperature={config.temperature} />
      <InstructionCard override={override} setOverride={setOverride} />
      <EffectivePromptCard override={override} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Test the AI (existing quick check)                                  */
/* ------------------------------------------------------------------ */
function TestCard() {
  const [prompt, setPrompt] = React.useState("");
  const [reply, setReply] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);

  async function test() {
    setTesting(true);
    setReply(null);
    setErr(null);
    const r = await testAIAction(prompt);
    setTesting(false);
    if (r.ok) setReply(r.reply ?? "");
    else setErr(r.error ?? "Failed");
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Sparkles className="size-4" style={{ color: VIOLET }} /><h2 className="text-base font-bold">Test the AI</h2></div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask the model something to check it's working…" className={`mt-2 h-20 ${inputCls}`} />
      <button onClick={test} disabled={testing} className="mt-2 inline-flex items-center gap-2" style={{ ...btnStyle, opacity: testing ? 0.6 : 1 }}>
        {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Run test
      </button>
      {err && <div className="mt-3 rounded-lg border border-[#f0c4bd] bg-[#fbe9e7] p-2.5 text-sm text-[#9a3412]">{err}</div>}
      {reply !== null && <div className="mt-3 whitespace-pre-wrap rounded-lg border border-[#f2e6da] bg-[#f5f3ff] p-2.5 text-sm text-[#3b0764]">{reply}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature 1 — editable AI settings                                    */
/* ------------------------------------------------------------------ */
function SettingsCard({ config }: { config: AIConfig }) {
  const [model, setModel] = React.useState(config.model);
  const [temperature, setTemperature] = React.useState(String(config.temperature));
  const [baseUrl, setBaseUrl] = React.useState(config.baseUrl);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await saveAISettings({ model, temperature: Number(temperature), baseUrl });
    setSaving(false);
    setMsg(r.ok ? "Saved ✓ — overrides stored. Unset values fall back to env defaults." : r.error ?? "Failed");
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Settings className="size-4" style={{ color: VIOLET }} /><h2 className="text-base font-bold">AI settings</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">Optional overrides saved alongside the instruction. Pre-filled from the current env defaults.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[#4b443b]">Model</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="llama-3.3-70b-versatile" className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[#4b443b]">Temperature (0–2)</span>
          <input type="number" min={0} max={2} step={0.1} value={temperature} onChange={(e) => setTemperature(e.target.value)} className={inputCls} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-[#4b443b]">Base URL</span>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.groq.com/openai/v1" className={inputCls} />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2" style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save settings
        </button>
        {msg && <span className="text-sm text-[#4b443b]">{msg}</span>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature 2 — prompt playground                                       */
/* ------------------------------------------------------------------ */
function PlaygroundCard({ defaultTemperature }: { defaultTemperature: number }) {
  const [prompt, setPrompt] = React.useState("");
  const [temperature, setTemperature] = React.useState(String(defaultTemperature));
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<ChatResult | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    const r = await runPlaygroundAction(prompt, Number(temperature));
    setRunning(false);
    setResult(r);
  }

  const usage = result?.usage;

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Play className="size-4" style={{ color: VIOLET }} /><h2 className="text-base font-bold">Prompt playground</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">Try a prompt at a chosen temperature. Shows the reply, round-trip latency, and token usage when the provider reports it.</p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Type a prompt to run…" className={`mt-2 h-24 ${inputCls}`} />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-[#4b443b]">Temp</span>
          <input type="number" min={0} max={2} step={0.1} value={temperature} onChange={(e) => setTemperature(e.target.value)} className="w-24 rounded-lg border border-[#d9d2c6] bg-white p-2 text-sm outline-none focus:border-[#bf502b]" />
        </label>
        <button onClick={run} disabled={running} className="inline-flex items-center gap-2" style={{ ...btnStyle, opacity: running ? 0.6 : 1 }}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run
        </button>
      </div>

      {result && !result.ok && (
        <div className="mt-3 rounded-lg border border-[#f0c4bd] bg-[#fbe9e7] p-2.5 text-sm text-[#9a3412]">{result.error ?? "Failed"}</div>
      )}
      {result?.ok && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {typeof result.latencyMs === "number" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#f2e6da] bg-[#f5f3ff] px-2.5 py-1 font-medium text-[#5b21b6]"><Clock className="size-3" /> {result.latencyMs} ms</span>
            )}
            {usage?.prompt_tokens != null && <span className="rounded-full border border-[#e6ded2] bg-[#faf7f1] px-2.5 py-1 font-medium text-[#4b443b]">prompt {usage.prompt_tokens}</span>}
            {usage?.completion_tokens != null && <span className="rounded-full border border-[#e6ded2] bg-[#faf7f1] px-2.5 py-1 font-medium text-[#4b443b]">completion {usage.completion_tokens}</span>}
            {usage?.total_tokens != null && <span className="rounded-full border border-[#e6ded2] bg-[#faf7f1] px-2.5 py-1 font-medium text-[#4b443b]">total {usage.total_tokens}</span>}
            {!usage && <span className="text-[#6b6157]">no token usage reported</span>}
          </div>
          <div className="mt-3 whitespace-pre-wrap rounded-lg border border-[#f2e6da] bg-[#f5f3ff] p-2.5 text-sm text-[#3b0764]">{result.reply}</div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature 3 — instruction + presets                                   */
/* ------------------------------------------------------------------ */
function InstructionCard({ override, setOverride }: { override: string; setOverride: (v: string) => void }) {
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    const r = await saveAIConfig(override);
    setSaving(false);
    setSaveMsg(r.ok ? "Saved ✓ — the assistant will follow this from its next reply." : r.error ?? "Failed");
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Wand2 className="size-4" style={{ color: VIOLET }} /><h2 className="text-base font-bold">Assistant instruction</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">Extra instruction the DailyOS assistant follows on every chat (tone, rules, focus). Leave empty for default behaviour.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setOverride(p.text)}
            className="rounded-full border border-[#f2e6da] bg-[#f5f3ff] px-3 py-1 text-xs font-semibold text-[#5b21b6] transition hover:bg-[#f2e6da]"
          >
            {p.label}
          </button>
        ))}
      </div>
      <textarea value={override} onChange={(e) => setOverride(e.target.value)} placeholder="e.g. Always be extra concise and proactive about deadlines." className={`mt-2 h-28 ${inputCls}`} />
      <div className="mt-2 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2" style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save instruction
        </button>
        {saveMsg && <span className="text-sm text-[#4b443b]">{saveMsg}</span>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature 4 — effective-prompt preview                                */
/* ------------------------------------------------------------------ */
function EffectivePromptCard({ override }: { override: string }) {
  const trimmed = override.trim();
  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Eye className="size-4" style={{ color: VIOLET }} /><h2 className="text-base font-bold">Effective prompt preview</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">A preview of what the assistant actually receives: the base persona plus your override. The base persona below is representative.</p>
      <div className="mt-2 grid gap-2">
        <div className="rounded-lg border border-[#e6ded2] bg-[#faf7f1] p-2.5 text-sm text-[#4b443b]">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#8a7f70]">Base persona (preview)</div>
          <div className="whitespace-pre-wrap">{BASE_PERSONA}</div>
        </div>
        <div className="rounded-lg border border-[#f2e6da] bg-[#f5f3ff] p-2.5 text-sm text-[#3b0764]">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#bf502b]">Your override</div>
          <div className="whitespace-pre-wrap">{trimmed || "(none — default behaviour)"}</div>
        </div>
      </div>
    </section>
  );
}
