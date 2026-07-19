"use client";

import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/verify";
  }
  return (
    <div style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Account</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        Sign in is by email link. Sign out below.
      </p>
      <button onClick={signOut} style={{ background: "#eae3d7", color: "#1c1a17", border: 0, borderRadius: 10, padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}>
        Sign out
      </button>
    </div>
  );
}
