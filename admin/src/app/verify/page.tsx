"use client";

import { useState } from "react";
import { requestAdminLink } from "./actions";

type State = "idle" | "sending" | "sent" | "denied" | "error";

function box(bg: string, border: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 16px", fontSize: 14, lineHeight: 1.5 };
}

export default function VerifyPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    try {
      const res = await requestAdminLink(email);
      if (res.ok) setState("sent");
      else if ("denied" in res) setState("denied");
      else setState("error");
    } catch {
      setState("error");
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>DailyOS Admin</h1>
        <p style={{ color: "#a99f92", fontSize: 14, margin: "0 0 20px" }}>
          Verify your email to access the backend.
        </p>

        {state === "sent" ? (
          <div style={box("#173a2a", "#2f6a4c")}>
            Check your inbox &mdash; we&apos;ve emailed you a secure sign-in link.
          </div>
        ) : state === "denied" ? (
          <div style={box("#3a1717", "#6a2f2f")}>
            You do not have admin access. Please check with the DailyOS dev team or
            leave the website.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ height: 44, borderRadius: 10, border: "1px solid #3a322a", background: "#201b15", color: "inherit", padding: "0 14px", fontSize: 15 }}
            />
            <button
              type="submit"
              disabled={state === "sending"}
              style={{ height: 44, borderRadius: 10, border: 0, background: "#bf502b", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: state === "sending" ? 0.6 : 1 }}
            >
              {state === "sending" ? "Sending..." : "Email me a sign-in link"}
            </button>
            {state === "error" && (
              <p style={{ color: "#e0796b", fontSize: 13, margin: 0 }}>Something went wrong. Try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
