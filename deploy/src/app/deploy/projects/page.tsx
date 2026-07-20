import { ExternalLink } from "lucide-react";
import { listProjects, vercelConfigured } from "@/lib/vercel";

export const dynamic = "force-dynamic";

const STATE_STYLE: Record<string, { bg: string; fg: string }> = {
  READY: { bg: "#dcfce7", fg: "#166534" },
  ERROR: { bg: "#fbe9e7", fg: "#9a3412" },
  BUILDING: { bg: "#fef3c7", fg: "#92400e" },
  QUEUED: { bg: "#e5e7eb", fg: "#374151" },
  CANCELED: { bg: "#e5e7eb", fg: "#6b7280" },
  INITIALIZING: { bg: "#fef3c7", fg: "#92400e" },
};

export default async function ProjectsPage() {
  const res = vercelConfigured() ? await listProjects() : { ok: false, error: "config" as const };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-[#6b6157]">All Vercel projects in this account or team.</p>
      </div>

      {!vercelConfigured() ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_TOKEN</code> in this project&apos;s environment.
        </div>
      ) : !res.ok ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{res.error}</div>
      ) : (res.projects ?? []).length === 0 ? (
        <p className="text-sm text-[#8a8073]">No projects found.</p>
      ) : (
        <div className="grid gap-2">
          {res.projects!.map((p) => {
            const s = p.latestProdState ? STATE_STYLE[p.latestProdState] ?? { bg: "#e5e7eb", fg: "#374151" } : null;
            return (
              <a
                key={p.id}
                href={p.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#e6ded2] bg-[#fffdf9] p-3 transition-colors hover:bg-[#f3ede2]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#1c1a17]">{p.name}</span>
                  {s && (
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>
                      {p.latestProdState}
                    </span>
                  )}
                  <ExternalLink className="size-3.5 text-[#8a8073]" />
                  <span className="ml-auto text-xs text-[#8a8073]">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[#8a8073]">{p.framework ?? "no framework"}</div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
