import { listEnv, vercelConfigured, projectConfigured } from "@/lib/vercel";
import { EnvManager } from "@/components/env-manager";

export const dynamic = "force-dynamic";

export default async function EnvPage() {
  const configured = vercelConfigured() && projectConfigured();
  const res = configured ? await listEnv() : { ok: false, error: "config" as const };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Environment variables</h1>
        <p className="text-sm text-[#6b6157]">
          Manage the environment variables for this Vercel project.
        </p>
      </div>

      {!vercelConfigured() ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_TOKEN</code> in this project&apos;s environment.
        </div>
      ) : !projectConfigured() ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">
          Set <code>VC_PROJECT_ID</code> to manage a project&apos;s environment variables.
        </div>
      ) : !res.ok ? (
        <div className="rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-sm text-[#9a3412]">{res.error}</div>
      ) : (
        <EnvManager envs={res.envs ?? []} />
      )}
    </div>
  );
}
