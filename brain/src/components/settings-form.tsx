"use client";

import * as React from "react";
import { Loader2, Save, SlidersHorizontal } from "lucide-react";
import { saveAISettings, type AIConfig } from "@/app/brain/actions";
import { card, inputCls, btnStyle, ACCENT } from "@/components/brain-ui";

/** Editable model / temperature / base-URL overrides, saved into ai_config.
 *  Unset values fall back to the env defaults (Groq). */
export function SettingsForm({ config }: { config: AIConfig }) {
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
      <div className="flex items-center gap-2"><SlidersHorizontal className="size-4" style={{ color: ACCENT }} /><h2 className="text-base font-bold">AI settings</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">Optional overrides for the model, sampling temperature, and provider endpoint. Pre-filled from the current env defaults. Browse the provider&apos;s model list under Models.</p>
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
