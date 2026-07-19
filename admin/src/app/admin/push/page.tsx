"use client";

import { useState } from "react";
import { sendBroadcast } from "./actions";

export default function PushPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    setStatus(null);
    try {
      const res = await sendBroadcast(title, body);
      setStatus(res.ok ? `Sent to ${res.sent} device(s).` : res.error ?? "Failed.");
    } catch {
      setStatus("Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  const field: React.CSSProperties = {
    width: "100%", borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff",
    color: "inherit", padding: "10px 12px", fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Broadcast push</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        Send a notification to every subscribed device. De-duplicated dead
        endpoints are cleaned up automatically.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        <input style={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea style={{ ...field, minHeight: 90, resize: "vertical" }} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
        <button
          onClick={send}
          disabled={sending}
          style={{ height: 44, borderRadius: 10, border: 0, background: "#bf502b", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "Sending…" : "Send to everyone"}
        </button>
        {status && <p style={{ fontSize: 14, color: "#1c1a17", margin: 0 }}>{status}</p>}
      </div>
    </div>
  );
}
