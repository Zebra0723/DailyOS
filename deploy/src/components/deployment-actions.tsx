"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpCircle, RefreshCw, XCircle, ScrollText, History, Info } from "lucide-react";
import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import {
  promoteDeploymentAction,
  redeployDeploymentAction,
  cancelDeploymentAction,
  rollbackDeploymentAction,
} from "@/app/deploy/actions";

const BTN: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#bf502b",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: "5px 10px",
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};

export function DeploymentActions({
  uid,
  name,
  target,
  state,
  showDetails = false,
}: {
  uid: string;
  name: string;
  target: string | null;
  state: string;
  /** Show a link to the deployment detail page (used on the list). */
  showDetails?: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = React.useState<string | null>(null);
  const building = state === "BUILDING" || state === "QUEUED" || state === "INITIALIZING";
  const isProd = target === "production";
  const ready = state === "READY";

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    return async () => {
      setMsg(null);
      const r = await fn();
      setMsg(r.ok ? okMsg : r.error ?? "Failed.");
      if (r.ok) setTimeout(() => router.refresh(), 1500);
    };
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {showDetails && (
        <Link
          href={`/deploy/${uid}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1 text-xs font-semibold text-[#4b443b] hover:bg-[#f3ede2]"
        >
          <Info className="size-3.5" /> Details
        </Link>
      )}

      <Link
        href={`/deploy/logs/${uid}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-2.5 py-1 text-xs font-semibold text-[#4b443b] hover:bg-[#f3ede2]"
      >
        <ScrollText className="size-3.5" /> Logs
      </Link>

      {!building && !isProd && (
        <ConfirmButton
          label={
            <span className="inline-flex items-center gap-1.5">
              <ArrowUpCircle className="size-3.5" /> Promote
            </span>
          }
          style={BTN}
          title="Promote to production?"
          message="This makes the selected deployment your live production deployment."
          confirmLabel="Promote"
          onConfirm={run(() => promoteDeploymentAction(uid), "Promoted — refreshing…")}
        />
      )}

      {!building && (
        <ConfirmButton
          label={
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="size-3.5" /> Redeploy
            </span>
          }
          style={BTN}
          title="Redeploy this build?"
          message="This creates a new deployment from the same source commit."
          confirmLabel="Redeploy"
          onConfirm={run(
            () => redeployDeploymentAction(uid, name, target),
            "Redeploy started — refreshing…",
          )}
        />
      )}

      {ready && (
        <ConfirmButton
          label={
            <span className="inline-flex items-center gap-1.5">
              <History className="size-3.5" /> Rollback to this
            </span>
          }
          style={{ ...BTN, background: "#8a3d20" }}
          title="Roll production back to this deployment?"
          message="This makes the selected build your live production deployment, replacing whatever is currently serving traffic."
          warn="Users will immediately be served this older build. Make sure it is the version you want live."
          confirmLabel="Roll back"
          onConfirm={run(() => rollbackDeploymentAction(uid, name), "Rolling back — refreshing…")}
        />
      )}

      {building && (
        <ConfirmButton
          label={
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="size-3.5" /> Cancel
            </span>
          }
          style={{ ...BTN, background: "#c0392b" }}
          title="Cancel this deployment?"
          message="This stops the build that is currently in progress."
          confirmLabel="Cancel build"
          onConfirm={run(() => cancelDeploymentAction(uid), "Cancelled — refreshing…")}
        />
      )}

      {msg && <span className="text-xs text-[#4b443b]">{msg}</span>}
    </div>
  );
}
