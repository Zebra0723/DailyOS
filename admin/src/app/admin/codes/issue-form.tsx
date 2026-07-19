"use client";

import { useState } from "react";
import { issueCode } from "./actions";

export function IssueCode() {
  const [kind, setKind] = useState<"discount" | "plan">("plan");
  const [tier, setTier] = useState<"plus" | "pro">("pro");
  const [days, setDays] = useState("0");
  const [percent, setPercent] = useState("10");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function go() {
    setBusy(true); setResult("");
    try {
      const res = await issueCode({ kind, tier, days: Number(days) || 0, percent: Number(percent) || 10 });
      setResult(res.ok ? `Created: ${res.code}` : res.error ?? "Failed.");
    } finally { setBusy(false); }
  }

  const sel: React.CSSProperties = { borderRadius: 8, border: "1px solid #d9d2c6", background: "#fff", color: "inherit", padding: "6px 8px", fontSize: 14 };

  return (
    <div style={{ border: "1px solid #e6ded2", borderRadius: 14, padding: 16, background: "#fffdf9", marginBottom: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Issue a code</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={kind} onChange={(e) => setKind(e.target.value as "discount" | "plan")} style={sel}>
          <option value="plan">Plan grant</option>
          <option value="discount">Discount</option>
        </select>
        {kind === "plan" ? (
          <>
            <select value={tier} onChange={(e) => setTier(e.target.value as "plus" | "pro")} style={sel}>
              <option value="plus">Plus</option>
              <option value="pro">Pro</option>
            </select>
            <select value={days} onChange={(e) => setDays(e.target.value)} style={sel}>
              <option value="0">Lifetime</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </>
        ) : (
          <label style={{ fontSize: 14, display: "inline-flex", gap: 6, alignItems: "center" }}>
            <input type="number" value={percent} min={1} max={100} onChange={(e) => setPercent(e.target.value)} style={{ ...sel, width: 70 }} /> % off
          </label>
        )}
        <button onClick={go} disabled={busy} style={{ background: "#bf502b", color: "#fff", border: 0, borderRadius: 8, padding: "7px 14px", fontWeight: 600, cursor: "pointer" }}>
          {busy ? "Creating…" : "Create code"}
        </button>
        {result && <span style={{ fontSize: 13, fontWeight: 600, color: "#2f8f5f" }}>{result}</span>}
      </div>
    </div>
  );
}
