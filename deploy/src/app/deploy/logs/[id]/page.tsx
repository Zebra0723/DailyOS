import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDeploymentLogs, vercelConfigured } from "@/lib/vercel";

export const dynamic = "force-dynamic";

export default async function LogsPage({ params }: { params: { id: string } }) {
  const res = vercelConfigured()
    ? await getDeploymentLogs(params.id)
    : { ok: false, error: "config" as const };

  return (
    <div className="grid gap-5">
      <div>
        <Link href="/deploy/deployments" className="inline-flex items-center gap-1.5 text-sm text-[#6b6157] hover:text-[#1c1a17]">
          <ArrowLeft className="size-4" /> Back to deployments
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Build logs</h1>
        <p className="text-sm text-[#6b6157] break-all">Deployment {params.id}</p>
      </div>

      {!vercelConfigured() ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_TOKEN</code> in this project&apos;s environment to view logs.
        </div>
      ) : !res.ok ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{res.error}</div>
      ) : (res.lines ?? []).length === 0 ? (
        <p className="text-sm text-[#8a8073]">No log events available for this deployment.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e6ded2] bg-[#bf502b] p-4">
          <pre className="text-xs leading-relaxed text-[#e5e7eb]" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {res.lines!.map((l, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {l.date && <span className="mr-2 text-[#6b7280]">{new Date(l.date).toLocaleTimeString()}</span>}
                <span className={l.type === "stderr" ? "text-[#fca5a5]" : ""}>{l.text}</span>
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
