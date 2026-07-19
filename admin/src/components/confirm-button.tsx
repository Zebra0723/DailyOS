"use client";

import { useState, useTransition } from "react";

export function ConfirmButton({
  label,
  style,
  title,
  message,
  warn,
  confirmLabel = "Delete",
  onConfirm,
}: {
  label: React.ReactNode;
  style?: React.CSSProperties;
  title: string;
  message: string;
  warn?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function confirm() {
    start(async () => {
      await onConfirm();
      setOpen(false);
    });
  }

  return (
    <>
      <button type="button" style={style} disabled={pending} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div
          onClick={() => !pending && setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(28,20,15,0.45)", display: "grid", placeItems: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 420, background: "#fffdf9", border: "1px solid #e6ded2", borderRadius: 18, padding: 22, boxShadow: "0 24px 60px -12px rgba(28,20,15,0.35)" }}
          >
            <span style={{ display: "inline-block", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: "#bf502b", borderRadius: 999, padding: "3px 10px" }}>
              ⚠ Careful
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 6px" }}>{title}</h3>
            <p style={{ fontSize: 14, color: "#4b443b", margin: "0 0 12px", lineHeight: 1.5 }}>{message}</p>
            {warn && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412", background: "#fbe9e7", border: "1px solid #f0c4bd", borderRadius: 10, padding: "10px 12px", marginBottom: 16 }}>
                {warn}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" disabled={pending} onClick={() => setOpen(false)} style={{ background: "#eae3d7", color: "#1c1a17", border: 0, borderRadius: 10, padding: "9px 16px", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="button" disabled={pending} onClick={confirm} style={{ background: "#c0392b", color: "#fff", border: 0, borderRadius: 10, padding: "9px 16px", fontWeight: 700, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
