"use client";

import { useState } from "react";
import { checkAdminEmail } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

type State = "idle" | "working" | "sent" | "denied" | "error";

function box(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.5, marginBottom: 12 };
}
const field: React.CSSProperties = {
  height: 44, borderRadius: 10, border: "1px solid #d9d2c6", background: "#fff",
  color: "inherit", padding: "0 14px", fontSize: 15, boxSizing: "border-box", width: "100%",
};

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setState("working");
    try {
      const { allowed } = await checkAdminEmail(clean);
      if (!allowed) {
        setState("denied");
        return;
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setState(error ? "error" : "sent");
    } catch {
      setState("error");
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ marginBottom: 6 }}><Logo /></div>
        <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>Verify your email to open the database controller.</p>

        {state === "denied" ? (
          <div style={box("#fbe9e7", "#f0c4bd")}>
            This email doesn&apos;t have access to DailyOS Base.
          </div>
        ) : state === "sent" ? (
          <div style={box("#e0f2f1", "#a7d8d3")}>
            Check your inbox &mdash; we&apos;ve emailed you a secure sign-in link.
          </div>
        ) : (
          <form onSubmit={sendLink} style={{ display: "grid", gap: 10 }}>
            <input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={field} autoComplete="username" />
            <button type="submit" disabled={state === "working"} style={{ ...field, height: 44, border: 0, background: "#bf502b", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: state === "working" ? 0.6 : 1 }}>
              {state === "working" ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
