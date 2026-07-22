"use client";

import * as React from "react";
import { Loader2, Save, Boxes, ListFilter, Check } from "lucide-react";
import { listModelsAction, saveAISettings, type AIConfig } from "@/app/brain/actions";
import { card, btnStyle, ghostBtn, chipCls, errBox, ACCENT } from "@/components/brain-ui";

/** Browse the provider's model list (GET {baseUrl}/models) and set one as the
 *  active model. Degrades gracefully when the key or endpoint is missing. */
export function ModelsBrowser({ config }: { config: AIConfig }) {
  const [current, setCurrent] = React.useState(config.model);
  const [selected, setSelected] = React.useState(config.model);
  const [models, setModels] = React.useState<string[] | null>(null);
  const [modelsErr, setModelsErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function fetchModels() {
    setLoading(true);
    setModelsErr(null);
    const r = await listModelsAction();
    setLoading(false);
    if (r.ok) setModels(r.models ?? []);
    else {
      setModels(null);
      setModelsErr(r.error ?? "Couldn't reach the provider's model list. Check the API key and Base URL under Settings.");
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await saveAISettings({ model: selected, temperature: config.temperature, baseUrl: config.baseUrl });
    setSaving(false);
    if (r.ok) { setCurrent(selected); setMsg(`Saved ✓ — “${selected}” is now the active model.`); }
    else setMsg(r.error ?? "Failed");
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2"><Boxes className="size-4" style={{ color: ACCENT }} /><h2 className="text-base font-bold">Provider models</h2></div>
      <p className="mt-1 text-sm text-[#6b6157]">Fetch the models the configured provider exposes, then pick one as the active model. Uses the current Base URL and API key.</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={fetchModels} disabled={loading} className={ghostBtn} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ListFilter className="size-4" />} Fetch available models
        </button>
        <span className="text-sm text-[#6b6157]">Active model: <span className="font-semibold text-[#4b443b]">{current}</span></span>
      </div>

      {modelsErr && <div className={`mt-3 ${errBox}`}>{modelsErr}</div>}

      {models && models.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {models.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelected(m)}
              className={`${chipCls} ${m === selected ? "ring-1 ring-[#bf502b]" : ""}`}
            >
              {m === selected && <Check className="mr-1 inline size-3" />}{m}
            </button>
          ))}
        </div>
      )}
      {models && models.length === 0 && <div className="mt-3 text-sm text-[#6b6157]">Provider returned no models.</div>}

      {models && models.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <button onClick={save} disabled={saving || selected === current} className="inline-flex items-center gap-2" style={{ ...btnStyle, opacity: saving || selected === current ? 0.6 : 1 }}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Use selected model
          </button>
          {msg && <span className="text-sm text-[#4b443b]">{msg}</span>}
        </div>
      )}
    </section>
  );
}
