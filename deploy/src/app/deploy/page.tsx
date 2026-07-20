import Link from "next/link";
import { ExternalLink, GitBranch } from "lucide-react";
import { listDeployments, vercelConfigured, deployHookConfigured } from "@/lib/vercel";
import { TriggerButton } from "@/components/trigger-button";
import { DeploymentActions } from "@/components/deployment-actions";

export const dynamic = "force-dynamic";

const STATE_STYLE: Record<string, { bg: string; fg: string }> = {
  READY: { bg: "#dcfce7", fg: "#166534" },
  ERROR: { bg: "#fbe9e7", fg: "#9a3412" },
  BUILDING: { bg: "#fef3c7", fg: "#92400e" },
  QUEUED: { bg: "#e5e7eb", fg: "#374151" },
  CANCELED: { bg: "#e5e7eb", fg: "#6b7280" },
  INITIALIZING: { bg: "#fef3c7", fg: "#92400e" },
};

export default async function DeployPage() {
  const res = await listDeployments();

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Deployments</h1>
          <p className="text-sm text-[#6b6157]">Your latest Vercel deployments.</p>
        </div>
        <TriggerButton enabled={deployHookConfigured()} />
      </div>

      {!vercelConfigured() ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_TOKEN</code> (and optionally <code>VC_PROJECT_ID</code> / <code>VC_TEAM_ID</code>) in this project&apos;s environment.
        </div>
      ) : !res.ok ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{res.error}</div>
      ) : (
        <div className="grid gap-2">
          {(res.deployments ?? []).length === 0 ? (
            <p className="text-sm text-[#8a8073]">No deployments found.</p>
          ) : (
            res.deployments!.map((d) => {
              const s = STATE_STYLE[d.state] ?? { bg: "#e5e7eb", fg: "#374151" };
              return (
                <div key={d.uid} className="rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>{d.state}</span>
                    {d.target === "production" && <span className="rounded-md bg-[#bf502b] px-2 py-0.5 text-[11px] font-bold text-white">PROD</span>}
                    <span className="ml-auto text-xs text-[#8a8073]">{d.created ? new Date(d.created).toLocaleString() : ""}</span>
                  </div>
                  <Link href={`/deploy/${d.uid}`} className="mt-1.5 block truncate text-sm font-medium hover:text-[#bf502b] hover:underline">
                    {d.message || d.name || d.url}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#8a8073]">
                    {d.branch && <span className="inline-flex items-center gap-1"><GitBranch className="size-3" /> {d.branch}</span>}
                    {d.url && (
                      <a href={`https://${d.url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#bf502b] hover:underline">
                        <ExternalLink className="size-3" /> {d.url}
                      </a>
                    )}
                  </div>
                  <DeploymentActions uid={d.uid} name={d.name} target={d.target} state={d.state} showDetails />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
