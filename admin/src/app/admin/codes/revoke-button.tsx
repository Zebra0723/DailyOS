"use client";

import { useTransition } from "react";
import { revokeCode } from "./actions";
import { ConfirmButton } from "@/components/confirm-button";

export function RevokeButton({ code }: { code: string }) {
  const [, start] = useTransition();
  return (
    <ConfirmButton
      label="Revoke"
      style={{ background: "#c0392b", color: "#fff", border: 0, borderRadius: 8, padding: "3px 9px", cursor: "pointer", fontSize: 12 }}
      title="Revoke this code?"
      message={`Code ${code} will be deleted and can no longer be claimed.`}
      warn="This may belong to a real user's reward."
      confirmLabel="Revoke code"
      onConfirm={() => start(() => { void revokeCode(code); })}
    />
  );
}
