import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  GitCommit,
  History,
  ScrollText,
  User,
} from "lucide-react";
import {
  getDeployment,
  getDeploymentLogs,
  vercelConfigured,
} from "@/lib/vercel";
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

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8a8073]">{label}</dt>
      <dd className="text-sm text-[#1c1a17] break-words">{children}</dd>
    </div>
  );
}

export default async function DeploymentDetailPage({ params }: { params: { id: string } }) {
  if (!vercelConfigured()) {
    return (
      <div className="grid gap-5">
        <BackLink />
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_TOKEN</code> in this project&apos;s environment to view deployment details.
        </div>
      </div>
    );
  }

  const [detail, logs] = await Promise.all([
    getDeployment(params.id),
    getDeploymentLogs(params.id),
  ]);

  if (!detail.ok || !detail.deployment) {
    return (
      <div className="grid gap-5">
        <BackLink />
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          {detail.error ?? "Deployment not found."}
        </div>
      </div>
    );
  }

  const d = detail.deployment;
  const s = STATE_STYLE[d.state] ?? { bg: "#e5e7eb", fg: "#374151" };
  const isProd = d.target === "production";
  const tail = (logs.lines ?? []).slice(-40);

  return (
    <div className="grid gap-5">
      <div>
        <BackLink />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{d.message || d.name || "Deployment"}</h1>
          <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>
            {d.state}
          </span>
          {isProd && (
            <span className="rounded-md bg-[#bf502b] px-2 py-0.5 text-[11px] font-bold text-white">PROD</span>
          )}
        </div>
        <p className="mt-1 break-all text-sm text-[#6b6157]">Deployment {d.uid}</p>
      </div>

      <DeploymentActions uid={d.uid} name={d.name} target={d.target} state={d.state} />

      <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Target">{d.target ?? "preview"}</Field>
          <Field label="Project">{d.name || "—"}</Field>
          <Field label="Created by">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5 text-[#8a8073]" />
              {d.creator ?? "—"}
            </span>
          </Field>
          <Field label="Commit">
            {d.branch || d.commitSha ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                {d.branch && (
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="size-3.5 text-[#8a8073]" />
                    {d.branch}
                  </span>
                )}
                {d.commitSha && (
                  <span className="inline-flex items-center gap-1 text-[#6b6157]">
                    <GitCommit className="size-3.5 text-[#8a8073]" />
                    <code>{d.commitSha.slice(0, 7)}</code>
                  </span>
                )}
              </span>
            ) : (
              "—"
            )}
          </Field>
          <Field label="Commit message">{d.message ?? "—"}</Field>
          <Field label="Commit author">{d.commitAuthor ?? "—"}</Field>
          <Field label="Created">{d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"}</Field>
          <Field label="Ready">{d.ready ? new Date(d.ready).toLocaleString() : "—"}</Field>
          <Field label="Build duration">{d.buildMs != null ? fmtDuration(d.buildMs) : "—"}</Field>
          <Field label="URL">
            {d.url ? (
              <a
                href={`https://${d.url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#bf502b] hover:underline"
              >
                <ExternalLink className="size-3.5" /> {d.url}
              </a>
            ) : (
              "—"
            )}
          </Field>
          <Field label="Aliases">
            {d.aliases.length ? (
              <span className="grid gap-1">
                {d.aliases.map((a) => (
                  <a
                    key={a}
                    href={`https://${a}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#bf502b] hover:underline"
                  >
                    <ExternalLink className="size-3.5" /> {a}
                  </a>
                ))}
              </span>
            ) : (
              "—"
            )}
          </Field>
        </dl>
      </div>

      <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
        <div className="flex items-start gap-2">
          <History className="mt-0.5 size-4 shrink-0 text-[#bf502b]" />
          <div>
            <h2 className="text-sm font-bold">Rollback</h2>
            <p className="mt-0.5 text-sm text-[#6b6157]">
              {d.state === "READY"
                ? "Use “Rollback to this” above to make this build your live production deployment. It promotes this deployment to production (falling back to a redeploy when promotion is unavailable)."
                : "Only READY deployments can be rolled back to. Open a successful build to make it live again."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-1.5 text-sm font-bold">
            <ScrollText className="size-4 text-[#bf502b]" /> Build log tail
          </h2>
          <Link href={`/deploy/logs/${d.uid}`} className="text-xs font-semibold text-[#bf502b] hover:underline">
            View full logs
          </Link>
        </div>
        {tail.length === 0 ? (
          <p className="text-sm text-[#8a8073]">No log events available for this deployment.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e6ded2] bg-[#bf502b] p-4">
            <pre
              className="text-xs leading-relaxed text-[#e5e7eb]"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            >
              {tail.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap break-words">
                  {l.date && <span className="mr-2 text-[#f2d3c7]">{new Date(l.date).toLocaleTimeString()}</span>}
                  <span className={l.type === "stderr" ? "text-[#fca5a5]" : ""}>{l.text}</span>
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/deploy" className="inline-flex items-center gap-1.5 text-sm text-[#6b6157] hover:text-[#1c1a17]">
      <ArrowLeft className="size-4" /> Back to deployments
    </Link>
  );
}
