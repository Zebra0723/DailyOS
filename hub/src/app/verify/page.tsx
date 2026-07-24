"use client";

import * as React from "react";
import { Logo } from "@/components/logo";
import { signInWithPassword } from "./actions";

export default function VerifyPage() {
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signInWithPassword(password);
    if (res.ok) {
      window.location.href = "/";
      return;
    }
    setError(res.error ?? "Wrong password.");
    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ marginBottom: 6 }}><Logo /></div>
        <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>Enter your admin password to continue.</p>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ width: "100%", padding: "11px 12px", fontSize: 15, border: "1px solid #e0d6c8", borderRadius: 10, background: "#fffdf9", color: "#1c1a17" }}
          />
          {error && (
            <div style={{ background: "#fbe9e7", border: "1px solid #f0c4bd", color: "#9a3412", borderRadius: 10, padding: "9px 12px", fontSize: 13 }}>{error}</div>
          )}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px 12px", fontSize: 15, fontWeight: 600, background: "#bf502b", color: "#fff", border: "none", borderRadius: 10, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
