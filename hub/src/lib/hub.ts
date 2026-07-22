import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// The live DailyOS app the whole operation revolves around.
export const MAIN_APP_URL =
  process.env.MAIN_APP_URL || "https://daily-os-lac.vercel.app";

type Admin = ReturnType<typeof createServiceClient>;

/** One sibling admin app: where it lives + how to reach it from the Hub. */
export interface AppLink {
  key: string;
  label: string;
  blurb: string;
  /** Wayfinding accent — matches the app's home-screen icon colour. */
  dot: string;
  /** Deep-link to the deployed app (set via env); "" when unconfigured. */
  url: string;
}

/** The five behind-the-scenes apps, each reachable via its own env URL. */
export function appLinks(): AppLink[] {
  return [
    { key: "base", label: "Base", blurb: "Supabase — tables, SQL, users, storage", dot: "#0d9488", url: process.env.HUB_BASE_URL || "" },
    { key: "deploy", label: "Deploy", blurb: "Vercel — deployments, env, domains, logs", dot: "#111827", url: process.env.HUB_DEPLOY_URL || "" },
    { key: "pulse", label: "Pulse", blurb: "Health & ops — status, cron, maintenance", dot: "#e11d48", url: process.env.HUB_PULSE_URL || "" },
    { key: "brain", label: "Brain", blurb: "AI — test, tune & instruct the assistant", dot: "#7c3aed", url: process.env.HUB_BRAIN_URL || "" },
    { key: "support", label: "Support", blurb: "Feedback inbox — triage user messages", dot: "#0284c7", url: process.env.HUB_SUPPORT_URL || "" },
  ];
}

export interface Platform {
  label: string;
  href: string;
  hint: string;
}

/** The real platforms behind DailyOS — one tap out to each. */
export function platforms(): Platform[] {
  const ref = process.env.SUPABASE_PROJECT_REF;
  return [
    { label: "DailyOS (live app)", href: MAIN_APP_URL, hint: "What your users see" },
    { label: "Supabase", href: ref ? `https://supabase.com/dashboard/project/${ref}` : "https://supabase.com/dashboard", hint: "Database & auth" },
    { label: "Vercel", href: "https://vercel.com/dashboard", hint: "Hosting & deploys" },
    { label: "Groq console", href: "https://console.groq.com", hint: "AI keys & usage" },
    { label: "Claude Code", href: "https://claude.ai/code", hint: "Build with your account" },
  ];
}

async function count(admin: Admin, table: string): Promise<number | null> {
  try {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

async function countEq(admin: Admin, table: string, col: string, val: unknown): Promise<number | null> {
  try {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true }).eq(col, val);
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

async function countUsers(admin: Admin): Promise<number | null> {
  try {
    const r = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return r.data?.users?.length ?? null;
  } catch {
    return null;
  }
}

async function readGlobal(admin: Admin): Promise<{ announcement?: string; maintenance?: boolean }> {
  try {
    const { data } = await admin.from("app_config").select("value").eq("key", "global").maybeSingle();
    return (data?.value ?? {}) as { announcement?: string; maintenance?: boolean };
  } catch {
    return {};
  }
}

/** Time a GET to the live app's /api/version — the headline health signal. */
async function versionAndLatency(): Promise<{ version: string | null; ms: number | null }> {
  const start = performance.now();
  try {
    const res = await fetch(`${MAIN_APP_URL}/api/version`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    const ms = Math.round(performance.now() - start);
    if (!res.ok) return { version: null, ms };
    const { version } = (await res.json()) as { version?: string };
    return { version: version ?? null, ms };
  } catch {
    return { version: null, ms: null };
  }
}

/** Reachability + latency for one configured app URL. */
export interface AppPing {
  ok: boolean;
  ms: number | null;
}

async function pingOne(url: string, timeoutMs = 4000): Promise<AppPing> {
  const start = performance.now();
  const opts = { cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(timeoutMs) } as const;
  try {
    // HEAD is cheapest; any HTTP response means the host is reachable.
    const res = await fetch(url, { method: "HEAD", ...opts });
    return { ok: res.status > 0, ms: Math.round(performance.now() - start) };
  } catch {
    // Some hosts reject HEAD — fall back to a lightweight GET before giving up.
    try {
      const res = await fetch(url, { method: "GET", ...opts });
      return { ok: res.status > 0, ms: Math.round(performance.now() - start) };
    } catch {
      return { ok: false, ms: null };
    }
  }
}

/** Ping every configured HUB_*_URL app in parallel; keyed by app key.
 *  Unconfigured apps are skipped and simply absent from the result. */
export async function pingApps(): Promise<Record<string, AppPing>> {
  const configured = appLinks().filter((a) => a.url);
  const results = await Promise.all(
    configured.map(async (a) => [a.key, await pingOne(a.url)] as const),
  );
  return Object.fromEntries(results);
}

/** The live announcement + maintenance flag from app_config `global`. */
export async function getGlobalConfig(): Promise<{ announcement: string; maintenance: boolean }> {
  const admin = createServiceClient();
  const g = await readGlobal(admin);
  return { announcement: g.announcement ?? "", maintenance: !!g.maintenance };
}

/** One entry in the cross-app activity timeline. */
export interface ActivityItem {
  source: "feedback" | "push" | "signup";
  /** ISO timestamp — everything is merged and sorted by this. */
  at: string;
  title: string;
  detail?: string;
}

/** Merge recent feedback, push fires and signups into one time-sorted feed.
 *  Each source is read independently — a failing source is simply skipped. */
export async function getActivity(perSource = 25): Promise<ActivityItem[]> {
  const admin = createServiceClient();
  const items: ActivityItem[] = [];

  // Recent user feedback (from `feedback`).
  try {
    const { data } = await admin
      .from("feedback")
      .select("email, message, resolved, created_at")
      .order("created_at", { ascending: false })
      .limit(perSource);
    for (const r of data ?? []) {
      const who = (r.email as string | null)?.trim() || "anonymous";
      const msg = ((r.message as string | null) ?? "").replace(/\s+/g, " ").trim();
      items.push({
        source: "feedback",
        at: r.created_at as string,
        title: `Feedback from ${who}${r.resolved ? "" : " · open"}`,
        detail: msg.length > 140 ? `${msg.slice(0, 140)}…` : msg,
      });
    }
  } catch {
    /* feedback unreadable — skip this source */
  }

  // Recent push fires (from `push_log`).
  try {
    const { data } = await admin
      .from("push_log")
      .select("user_id, dedupe_key, created_at")
      .order("created_at", { ascending: false })
      .limit(perSource);
    for (const r of data ?? []) {
      const uid = ((r.user_id as string | null) ?? "").slice(0, 8);
      items.push({
        source: "push",
        at: r.created_at as string,
        title: "Push sent",
        detail: `${r.dedupe_key as string}${uid ? ` · user ${uid}` : ""}`,
      });
    }
  } catch {
    /* push_log unreadable — skip this source */
  }

  // Recent signups (auth.admin.listUsers, newest first).
  try {
    const r = await admin.auth.admin.listUsers({ page: 1, perPage: perSource });
    const users = [...(r.data?.users ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    for (const u of users.slice(0, perSource)) {
      items.push({
        source: "signup",
        at: u.created_at,
        title: "New signup",
        detail: u.email ?? u.id.slice(0, 8),
      });
    }
  } catch {
    /* auth admin unreadable — skip this source */
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export interface HubStats {
  version: string | null;
  latencyMs: number | null;
  users: number | null;
  pushDevices: number | null;
  openFeedback: number | null;
  scheduledPending: number | null;
  maintenance: boolean;
  announcement: string;
}

/** Everything the Hub dashboard shows at a glance — one round of parallel reads. */
export async function getHubStats(): Promise<HubStats> {
  const admin = createServiceClient();
  const [vl, users, pushDevices, openFeedback, scheduledPending, global] = await Promise.all([
    versionAndLatency(),
    countUsers(admin),
    count(admin, "push_subscriptions"),
    countEq(admin, "feedback", "resolved", false),
    countEq(admin, "scheduled_pushes", "sent", false),
    readGlobal(admin),
  ]);
  return {
    version: vl.version,
    latencyMs: vl.ms,
    users,
    pushDevices,
    openFeedback,
    scheduledPending,
    maintenance: !!global.maintenance,
    announcement: global.announcement ?? "",
  };
}
