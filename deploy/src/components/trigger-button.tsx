"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Rocket, Loader2 } from "lucide-react";
import { triggerDeployAction } from "@/app/deploy/actions";
import { ConfirmButton } from "@/components/confirm-button";

export function TriggerButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function go() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await triggerDeployAction();
      setMsg(r.ok ? "Deploy triggered — it'll appear below shortly." : r.error ?? "Failed.");
      if (r.ok) setTimeout(() => router.refresh(), 3000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <ConfirmButton
        label={
          <span className="inline-flex items-center gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />} Trigger deploy
          </span>
        }
        style={{ display: "inline-flex", background: enabled ? "#bf502b" : "#9ca3af", color: "#fff", border: 0, borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 14, cursor: enabled ? "pointer" : "not-allowed" }}
        title="Trigger a new production deploy?"
        message="This rebuilds and redeploys the project via its Vercel Deploy Hook."
        confirmLabel="Deploy now"
        onConfirm={go}
      />
      {msg && <p className="mt-2 text-sm text-[#4b443b]">{msg}</p>}
    </div>
  );
}
