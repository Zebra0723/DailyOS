"use client";

import * as React from "react";

/**
 * A DailyOS-branded date & time picker for the admin (no native OS wheel).
 * Value is an ISO-ish local string "YYYY-MM-DDTHH:mm"; onChange emits the same.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad = (n: number) => String(n).padStart(2, "0");

type Parts = { y: number; mo: number; d: number; h: number; mi: number };

function parse(v: string): Parts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
  return m
    ? { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] }
    : null;
}
function fmt(p: Parts): string {
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`;
}
function label(p: Parts): string {
  return new Date(p.y, p.mo - 1, p.d, p.h, p.mi).toLocaleString(undefined, {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

const BRAND = "#bf502b";

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const parsed = parse(value);

  const now = new Date();
  const [draft, setDraft] = React.useState<Parts>(
    parsed ?? {
      y: now.getFullYear(), mo: now.getMonth() + 1, d: now.getDate(), h: 9, mi: 0,
    },
  );
  const [view, setView] = React.useState({ y: draft.y, mo: draft.mo });

  function openPicker() {
    const p =
      parse(value) ?? {
        y: now.getFullYear(), mo: now.getMonth() + 1, d: now.getDate(), h: 9, mi: 0,
      };
    setDraft(p);
    setView({ y: p.y, mo: p.mo });
    setOpen(true);
  }

  const shift = (delta: number) =>
    setView((v) => {
      let mo = v.mo + delta, y = v.y;
      if (mo < 1) { mo = 12; y--; } else if (mo > 12) { mo = 1; y++; }
      return { y, mo };
    });

  const first = new Date(view.y, view.mo - 1, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.mo, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const stepH = (delta: number) =>
    setDraft((p) => ({ ...p, h: (p.h + delta + 24) % 24 }));
  const stepMi = (delta: number) =>
    setDraft((p) => ({ ...p, mi: (p.mi + delta + 60) % 60 }));

  const field: React.CSSProperties = {
    width: "100%", borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff",
    color: "inherit", padding: "10px 12px", fontSize: 14, boxSizing: "border-box",
    textAlign: "left", cursor: "pointer",
  };
  const stepBtn: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 8, border: "1px solid #d9d2c6",
    background: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1, color: BRAND,
  };

  return (
    <>
      <button type="button" style={field} onClick={openPicker}>
        {parsed ? (
          label(parsed)
        ) : (
          <span style={{ color: "#8a8073" }}>{placeholder}</span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200, display: "grid",
            placeItems: "center", background: "rgba(0,0,0,0.4)", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 320, background: "#fffdf9",
              border: "1px solid #e6ded2", borderRadius: 16, padding: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            {/* Month header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button type="button" onClick={() => shift(-1)} style={{ ...stepBtn, border: 0, background: "transparent" }}>‹</button>
              <strong style={{ fontSize: 14 }}>{MONTHS[view.mo - 1]} {view.y}</strong>
              <button type="button" onClick={() => shift(1)} style={{ ...stepBtn, border: 0, background: "transparent" }}>›</button>
            </div>

            {/* Weekday row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 2 }}>
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ textAlign: "center", fontSize: 11, color: "#8a8073", padding: "2px 0" }}>{w}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {cells.map((d, i) => {
                if (d == null) return <div key={`b${i}`} />;
                const selected = draft.y === view.y && draft.mo === view.mo && draft.d === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, y: view.y, mo: view.mo, d }))}
                    style={{
                      height: 34, borderRadius: 8, border: 0, cursor: "pointer", fontSize: 13,
                      background: selected ? BRAND : "transparent",
                      color: selected ? "#fff" : "#1c1a17",
                      fontWeight: selected ? 700 : 400,
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Time steppers */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid #e6ded2" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <button type="button" style={stepBtn} onClick={() => stepH(1)}>▲</button>
                <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", width: 40, textAlign: "center" }}>{pad(draft.h)}</div>
                <button type="button" style={stepBtn} onClick={() => stepH(-1)}>▼</button>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>:</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <button type="button" style={stepBtn} onClick={() => stepMi(5)}>▲</button>
                <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums", width: 40, textAlign: "center" }}>{pad(draft.mi)}</div>
                <button type="button" style={stepBtn} onClick={() => stepMi(-5)}>▼</button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => setOpen(false)} style={{ height: 38, padding: "0 14px", borderRadius: 8, border: "1px solid #d9d2c6", background: "#fff", cursor: "pointer", fontSize: 14 }}>Cancel</button>
              <button
                type="button"
                onClick={() => { onChange(fmt(draft)); setOpen(false); }}
                style={{ height: 38, padding: "0 16px", borderRadius: 8, border: 0, background: BRAND, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
