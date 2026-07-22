"use client";

import * as React from "react";
import { Loader2, Save, Wand2, Plus, X } from "lucide-react";
import { saveAIConfig, savePresetAction, deletePresetAction, type Preset } from "@/app/brain/actions";
import { BUILTIN_PRESETS } from "@/lib/persona";
import { card, inputCls, btnStyle, ghostBtn, chipCls, ACCENT } from "@/components/brain-ui";

/** systemPromptOverride editor: built-in preset chips, save-to-config, and
 *  named presets (save / apply / delete) persisted in ai_config JSON. */
export function InstructionsEditor({ initialOverride, initialPresets }: { initialOverride: string; initialPresets: Preset[] }) {
  const [override, setOverride] = React.useState(initialOverride);
  const [presets, setPresets] = React.useState<Preset[]>(initialPresets);
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
        {BUILTIN_PRESETS.map((p) => (
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
