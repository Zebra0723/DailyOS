import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle, GitBranch, GitCommit, ExternalLink, Clock } from "lucide-react";
import { listDeployments, vercelConfigured, deployHookConfigured } from "@/lib/vercel";
import { TriggerButton } from "@/components/trigger-button";

export const dynamic = "force-dynamic";

const STATE_STYLE: Record<string, { bg: string; fg: string }> = {
  READY: { bg: "#dcfce7", fg: "#166534" },
  ERROR: { bg: "#fbe9e7", fg: "#9a3412" },
  BUILDING: { bg: "#fef3c7", fg: "#92400e" },
  QUEUED: { bg: "#e5e7eb", fg: "#374151" },
  CANCELED: { bg: "#e5e7eb", fg: "#6b7280" },
  INITIALIZING: { bg: "#fef3c7", fg: "#92400e" },
};

function relTime(ts: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function OverviewPage() {
  const configured = vercelConfigured();
  const res = configured ? await listDeployments() : { ok: false as const, error: "config" };

  const deployments = res.ok ? res.deployments ?? [] : [];
  const prod = deployments.find((d) => d.target === "production") ?? null;
  const recent = deployments.slice(0, 10);
  const succeeded = recent.filter((d) => d.state === "READY").length;
  const failed = recent.filter((d) => d.state === "ERROR").length;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-[#6b6157]">Production status at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <TriggerButton enabled={deployHookConfigured()} />
          <Link
            href="/deploy/deployments"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3 py-2 text-sm font-semibold text-[#4b443b] hover:bg-[#f2e6da]"
          >
            All deployments <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {!configured ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_TOKEN</code> (and optionally <code>VC_PROJECT_ID</code> / <code>VC_TEAM_ID</code>) in this project&apos;s environment to see production status.
        </div>
      ) : !res.ok ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{res.error}</div>
      ) : (
        <>
          {/* Current production deployment */}
          <section className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md bg-[#bf502b] px-2 py-0.5 text-[11px] font-bold text-white">PRODUCTION</span>
              {prod && (() => {
                const ps = STATE_STYLE[prod.state] ?? { bg: "#e5e7eb", fg: "#374151" };
                return (
                  <span
                    className="rounded-md px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: ps.bg, color: ps.fg }}
                  >
                    {prod.state}
                  </span>
                );
              })()}
              {prod?.created ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-[#8a8073]">
                  <Clock className="size-3" /> live {relTime(prod.created)}
                </span>
              ) : null}
            </div>

            {!prod ? (
              <p className="text-sm text-[#8a8073]">No production deployment found yet.</p>
            ) : (
              <>
                <p className="text-base font-semibold text-[#1c1a17]">
                  {prod.message || prod.name || prod.url || "Production deployment"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6b6157]">
                  {prod.branch && (
                    <span className="inline-flex items-center gap-1">
                      <GitBranch className="size-3.5 text-[#8a8073]" /> {prod.branch}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <GitCommit className="size-3.5 text-[#8a8073]" />
                    {prod.created ? new Date(prod.created).toLocaleString() : "—"}
                  </span>
                </div>
                {prod.url && (
                  <a
                    href={`https://${prod.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#bf502b] hover:underline"
                  >
                    <ExternalLink className="size-4" /> {prod.url}
                  </a>
                )}
              </>
            )}
          </section>

          {/* Counts */}
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">Recent builds</p>
              <p className="mt-1 text-2xl font-bold text-[#1c1a17]">{recent.length}</p>
            </div>
            <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#166534]">
                <CheckCircle2 className="size-3.5" /> Succeeded
              </p>
              <p className="mt-1 text-2xl font-bold text-[#166534]">{succeeded}</p>
            </div>
            <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9a3412]">
                <XCircle className="size-3.5" /> Failed
              </p>
              <p className="mt-1 text-2xl font-bold text-[#9a3412]">{failed}</p>
            </div>
          </section>

          {/* Recent outcomes strip */}
          <section className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">Recent outcomes</h2>
              <Link href="/deploy/deployments" className="text-xs font-semibold text-[#bf502b] hover:underline">
                View all
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-[#8a8073]">No deployments found.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recent.map((d) => {
                  const s = STATE_STYLE[d.state] ?? { bg: "#e5e7eb", fg: "#374151" };
                  return (
                    <Link
                      key={d.uid}
                      href={`/deploy/${d.uid}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] px-2.5 py-1.5 transition-colors hover:bg-[#f2e6da]"
                      title={d.message || d.name || d.url}
                    >
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: s.bg, color: s.fg }}>
                        {d.state}
                      </span>
                      <span className="text-[11px] text-[#8a8073]">{relTime(d.created)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
