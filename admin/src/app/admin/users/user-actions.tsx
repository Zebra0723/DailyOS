"use client";

import { useState, useTransition } from "react";
import { setUserPlan, setUserAdmin, setUserSuspended, deleteUser, sendUserPush, grantTimedPlan } from "../actions";
import { ConfirmButton } from "@/components/confirm-button";

type Tier = "free" | "plus" | "pro";

export function UserActions({
  id,
  email,
  tier,
  isAdmin,
  suspended,
}: {
  id: string;
  email: string;
  tier: string;
  isAdmin: boolean;
  suspended: boolean;
}) {
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState(tier);
  const [admin, setAdmin] = useState(isAdmin);
  const [banned, setBanned] = useState(suspended);
  const [pTitle, setPTitle] = useState("");
  const [pBody, setPBody] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [compTier, setCompTier] = useState<"plus" | "pro">("pro");
  const [compDays, setCompDays] = useState("30");
  const [compStatus, setCompStatus] = useState("");
  const [sending, setSending] = useState(false);

  const btn = (bg: string, fg = "#fff"): React.CSSProperties => ({ background: bg, color: fg, border: 0, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 13 });
  const card: React.CSSProperties = { border: "1px solid #e6ded2", borderRadius: 14, padding: 16, background: "#fffdf9", marginBottom: 16 };
  const field: React.CSSProperties = { width: "100%", borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff", color: "inherit", padding: "9px 12px", fontSize: 14, boxSizing: "border-box" };

  async function push() {
    setSending(true); setPStatus("");
    try {
      const res = await sendUserPush(id, pTitle, pBody);
      setPStatus(res.ok ? `Sent to ${res.sent} device(s).` : res.error ?? "Failed.");
      if (res.ok) { setPTitle(""); setPBody(""); }
    } finally { setSending(false); }
  }

  return (
    <div style={{ opacity: pending ? 0.6 : 1 }}>
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Manage</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#6b6157" }}>Plan</label>
          <select value={plan} disabled={pending} onChange={(e) => { const n = e.target.value as Tier; setPlan(n); start(() => { void setUserPlan(id, n); }); }} style={{ ...field, width: "auto" }}>
            <option value="free">free</option><option value="plus">plus</option><option value="pro">pro</option>
          </select>
          <button disabled={pending} onClick={() => { const n = !admin; setAdmin(n); start(() => { void setUserAdmin(id, n); }); }} style={btn(admin ? "#2f8f5f" : "#eae3d7", admin ? "#fff" : "#1c1a17")}>
            {admin ? "Admin ✓" : "Make admin"}
          </button>
          {banned ? (
            <button disabled={pending} onClick={() => { setBanned(false); start(() => { void setUserSuspended(id, false); }); }} style={btn("#7a6a12")}>Unsuspend</button>
          ) : (
            <ConfirmButton label="Suspend" style={btn("#c98a1a")} title="Suspend this account?" message={`${email} won't be able to sign in.`} warn="This locks out a real person's account." confirmLabel="Suspend" onConfirm={() => { setBanned(true); start(() => { void setUserSuspended(id, true); }); }} />
          )}
          <ConfirmButton label="Delete account" style={btn("#c0392b")} title="Delete this account?" message={`${email}'s account will be permanently removed.`} warn="This permanently deletes a real person's account and cannot be undone." confirmLabel="Delete account" onConfirm={() => start(() => { void deleteUser(id); })} />
        </div>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Comp a plan</h2>
        <p style={{ fontSize: 13, color: "#6b6157", margin: "0 0 10px" }}>Grant a plan for a set time — it expires automatically.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={compTier} disabled={pending} onChange={(e) => setCompTier(e.target.value as "plus" | "pro")} style={{ ...field, width: "auto" }}>
            <option value="plus">Plus</option><option value="pro">Pro</option>
          </select>
          <select value={compDays} disabled={pending} onChange={(e) => setCompDays(e.target.value)} style={{ ...field, width: "auto" }}>
            <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option><option value="0">Lifetime</option>
          </select>
          <button disabled={pending} onClick={() => { setCompStatus(""); start(async () => { await grantTimedPlan(id, compTier, Number(compDays)); setPlan(compTier); setCompStatus("Applied."); }); }} style={btn("#bf502b")}>Apply</button>
          {compStatus && <span style={{ fontSize: 13, color: "#2f8f5f" }}>{compStatus}</span>}
        </div>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Send this user a push</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <input style={field} placeholder="Title" value={pTitle} onChange={(e) => setPTitle(e.target.value)} />
          <textarea style={{ ...field, minHeight: 70, resize: "vertical" }} placeholder="Message" value={pBody} onChange={(e) => setPBody(e.target.value)} />
          <div>
            <button onClick={push} disabled={sending} style={btn("#bf502b")}>{sending ? "Sending…" : "Send"}</button>
            {pStatus && <span style={{ marginLeft: 10, fontSize: 13, color: "#6b6157" }}>{pStatus}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
