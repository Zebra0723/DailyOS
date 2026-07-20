import "server-only";

// Talks to the Vercel REST API. Needs VC_TOKEN; optionally VC_PROJECT_ID
// (limit to one project), VC_TEAM_ID (if the project is under a team), and
// VC_DEPLOY_HOOK_URL (to trigger a redeploy).

const API = "https://api.vercel.com";

export interface Deployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  target: string | null;
  branch: string | null;
  message: string | null;
}

export function vercelConfigured(): boolean {
  return Boolean(process.env.VC_TOKEN);
}
export function deployHookConfigured(): boolean {
  return Boolean(process.env.VC_DEPLOY_HOOK_URL);
}

function teamQ(): string {
  return process.env.VC_TEAM_ID ? `&teamId=${process.env.VC_TEAM_ID}` : "";
}

export async function listDeployments(): Promise<{
  ok: boolean;
  deployments?: Deployment[];
  error?: string;
}> {
  if (!process.env.VC_TOKEN) return { ok: false, error: "Set VC_TOKEN." };
  const proj = process.env.VC_PROJECT_ID ? `&projectId=${process.env.VC_PROJECT_ID}` : "";
  try {
    const res = await fetch(`${API}/v6/deployments?limit=20${proj}${teamQ()}`, {
      headers: { Authorization: `Bearer ${process.env.VC_TOKEN}` },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 300)}` };
    const data = JSON.parse(text) as { deployments?: Record<string, unknown>[] };
    const deployments: Deployment[] = (data.deployments ?? []).map((d) => {
      const meta = (d.meta ?? {}) as Record<string, string>;
      return {
        uid: String(d.uid ?? ""),
        name: String(d.name ?? ""),
        url: String(d.url ?? ""),
        state: String(d.state ?? d.readyState ?? "UNKNOWN"),
        created: Number(d.created ?? d.createdAt ?? 0),
        target: (d.target as string) ?? null,
        branch: meta.githubCommitRef ?? null,
        message: meta.githubCommitMessage ?? null,
      };
    });
    return { ok: true, deployments };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function triggerDeploy(): Promise<{ ok: boolean; error?: string }> {
  const hook = process.env.VC_DEPLOY_HOOK_URL;
  if (!hook) {
    return {
      ok: false,
      error:
        "Set VC_DEPLOY_HOOK_URL — create a Deploy Hook in your Vercel project (Settings → Git → Deploy Hooks).",
    };
  }
  try {
    const res = await fetch(hook, { method: "POST" });
    return res.ok ? { ok: true } : { ok: false, error: `Hook returned ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
