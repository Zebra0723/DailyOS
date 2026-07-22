import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type Admin = ReturnType<typeof createServiceClient>;

/** Shared card shell used across every Pulse section. */
export const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

/** Tables whose row counts summarise overall DB health. */
export const HEALTH_TABLES = [
  "app_config",
  "admin_reminders",
  "scheduled_pushes",
  "push_log",
  "feedback",
  "user_state",
  "push_subscriptions",
  "admin_audit",
] as const;

export async function count(admin: Admin, table: string): Promise<number | null> {
  try {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

export async function countPendingPush(admin: Admin): Promise<number | null> {
  try {
    const { count, error } = await admin.from("scheduled_pushes").select("*", { count: "exact", head: true }).eq("sent", false);
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

export async function countRecentFires(admin: Admin, sinceIso: string): Promise<number | null> {
  try {
    const { count, error } = await admin.from("push_log").select("*", { count: "exact", head: true }).gte("created_at", sinceIso);
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}

export async function countUsers(admin: Admin): Promise<number | null> {
  try {
    const r = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    return r.data?.users?.length ?? null;
  } catch {
    return null;
  }
}

export async function readGlobal(admin: Admin): Promise<{ announcement?: string; maintenance?: boolean }> {
  try {
    const { data } = await admin.from("app_config").select("value").eq("key", "global").maybeSingle();
    return (data?.value ?? {}) as { announcement?: string; maintenance?: boolean };
  } catch {
    return {};
  }
}

export type ActivityRow = { label: string; iso: string | null };

/** Last ~10 push_log rows, newest first. push_log has (user_id, dedupe_key, created_at). */
export async function recentActivity(admin: Admin): Promise<ActivityRow[] | null> {
  try {
    const { data, error } = await admin
      .from("push_log")
      .select("dedupe_key, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error || !data) return null;
    return data.map((r) => {
      const row = r as { dedupe_key?: string; user_id?: string; created_at?: string };
      return { label: row.dedupe_key || row.user_id || "push", iso: row.created_at ?? null };
    });
  } catch {
    return null;
  }
}

export type Bar = { label: string; count: number };

/** Build a 24-bucket hourly histogram of push_log rows over the last 24h,
 *  oldest bucket first. Returns null if push_log is unavailable. */
export async function activityHistogram(admin: Admin): Promise<Bar[] | null> {
  const HOURS = 24;
  const since = new Date(Date.now() - HOURS * 3_600_000);
  try {
    const { data, error } = await admin
      .from("push_log")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .limit(10_000);
    if (error || !data) return null;

    const bars: Bar[] = [];
    for (let i = HOURS - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 3_600_000);
      bars.push({ label: `${String(d.getHours()).padStart(2, "0")}h`, count: 0 });
    }
    const now = Date.now();
    for (const r of data as Array<{ created_at?: string }>) {
      if (!r.created_at) continue;
      const t = new Date(r.created_at).getTime();
      if (Number.isNaN(t)) continue;
      const hoursAgo = Math.floor((now - t) / 3_600_000);
      const idx = HOURS - 1 - hoursAgo;
      if (idx >= 0 && idx < HOURS) bars[idx].count += 1;
    }
    return bars;
  } catch {
    return null;
  }
}

export type Reminder = { text: string; iso: string | null };

/** Undone admin_reminders (base schema: text, done, created_at — no explicit due column).
 *  Try a due/scheduled column if the deployment added one; otherwise fall back to newest open items. */
export async function remindersDueSoon(admin: Admin): Promise<Reminder[] | null> {
  const soonIso = new Date(Date.now() + 86_400_000).toISOString();
  for (const col of ["due_at", "remind_at", "scheduled_at", "due"]) {
    try {
      const { data, error } = await admin
        .from("admin_reminders")
        .select(`text, ${col}`)
        .eq("done", false)
        .lte(col, soonIso)
        .order(col, { ascending: true })
        .limit(8);
      if (!error && data) {
        return (data as unknown as Array<Record<string, unknown>>).map((r) => ({
          text: String(r.text ?? "reminder"),
          iso: (r[col] as string | null) ?? null,
        }));
      }
    } catch {
      /* column not present — try next */
    }
  }
  // Fallback: open (undone) reminders, newest first.
  try {
    const { data, error } = await admin
      .from("admin_reminders")
      .select("text, created_at")
      .eq("done", false)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error || !data) return null;
    return data.map((r) => {
      const row = r as { text?: string; created_at?: string };
      return { text: row.text || "reminder", iso: row.created_at ?? null };
    });
  } catch {
    return null;
  }
}

export type Upcoming = { title: string; iso: string | null; audience: string };

/** Unsent scheduled_pushes ordered by send_at (title, send_at, audience). */
export async function upcomingPushes(admin: Admin): Promise<Upcoming[] | null> {
  try {
    const { data, error } = await admin
      .from("scheduled_pushes")
      .select("title, send_at, audience")
      .eq("sent", false)
      .order("send_at", { ascending: true })
      .limit(8);
    if (error || !data) return null;
    return data.map((r) => {
      const row = r as { title?: string; send_at?: string; audience?: string };
      return { title: row.title || "DailyOS", iso: row.send_at ?? null, audience: row.audience || "everyone" };
    });
  } catch {
    return null;
  }
}

/** Relative timestamp, e.g. "5m ago" / "in 3h". */
export function rel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const future = diff < 0;
  const s = Math.round(Math.abs(diff) / 1000);
  let unit: string;
  let n: number;
  if (s < 60) { n = s; unit = "s"; }
  else if (s < 3600) { n = Math.round(s / 60); unit = "m"; }
  else if (s < 86_400) { n = Math.round(s / 3600); unit = "h"; }
  else { n = Math.round(s / 86_400); unit = "d"; }
  return future ? `in ${n}${unit}` : `${n}${unit} ago`;
}
