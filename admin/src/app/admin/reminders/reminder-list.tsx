"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReminder, toggleReminder, deleteReminder } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";

export type Reminder = {
  id: string;
  text: string;
  done: boolean;
  created_by: string | null;
  created_at: string;
};

export function ReminderList({ initial }: { initial: Reminder[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    start(async () => {
      await addReminder(t);
      router.refresh();
    });
  }

  const field: React.CSSProperties = {
    flex: 1, height: 42, borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff",
    color: "inherit", padding: "0 12px", fontSize: 14, boxSizing: "border-box",
  };

  return (
    <div>
      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input style={field} placeholder="Add a reminder for you and Leo…" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={pending} style={{ height: 42, borderRadius: 10, border: 0, background: "#bf502b", color: "#fff", fontWeight: 600, padding: "0 16px", cursor: "pointer" }}>
          Add
        </button>
      </form>

      {initial.length === 0 ? (
        <p style={{ color: "#6b6157", fontSize: 14 }}>No reminders yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {initial.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #e6ded2", borderRadius: 12, padding: "10px 12px", background: "#fffdf9" }}>
              <input
                type="checkbox"
                checked={r.done}
                onChange={() => start(async () => { await toggleReminder(r.id, !r.done); router.refresh(); })}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, textDecoration: r.done ? "line-through" : "none", color: r.done ? "#9a9083" : "#1c1a17" }}>
                  {r.text}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8a8073" }}>
                  {r.created_by ?? "admin"} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <ConfirmButton
                label="Delete"
                style={{ background: "none", border: 0, color: "#b23b2b", cursor: "pointer", fontSize: 13 }}
                title="Delete this reminder?"
                message="It will be removed for both you and Leo."
                confirmLabel="Delete"
                onConfirm={async () => { await deleteReminder(r.id); router.refresh(); }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
