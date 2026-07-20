import { CheckCircle2, AlertCircle, GitBranch, ArrowRight } from "lucide-react";
import { listDomains, vercelConfigured, projectConfigured } from "@/lib/vercel";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const configured = vercelConfigured() && projectConfigured();
  const res = configured ? await listDomains() : { ok: false, error: "config" as const };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Domains</h1>
        <p className="text-sm text-[#6b6157]">Domains attached to this Vercel project.</p>
      </div>

      {!vercelConfigured() ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_TOKEN</code> in this project&apos;s environment.
        </div>
      ) : !projectConfigured() ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_PROJECT_ID</code> to list a project&apos;s domains.
        </div>
      ) : !res.ok ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{res.error}</div>
      ) : (res.domains ?? []).length === 0 ? (
        <p className="text-sm text-[#8a8073]">No domains found.</p>
      ) : (
        <div className="grid gap-2">
          {res.domains!.map((d) => (
            <div key={d.name} className="rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://${d.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-[#bf502b] hover:underline"
                >
                  {d.name}
                </a>
                {d.verified ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#dcfce7] px-2 py-0.5 text-[11px] font-bold text-[#166534]">
                    <CheckCircle2 className="size-3" /> verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#92400e]">
                    <AlertCircle className="size-3" /> unverified
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#8a8073]">
                {d.gitBranch && (
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="size-3" /> {d.gitBranch}
                  </span>
                )}
                {d.redirect && (
                  <span className="inline-flex items-center gap-1">
                    <ArrowRight className="size-3" /> {d.redirect}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
