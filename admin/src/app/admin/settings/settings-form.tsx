"use client";

import { useState } from "react";
import { saveConfig } from "./actions";

export function SettingsForm({
  announcement: initial,
  maintenance: initialM,
}: {
  announcement: string;
  maintenance: boolean;
}) {
  const [announcement, setAnnouncement] = useState(initial);
  const [maintenance, setMaintenance] = useState(initialM);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setStatus("");
    try {
      const res = await saveConfig(announcement, maintenance);
      setStatus(res.ok ? "Saved — live for all users." : res.error ?? "Failed. Is app_config set up?");
    } finally { setBusy(false); }
  }

  const field: React.CSSProperties = { width: "100%", borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff", color: "inherit", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" };
  const card: React.CSSProperties = { border: "1px solid #e6ded2", borderRadius: 14, padding: 16, background: "#fffdf9", marginBottom: 16 };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Announcement banner</h2>
        <p style={{ fontSize: 13, color: "#6b6157", margin: "0 0 10px" }}>Shown to every user across DailyOS. Leave blank to hide it.</p>
        <textarea style={{ ...field, minHeight: 70, resize: "vertical" }} placeholder="e.g. New: bookmark items to your home screen!" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
      </div>
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Maintenance mode</h2>
        <p style={{ fontSize: 13, color: "#6b6157", margin: "0 0 10px" }}>When on, users see a &ldquo;back soon&rdquo; screen. Admins can still use the app.</p>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} style={{ width: 18, height: 18 }} />
          {maintenance ? "On — app is in maintenance" : "Off — app is live"}
        </label>
      </div>
      <button onClick={save} disabled={busy} style={{ background: "#bf502b", color: "#fff", border: 0, borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "Saving…" : "Save settings"}
      </button>
      {status && <p style={{ fontSize: 13, color: "#1c1a17", marginTop: 10 }}>{status}</p>}
    </div>
  );
}
