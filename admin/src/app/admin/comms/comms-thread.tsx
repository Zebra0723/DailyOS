"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postMessage, deleteMessage, markAllRead } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";
import type { AdminMessage } from "@/lib/comms";

const MAX_LEN = 4000;

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function CommsThread({
  initial,
  email,
}: {
  initial: AdminMessage[];
  email: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest on load / after changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [initial.length]);

  // Best-effort: mark everything read for this admin when the thread opens.
  useEffect(() => {
    markAllRead(email).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    start(async () => {
      await postMessage(t);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 190px)", minHeight: 420 }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #e6ded2",
          borderRadius: 14,
          background: "#fffdf9",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {initial.length === 0 ? (
          <p style={{ color: "#8a8073", fontSize: 14, margin: "auto" }}>
            No messages yet. Say hello 👋
          </p>
        ) : (
          initial.map((m) => {
            const mine = m.author_email === email;
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: mine ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                  alignSelf: mine ? "flex-end" : "flex-start",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6157" }}>
                    {mine ? "You" : m.author_email}
                  </span>
                  <span style={{ fontSize: 11, color: "#8a8073" }}>{relativeTime(m.created_at)}</span>
                </div>
                <div
                  style={{
                    background: mine ? "#bf502b" : "#f2e6da",
                    color: mine ? "#fff" : "#1c1a17",
                    borderRadius: 14,
                    borderTopRightRadius: mine ? 4 : 14,
                    borderTopLeftRadius: mine ? 14 : 4,
                    padding: "9px 13px",
                    fontSize: 14,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.body}
                </div>
                {mine && (
                  <ConfirmButton
                    label="Delete"
                    style={{ background: "none", border: 0, color: "#b23b2b", cursor: "pointer", fontSize: 11, padding: "2px 0", marginTop: 2 }}
                    title="Delete this message?"
                    message="It will be removed for both you and the other admin."
                    confirmLabel="Delete"
                    onConfirm={async () => {
                      await deleteMessage(m.id);
                      router.refresh();
                    }}
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 12 }}>
        <textarea
          value={text}
          maxLength={MAX_LEN}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
          }}
          placeholder="Message the other admin…  (⌘/Ctrl+Enter to send)"
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            borderRadius: 12,
            border: "1px solid #d9d2c6",
            background: "#fff",
            color: "inherit",
            padding: "10px 12px",
            fontSize: 14,
            fontFamily: "inherit",
            lineHeight: 1.45,
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          style={{
            height: 44,
            borderRadius: 12,
            border: 0,
            background: "#bf502b",
            color: "#fff",
            fontWeight: 600,
            padding: "0 20px",
            cursor: pending || !text.trim() ? "default" : "pointer",
            opacity: pending || !text.trim() ? 0.6 : 1,
          }}
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
