"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const field: React.CSSProperties = {
  height: 44, borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff",
  color: "inherit", padding: "0 14px", fontSize: 15, boxSizing: "border-box", width: "100%",
};

export default function AccountPage() {
  const [pw, setPw] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      setStatus("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const { error } = await createClient().auth.updateUser({ password: pw });
      setStatus(error ? "Couldn't update the password." : "Password saved — you can sign in with it next time.");
      if (!error) setPw("");
    } catch {
      setStatus("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/verify";
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Account</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        Set a password for instant sign-in next time (no email link needed).
      </p>
      <form onSubmit={save} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        <input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} style={field} autoComplete="new-password" />
        <button type="submit" disabled={busy} style={{ ...field, border: 0, background: "#bf502b", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Saving…" : "Save password"}
        </button>
        {status && <p style={{ fontSize: 13, margin: 0, color: "#1c1a17" }}>{status}</p>}
      </form>
      <button onClick={signOut} style={{ background: "#eae3d7", color: "#1c1a17", border: 0, borderRadius: 10, padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}>
        Sign out
      </button>
    </div>
  );
}
