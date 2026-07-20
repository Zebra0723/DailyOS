import "server-only";

// Talks to the Vercel REST API. Needs VC_TOKEN; optionally VC_PROJECT_ID
// (limit to one project), VC_TEAM_ID (if the project is under a team),
// VC_TEAM_SLUG (for per-project deep links), and VC_DEPLOY_HOOK_URL
// (to trigger a redeploy via a Deploy Hook).

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

export interface EnvVar {
  id: string;
  key: string;
  value?: string;
  type: string; // encrypted | plain | secret | system | sensitive
  target: string[]; // production | preview | development
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  framework: string | null;
  updatedAt: number;
  latestProdState: string | null;
  link: string;
}

export interface Domain {
  name: string;
  verified: boolean;
  gitBranch: string | null;
  redirect: string | null;
}

export interface LogLine {
  text: string;
  date: number | null;
  type: string;
}

export interface DeploymentDetail {
  uid: string;
  name: string;
  url: string;
  state: string;
  target: string | null;
  createdAt: number;
  buildingAt: number | null;
  ready: number | null;
  creator: string | null;
  branch: string | null;
  commitSha: string | null;
  commitAuthor: string | null;
  message: string | null;
  aliases: string[];
  /** Build duration in ms (ready - buildingAt), when both are known. */
  buildMs: number | null;
}

export function vercelConfigured(): boolean {
  return Boolean(process.env.VC_TOKEN);
}
export function deployHookConfigured(): boolean {
  return Boolean(process.env.VC_DEPLOY_HOOK_URL);
}
export function projectConfigured(): boolean {
  return Boolean(process.env.VC_PROJECT_ID);
}

function teamQ(): string {
  return process.env.VC_TEAM_ID ? `&teamId=${process.env.VC_TEAM_ID}` : "";
}

/** Build a best-effort deep link into the real Vercel dashboard for a project. */
export function projectDashboardUrl(name: string): string {
  const slug = process.env.VC_TEAM_SLUG;
  return slug ? `https://vercel.com/${slug}/${name}` : `https://vercel.com/${name}`;
}

type Result<T> = { ok: boolean; data?: T; error?: string };

/** Generic authed Vercel request. `path` should already start with `?`'d query
 *  or end so that teamId can be appended with `&`. Returns {ok,error,data}. */
async function vc<T>(path: string, init?: RequestInit): Promise<Result<T>> {
  if (!process.env.VC_TOKEN) return { ok: false, error: "Set VC_TOKEN to use this feature." };
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.VC_TOKEN}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 300)}` };
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Deployments
// ---------------------------------------------------------------------------

export async function listDeployments(): Promise<{
  ok: boolean;
  deployments?: Deployment[];
  error?: string;
}> {
  const proj = process.env.VC_PROJECT_ID ? `&projectId=${process.env.VC_PROJECT_ID}` : "";
  const r = await vc<{ deployments?: Record<string, unknown>[] }>(
    `/v6/deployments?limit=20${proj}${teamQ()}`,
  );
  if (!r.ok) return { ok: false, error: r.error };
  const deployments: Deployment[] = (r.data?.deployments ?? []).map((d) => {
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

/** Cancel a deployment that is still building/queued. */
export async function cancelDeployment(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await vc(`/v12/deployments/${id}/cancel?${teamQ().slice(1)}`, { method: "PATCH" });
  return { ok: r.ok, error: r.error };
}

/** Promote an existing deployment to production. */
export async function promoteDeployment(id: string): Promise<{ ok: boolean; error?: string }> {
  const projectId = process.env.VC_PROJECT_ID;
  if (!projectId) return { ok: false, error: "Set VC_PROJECT_ID to promote deployments." };
  const r = await vc(`/v10/projects/${projectId}/promote/${id}?${teamQ().slice(1)}`, {
    method: "POST",
  });
  return { ok: r.ok, error: r.error };
}

/** Redeploy: create a new deployment from the given source deployment. */
export async function redeployDeployment(
  id: string,
  name: string,
  target: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const r = await vc(`/v13/deployments?forceNew=1${teamQ()}`, {
    method: "POST",
    body: JSON.stringify({
      name: name || "redeploy",
      deploymentId: id,
      target: target ?? undefined,
    }),
  });
  return { ok: r.ok, error: r.error };
}

/** Fetch build/runtime log lines for a deployment. */
export async function getDeploymentLogs(
  id: string,
): Promise<{ ok: boolean; lines?: LogLine[]; error?: string }> {
  const r = await vc<unknown>(`/v3/deployments/${id}/events?limit=1000${teamQ()}`);
  if (!r.ok) return { ok: false, error: r.error };
  const raw = r.data;
  const arr: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : ((raw as { events?: Record<string, unknown>[] })?.events ?? []);
  const lines: LogLine[] = arr.map((e) => {
    const payload = (e.payload ?? {}) as Record<string, unknown>;
    const text =
      (payload.text as string) ??
      (e.text as string) ??
      (typeof payload.info === "object" && payload.info
        ? JSON.stringify(payload.info)
        : "") ??
      "";
    return {
      text: String(text),
      date: Number(e.date ?? payload.date ?? 0) || null,
      type: String(e.type ?? "stdout"),
    };
  });
  return { ok: true, lines };
}

/** Fetch a single deployment with full metadata (GET /v13/deployments/{id}). */
export async function getDeployment(
  id: string,
): Promise<{ ok: boolean; deployment?: DeploymentDetail; error?: string }> {
  const r = await vc<Record<string, unknown>>(`/v13/deployments/${id}?${teamQ().slice(1)}`);
  if (!r.ok) return { ok: false, error: r.error };
  const d = r.data ?? {};
  const meta = (d.meta ?? {}) as Record<string, string>;
  const creatorObj = (d.creator ?? {}) as Record<string, unknown>;
  const aliasRaw = d.alias;
  const aliases = Array.isArray(aliasRaw) ? aliasRaw.map((a) => String(a)) : [];
  const buildingAt = Number(d.buildingAt ?? 0) || null;
  const ready = Number(d.ready ?? 0) || null;
  const deployment: DeploymentDetail = {
    uid: String(d.uid ?? d.id ?? id),
    name: String(d.name ?? ""),
    url: String(d.url ?? ""),
    state: String(d.readyState ?? d.state ?? d.status ?? "UNKNOWN"),
    target: (d.target as string) ?? null,
    createdAt: Number(d.createdAt ?? d.created ?? 0),
    buildingAt,
    ready,
    creator:
      (creatorObj.username as string) ?? (creatorObj.email as string) ?? null,
    branch: meta.githubCommitRef ?? null,
    commitSha: meta.githubCommitSha ?? null,
    commitAuthor: meta.githubCommitAuthorName ?? null,
    message: meta.githubCommitMessage ?? null,
    aliases,
    buildMs: buildingAt && ready && ready > buildingAt ? ready - buildingAt : null,
  };
  return { ok: true, deployment };
}

/** Roll production back to a previous deployment: promote it to production when
 *  VC_PROJECT_ID is set, otherwise redeploy it targeting production. */
export async function rollbackDeployment(
  id: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  if (process.env.VC_PROJECT_ID) {
    const r = await promoteDeployment(id);
    if (r.ok) return r;
    // Fall through to redeploy if promote is unavailable for this account.
  }
  return redeployDeployment(id, name, "production");
}

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------

function normalizeEnv(e: Record<string, unknown>): EnvVar {
  const t = e.target;
  const target = Array.isArray(t) ? (t as string[]) : t ? [String(t)] : [];
  return {
    id: String(e.id ?? ""),
    key: String(e.key ?? ""),
    value: e.value != null ? String(e.value) : undefined,
    type: String(e.type ?? "encrypted"),
    target,
    updatedAt: Number(e.updatedAt ?? e.createdAt ?? 0),
  };
}

export async function listEnv(): Promise<{ ok: boolean; envs?: EnvVar[]; error?: string }> {
  const projectId = process.env.VC_PROJECT_ID;
  if (!projectId) return { ok: false, error: "Set VC_PROJECT_ID to manage environment variables." };
  const r = await vc<{ envs?: Record<string, unknown>[] }>(
    `/v9/projects/${projectId}/env?${teamQ().slice(1)}`,
  );
  if (!r.ok) return { ok: false, error: r.error };
  const envs = (r.data?.envs ?? []).map(normalizeEnv).sort((a, b) => a.key.localeCompare(b.key));
  return { ok: true, envs };
}

export async function createEnv(input: {
  key: string;
  value: string;
  type: string;
  target: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const projectId = process.env.VC_PROJECT_ID;
  if (!projectId) return { ok: false, error: "Set VC_PROJECT_ID first." };
  if (!input.key.trim()) return { ok: false, error: "Key is required." };
  if (!input.target.length) return { ok: false, error: "Pick at least one target." };
  const r = await vc(`/v10/projects/${projectId}/env?${teamQ().slice(1)}`, {
    method: "POST",
    body: JSON.stringify({
      key: input.key.trim(),
      value: input.value,
      type: input.type,
      target: input.target,
    }),
  });
  return { ok: r.ok, error: r.error };
}

export async function updateEnv(
  envId: string,
  input: { value?: string; target?: string[]; type?: string },
): Promise<{ ok: boolean; error?: string }> {
  const projectId = process.env.VC_PROJECT_ID;
  if (!projectId) return { ok: false, error: "Set VC_PROJECT_ID first." };
  const body: Record<string, unknown> = {};
  if (input.value !== undefined) body.value = input.value;
  if (input.target !== undefined) body.target = input.target;
  if (input.type !== undefined) body.type = input.type;
  const r = await vc(`/v9/projects/${projectId}/env/${envId}?${teamQ().slice(1)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return { ok: r.ok, error: r.error };
}

export async function deleteEnv(envId: string): Promise<{ ok: boolean; error?: string }> {
  const projectId = process.env.VC_PROJECT_ID;
  if (!projectId) return { ok: false, error: "Set VC_PROJECT_ID first." };
  const r = await vc(`/v9/projects/${projectId}/env/${envId}?${teamQ().slice(1)}`, {
    method: "DELETE",
  });
  return { ok: r.ok, error: r.error };
}

/** Copy an env var's value from one target to another. Reuses create/update.
 *  Values are frequently write-only (encrypted/sensitive): when the source
 *  value is not returned by the API, `needsValue` is set so the caller can ask
 *  the operator to paste it. */
export async function copyEnvValue(input: {
  key: string;
  fromTarget: string;
  toTarget: string;
  value?: string;
}): Promise<{ ok: boolean; error?: string; needsValue?: boolean }> {
  const projectId = process.env.VC_PROJECT_ID;
  if (!projectId) return { ok: false, error: "Set VC_PROJECT_ID first." };
  if (input.fromTarget === input.toTarget)
    return { ok: false, error: "Source and destination targets must differ." };

  const list = await listEnv();
  if (!list.ok) return { ok: false, error: list.error };
  const envs = list.envs ?? [];

  const source = envs.find((e) => e.key === input.key && e.target.includes(input.fromTarget));
  if (!source) return { ok: false, error: `No "${input.key}" found on ${input.fromTarget}.` };

  const value = input.value != null && input.value !== "" ? input.value : source.value;
  if (value == null) {
    return {
      ok: false,
      needsValue: true,
      error: `"${input.key}" is write-only on Vercel — its value is not readable. Paste the value to copy it to ${input.toTarget}.`,
    };
  }

  const dest = envs.find((e) => e.key === input.key && e.target.includes(input.toTarget));
  if (dest) {
    return updateEnv(dest.id, { value });
  }
  return createEnv({ key: input.key, value, type: source.type, target: [input.toTarget] });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function listProjects(): Promise<{ ok: boolean; projects?: Project[]; error?: string }> {
  const r = await vc<{ projects?: Record<string, unknown>[] }>(`/v9/projects?limit=100${teamQ()}`);
  if (!r.ok) return { ok: false, error: r.error };
  const projects: Project[] = (r.data?.projects ?? []).map((p) => {
    const targets = (p.targets ?? {}) as Record<string, Record<string, unknown>>;
    const prod = targets.production;
    const name = String(p.name ?? "");
    return {
      id: String(p.id ?? ""),
      name,
      framework: (p.framework as string) ?? null,
      updatedAt: Number(p.updatedAt ?? 0),
      latestProdState: prod ? String(prod.readyState ?? prod.state ?? "") || null : null,
      link: projectDashboardUrl(name),
    };
  });
  projects.sort((a, b) => b.updatedAt - a.updatedAt);
  return { ok: true, projects };
}

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

export async function listDomains(): Promise<{ ok: boolean; domains?: Domain[]; error?: string }> {
  const projectId = process.env.VC_PROJECT_ID;
  if (!projectId) return { ok: false, error: "Set VC_PROJECT_ID to list domains." };
  const r = await vc<{ domains?: Record<string, unknown>[] }>(
    `/v9/projects/${projectId}/domains?${teamQ().slice(1)}`,
  );
  if (!r.ok) return { ok: false, error: r.error };
  const domains: Domain[] = (r.data?.domains ?? []).map((d) => ({
    name: String(d.name ?? ""),
    verified: Boolean(d.verified),
    gitBranch: (d.gitBranch as string) ?? null,
    redirect: (d.redirect as string) ?? null,
  }));
  return { ok: true, domains };
}
