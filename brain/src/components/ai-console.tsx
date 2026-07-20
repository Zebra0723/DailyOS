"use client";

import * as React from "react";
import { Loader2, Send, Save, Sparkles, Settings, Wand2, Eye, Clock, MessageSquare, Trash2, ListFilter, Plus, X } from "lucide-react";
import {
  testAIAction,
  saveAIConfig,
  saveAISettings,
  runChatAction,
  listModelsAction,
  savePresetAction,
  deletePresetAction,
  type AIConfig,
  type Preset,
} from "@/app/brain/actions";
import type { ChatResult, ChatMessage, ChatUsage } from "@/lib/ai";

const ACCENT = "#bf502b";
const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";
const inputCls = "w-full rounded-lg border border-[#d9d2c6] bg-white p-2.5 text-sm outline-none focus:border-[#bf502b]";
const btnStyle: React.CSSProperties = { background: ACCENT, color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const ghostBtn = "inline-flex items-center gap-1.5 rounded-lg border border-[#d9d2c6] bg-white px-3 py-2 text-sm font-semibold text-[#4b443b] transition hover:bg-[#f2e6da]";
const chipCls = "rounded-full border border-[#e6ded2] bg-[#faf7f1] px-3 py-1 text-xs font-semibold text-[#bf502b] transition hover:bg-[#f2e6da]";
const replyBox = "whitespace-pre-wrap rounded-lg border border-[#f2e6da] bg-[#faf7f1] p-2.5 text-sm text-[#4b443b]";
const errBox = "rounded-lg border border-[#f0c4bd] bg-[#fbe9e7] p-2.5 text-sm text-[#9a3412]";

/** Short representative base persona — the real DailyOS app prepends the admin
 *  override to this when it talks to the model. Shown for preview only. */
const BASE_PERSONA =
  "You are the DailyOS assistant — a calm, capable daily-operations partner. You help the user plan their day, track tasks and habits, and answer questions grounded in their data. You are concise, proactive about deadlines, and never invent information.";

/** Compose the system message the way the real app would: base persona + the
 *  current admin override. Kept in one place so the chat + preview agree. */
function composeSystem(override: string): string {
  const o = override.trim();
  return o ? `${BASE_PERSONA}\n\n${o}` : BASE_PERSONA;
}

const PRESETS: { label: string; text: string }[] = [
  { label: "Concise & direct", text: "Always be extremely concise. Prefer short bullet points over paragraphs, skip pleasantries, and get straight to the answer." },
  { label: "Warm & encouraging", text: "Adopt a warm, encouraging tone. Celebrate progress, be gentle about missed tasks, and end each reply with a short motivating nudge." },
  { label: "Very detailed", text: "Give thorough, step-by-step explanations. Include relevant context, caveats, and concrete examples so nothing is left ambiguous." },
  { label: "Deadline-focused", text: "Proactively surface upcoming deadlines and overdue items in every relevant reply, sorted by urgency, before answering anything else." },
];

export function AiConsole({ config }: { config: AIConfig }) {
  const [override, setOverride] = React.useState(config.systemPromptOverride);
  const [presets, setPresets] = React.useState<Preset[]>(config.presets);
  const [model, setModel] = React.useState(config.model);

  return (
    <div className="grid gap-4">
      <TestCard />
      <SettingsCard config={config} model={model} setModel={setModel} />
      <ChatPlaygroundCard defaultTemperature={config.temperature} override={override} />
      <InstructionCard override={override} setOverride={setOverride} presets={presets} setPresets={setPresets} />
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
      <div className="flex items-center gap-2"><Sparkles className="size-4" style={{ color: ACCENT }} /><h2 className="text-base font-bold">Test the AI</h2></div>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask the model something to check it's working…" className={`mt-2 h-20 ${inputCls}`} />
      <button onClick={test} disabled={testing} className="mt-2 inline-flex items-center gap-2" style={{ ...btnStyle, opacity: testing ? 0.6 : 1 }}>
        {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Run test
      </button>
      {err && <div className={`mt-3 ${errBox}`}>{err}</div>}
      {reply !== null && <div className={`mt-3 ${replyBox}`}>{reply}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AI settings + provider model discovery                              */
/* ------------------------------------------------------------------ */
function SettingsCard({ config, model, setModel }: { config: AIConfig; model: string; setModel: (v: string) => void }) {
  const [temperature, setTemperature] = React.useState(String(config.temperature));
  const [baseUrl, setBaseUrl] = React.useState(config.baseUrl);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [models, setModels] = React.useState<string[] | null>(null);
  const [modelsErr, setModelsErr] = React.useState<string | null>(null);
  const [loadingModels, setLoadingModels] = React.useState(false);

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await saveAISettings({ model, temperature: Number(temperature), baseUrl });
    setSaving(false);
    setMsg(r.ok ? "Saved ✓ — overrides stored. Unset values fall back to env defaults." : r.error ?? "Failed");
  }

  async function fetchModels() {
    setLoadingModels(true);
    setModelsErr(null);
    const r = await listModelsAction();
    setLoadingModels(false);
    if (r.ok) setModels(r.models ?? []);
    else {
      setModels(null);
      setModelsErr(r.error ?? "Couldn't reach the provider's model list.");
    }
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Settings className="size-4" style={{ color: ACCENT }} /><h2 className="text-base font-bold">AI settings</h2></div>
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

      <div className="mt-3 rounded-lg border border-[#e6ded2] bg-[#faf7f1] p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={fetchModels} disabled={loadingModels} className={ghostBtn} style={{ opacity: loadingModels ? 0.6 : 1 }}>
            {loadingModels ? <Loader2 className="size-4 animate-spin" /> : <ListFilter className="size-4" />} Fetch available models
          </button>
          <span className="text-xs text-[#8a8073]">Lists models the provider exposes — click one to set the field.</span>
        </div>
        {modelsErr && <div className={`mt-2 ${errBox}`}>{modelsErr}</div>}
        {models && models.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {models.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                className={`${chipCls} ${m === model ? "ring-1 ring-[#bf502b]" : ""}`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
        {models && models.length === 0 && <div className="mt-2 text-sm text-[#6b6157]">Provider returned no models.</div>}
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
/* Multi-turn chat playground                                          */
/* ------------------------------------------------------------------ */
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

function ChatPlaygroundCard({ defaultTemperature, override }: { defaultTemperature: number; override: string }) {
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

/* ------------------------------------------------------------------ */
/* Assistant instruction + built-in and named presets                 */
/* ------------------------------------------------------------------ */
function InstructionCard({
  override,
  setOverride,
  presets,
  setPresets,
}: {
  override: string;
  setOverride: (v: string) => void;
  presets: Preset[];
  setPresets: (v: Preset[]) => void;
}) {
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [presetName, setPresetName] = React.useState("");
  const [presetBusy, setPresetBusy] = React.useState(false);
  const [presetMsg, setPresetMsg] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaveMsg(null);
    const r = await saveAIConfig(override);
    setSaving(false);
    setSaveMsg(r.ok ? "Saved ✓ — the assistant will follow this from its next reply." : r.error ?? "Failed");
  }

  async function savePreset() {
    const name = presetName.trim();
    if (!name) { setPresetMsg("Enter a name to save this preset."); return; }
    if (!override.trim()) { setPresetMsg("Nothing to save — the instruction is empty."); return; }
    setPresetBusy(true);
    setPresetMsg(null);
    const r = await savePresetAction(name, override);
    setPresetBusy(false);
    if (r.ok) { setPresets(r.presets ?? presets); setPresetName(""); setPresetMsg(`Saved preset “${name}” ✓`); }
    else setPresetMsg(r.error ?? "Failed to save preset.");
  }

  async function deletePreset(name: string) {
    setPresetBusy(true);
    setPresetMsg(null);
    const r = await deletePresetAction(name);
    setPresetBusy(false);
    if (r.ok) { setPresets(r.presets ?? presets); setPresetMsg(`Deleted “${name}”.`); }
    else setPresetMsg(r.error ?? "Failed to delete preset.");
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Wand2 className="size-4" style={{ color: ACCENT }} /><h2 className="text-base font-bold">Assistant instruction</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">Extra instruction the DailyOS assistant follows on every chat (tone, rules, focus). Leave empty for default behaviour.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" onClick={() => setOverride(p.text)} className={chipCls}>
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

      {/* Named presets */}
      <div className="mt-4 border-t border-[#e6ded2] pt-3">
        <div className="text-xs font-bold uppercase tracking-wide text-[#8a7f70]">Saved presets</div>
        <p className="mt-1 text-sm text-[#6b6157]">Save the instruction above under a name, then re-apply or delete it later.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Preset name…" className="w-48 rounded-lg border border-[#d9d2c6] bg-white p-2 text-sm outline-none focus:border-[#bf502b]" />
          <button onClick={savePreset} disabled={presetBusy} className={ghostBtn} style={{ opacity: presetBusy ? 0.6 : 1 }}>
            {presetBusy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Save as preset
          </button>
          {presetMsg && <span className="text-sm text-[#4b443b]">{presetMsg}</span>}
        </div>
        {presets.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((p) => (
              <span key={p.name} className="inline-flex items-center gap-1 rounded-full border border-[#e6ded2] bg-[#faf7f1] py-0.5 pl-3 pr-1 text-xs font-semibold text-[#bf502b]">
                <button type="button" onClick={() => { setOverride(p.text); setPresetMsg(`Applied “${p.name}”.`); }} className="transition hover:underline" title="Apply this preset">
                  {p.name}
                </button>
                <button type="button" onClick={() => deletePreset(p.name)} disabled={presetBusy} className="ml-0.5 grid size-4 place-items-center rounded-full text-[#8a8073] transition hover:bg-[#f2e6da] hover:text-[#bf502b]" title="Delete preset" aria-label={`Delete ${p.name}`}>
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-sm text-[#8a8073]">No saved presets yet.</div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Effective-prompt preview                                            */
/* ------------------------------------------------------------------ */
function EffectivePromptCard({ override }: { override: string }) {
  const trimmed = override.trim();
  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Eye className="size-4" style={{ color: ACCENT }} /><h2 className="text-base font-bold">Effective prompt preview</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">A preview of what the assistant actually receives: the base persona plus your override. The base persona below is representative.</p>
      <div className="mt-2 grid gap-2">
        <div className="rounded-lg border border-[#e6ded2] bg-[#faf7f1] p-2.5 text-sm text-[#4b443b]">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#8a7f70]">Base persona (preview)</div>
          <div className="whitespace-pre-wrap">{BASE_PERSONA}</div>
        </div>
        <div className="rounded-lg border border-[#f2e6da] bg-[#faf7f1] p-2.5 text-sm text-[#4b443b]">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#bf502b]">Your override</div>
          <div className="whitespace-pre-wrap">{trimmed || "(none — default behaviour)"}</div>
        </div>
      </div>
    </section>
  );
}
