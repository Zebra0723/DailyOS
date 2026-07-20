"use client";

import * as React from "react";
import { Loader2, Megaphone, Wrench, Play } from "lucide-react";
import { runCronAction, saveOpsConfig } from "@/app/pulse/actions";

const ROSE = "#bf502b";

export function OpsControls({
  initialAnnouncement,
  initialMaintenance,
  cronConfigured,
}: {
  initialAnnouncement: string;
  initialMaintenance: boolean;
  cronConfigured: boolean;
}) {
  const [announcement, setAnnouncement] = React.useState(initialAnnouncement);
  const [maintenance, setMaintenance] = React.useState(initialMaintenance);
  const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
  const [cronMsg, setCronMsg] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [running, setRunning] = React.useState(false);

  async function save(nextMaint?: boolean) {
    setSaving(true);
    setSavedMsg(null);
    const m = nextMaint ?? maintenance;
    const r = await saveOpsConfig(announcement, m);
    setSaving(false);
    setSavedMsg(r.ok ? "Saved ✓" : r.error ?? "Failed");
  }

  async function runCron() {
    setRunning(true);
    setCronMsg(null);
    const r = await runCronAction();
    setRunning(false);
    setCronMsg(r.ok ? `Cron ran (HTTP ${r.status}) ✓` : r.error ?? `Failed (${r.status})`);
  }

  const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

  return (
    <div className="grid gap-4">
      {/* Announcement + maintenance */}
      <section className={card}>
        <div className="flex items-center gap-2">
          <Megaphone className="size-4" style={{ color: ROSE }} />
          <h2 className="text-base font-bold">Announcement banner</h2>
        </div>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="Show a banner across the app (leave empty for none)…"
          className="mt-2 h-20 w-full rounded-lg border border-[#d9d2c6] bg-white p-2.5 text-sm outline-none focus:border-[#bf502b]"
        />
        <label className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[#e6ded2] p-2.5">
          <span className="flex items-center gap-2 text-sm font-medium"><Wrench className="size-4" style={{ color: ROSE }} /> Maintenance mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={maintenance}
            onClick={() => { const n = !maintenance; setMaintenance(n); void save(n); }}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            style={{ background: maintenance ? ROSE : "#d9d2c6" }}
          >
            <span className="absolute top-0.5 size-5 rounded-full bg-white shadow transition-all" style={{ left: maintenance ? "1.375rem" : "0.125rem" }} />
          </button>
        </label>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => save()} disabled={saving} style={{ background: ROSE, color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save banner"}
          </button>
          {savedMsg && <span className="text-sm text-[#4b443b]">{savedMsg}</span>}
        </div>
      </section>

      {/* Run cron */}
      <section className={card}>
        <div className="flex items-center gap-2">
          <Play className="size-4" style={{ color: ROSE }} />
          <h2 className="text-base font-bold">Run reminders now</h2>
        </div>
        <p className="mt-1 text-sm text-[#6b6157]">Fires the reminder + scheduled-broadcast cron immediately.</p>
        <div className="mt-2 flex items-center gap-3">
          <button onClick={runCron} disabled={running} className="inline-flex items-center gap-2" style={{ background: ROSE, color: "#fff", border: 0, borderRadius: 10, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: running ? 0.6 : 1 }}>
            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />} Run cron
          </button>
          {cronMsg && <span className="text-sm text-[#4b443b]">{cronMsg}</span>}
        </div>
        {!cronConfigured && <p className="mt-2 text-xs text-[#8a8073]">Set <code>CRON_SECRET</code> (and <code>MAIN_APP_URL</code>) if the cron endpoint is protected.</p>}
      </section>
    </div>
  );
}
