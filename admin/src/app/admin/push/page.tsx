"use client";

import { useEffect, useState } from "react";
import {
  sendBroadcast,
  scheduleBroadcast,
  listScheduled,
  cancelScheduled,
  type ScheduledPush,
} from "./actions";
import { DateTimePicker } from "@/components/date-time-picker";

const BRAND = "#bf502b";

export default function PushPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"now" | "later">("now");
  const [when, setWhen] = useState(""); // local "YYYY-MM-DDTHH:mm"
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [scheduled, setScheduled] = useState<ScheduledPush[]>([]);

  async function refresh() {
    try {
      setScheduled(await listScheduled());
    } catch {
      /* table may not be set up yet */
    }
  }
  useEffect(() => {
    void refresh();
  }, []);

  async function submit() {
    setSending(true);
    setStatus(null);
    try {
      if (mode === "now") {
        const res = await sendBroadcast(title, body);
        setStatus(res.ok ? `Sent to ${res.sent} device(s).` : res.error ?? "Failed.");
      } else {
        if (!when) {
          setStatus("Pick a date and time first.");
          return;
        }
        // Convert the picked local wall-clock to a real UTC instant.
        const iso = new Date(when).toISOString();
        const res = await scheduleBroadcast(title, body, iso);
        if (res.ok) {
          setStatus("Scheduled ✓");
          setTitle("");
          setBody("");
          setWhen("");
          void refresh();
        } else {
          setStatus(res.error ?? "Couldn't schedule.");
        }
      }
    } catch {
      setStatus("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  async function cancel(id: string) {
    await cancelScheduled(id);
    void refresh();
  }

  const field: React.CSSProperties = {
    width: "100%", borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff",
    color: "inherit", padding: "10px 12px", fontSize: 14, boxSizing: "border-box",
  };
  const tab = (active: boolean): React.CSSProperties => ({
    flex: 1, height: 38, borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
    border: active ? 0 : "1px solid #d9d2c6",
    background: active ? BRAND : "#fff", color: active ? "#fff" : "#6b6157",
  });

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Broadcast push</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        Send a notification to every subscribed device now, or schedule it for
        later. Dead endpoints are cleaned up automatically.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={tab(mode === "now")} onClick={() => setMode("now")}>Send now</button>
        <button style={tab(mode === "later")} onClick={() => setMode("later")}>Schedule</button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <input style={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea style={{ ...field, minHeight: 90, resize: "vertical" }} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />

        {mode === "later" && (
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#6b6157", marginBottom: 4 }}>Send at</label>
            <DateTimePicker value={when} onChange={setWhen} />
          </div>
        )}

        <button
          onClick={submit}
          disabled={sending}
          style={{ height: 44, borderRadius: 10, border: 0, background: BRAND, color: "#fff", fontWeight: 600, cursor: "pointer", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "Working…" : mode === "now" ? "Send to everyone" : "Schedule broadcast"}
        </button>
        {status && <p style={{ fontSize: 14, color: "#1c1a17", margin: 0 }}>{status}</p>}
      </div>

      {/* Upcoming scheduled broadcasts */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>Scheduled</h2>
        {scheduled.length === 0 ? (
          <p style={{ color: "#8a8073", fontSize: 14, margin: 0 }}>Nothing scheduled.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {scheduled.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  border: "1px solid #e6ded2", borderRadius: 10, background: "#fffdf9",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title || "(no title)"}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a8073" }}>
                    {new Date(s.send_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => cancel(s.id)}
                  style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid #e0b4a6", background: "#fff", color: "#9a3412", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
