"use client";

import { useTransition } from "react";
import { revokeCode } from "./actions";

export function RevokeButton({ code }: { code: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm(`Revoke code ${code}?`)) start(() => { void revokeCode(code); });
      }}
      style={{ background: "#c0392b", color: "#fff", border: 0, borderRadius: 8, padding: "3px 9px", cursor: "pointer", fontSize: 12 }}
    >
      Revoke
    </button>
  );
}
