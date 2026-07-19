"use client";

import { useState } from "react";
import { checkAdminEmail } from "./actions";
import { createClient } from "@/lib/supabase/client";

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
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function gate(): Promise<boolean> {
    const clean = email.trim().toLowerCase();
    if (!clean) return false;
    const { allowed } = await checkAdminEmail(clean);
    if (!allowed) {
      setState("denied");
      return false;
    }
    return true;
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setState("working");
    setMsg("");
    try {
      if (!(await gate())) return;
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setState("error");
        setMsg("Wrong email or password. First time here? Use the email link below to get in, then set a password under Account.");
        return;
      }
      window.location.href = "/admin";
    } catch {
      setState("error");
      setMsg("Something went wrong. Try again.");
    }
  }

  async function sendLink() {
    setState("working");
    setMsg("");
    try {
      if (!(await gate())) return;
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setState("error");
        setMsg("Couldn't send the link.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setMsg("Something went wrong. Try again.");
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>DailyOS Admin</h1>
        <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>Sign in to the backend.</p>

        {state === "denied" ? (
          <div style={box("#fbe9e7", "#f0c4bd")}>
            You do not have admin access. Please check with the DailyOS dev team or
            leave the website.
          </div>
        ) : state === "sent" ? (
          <div style={box("#e7f5ec", "#b6ddc3")}>
            Check your inbox &mdash; we&apos;ve emailed you a secure sign-in link.
          </div>
        ) : (
          <form onSubmit={signIn} style={{ display: "grid", gap: 10 }}>
            <input type="email" required autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={field} autoComplete="username" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={field} autoComplete="current-password" />
            <button type="submit" disabled={state === "working"} style={{ ...field, height: 44, border: 0, background: "#bf502b", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: state === "working" ? 0.6 : 1 }}>
              {state === "working" ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" onClick={sendLink} disabled={state === "working"} style={{ background: "none", border: 0, color: "#6b6157", fontSize: 13, cursor: "pointer", textDecoration: "underline", padding: 4 }}>
              Email me a sign-in link instead
            </button>
            {msg && <p style={{ color: "#b23b2b", fontSize: 13, margin: 0 }}>{msg}</p>}
          </form>
        )}
      </div>
    </main>
  );
}
