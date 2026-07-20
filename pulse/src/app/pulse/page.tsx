import { CheckCircle2, XCircle, Activity, BellRing, Send, Database, Gauge } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchVersion, measureLatency, cronConfigured, MAIN_APP_URL } from "@/lib/main";
import { OpsControls } from "@/components/ops-controls";

export const dynamic = "force-dynamic";

type Admin = ReturnType<typeof createServiceClient>;
async function count(admin: Admin, table: string): Promise<number | null> {
  try {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}
async function countPendingPush(admin: Admin): Promise<number | null> {
  try {
    const { count, error } = await admin.from("scheduled_pushes").select("*", { count: "exact", head: true }).eq("sent", false);
    return error ? null : count ?? 0;
  } catch {
    return null;
  }
}
async function countRecentFires(admin: Admin, sinceIso: string): Promise<number | null> {
  try {
    const { count, error } = await admin.from("push_log").select("*", { count: "exact", head: true }).gte("created_at", sinceIso);
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

type ActivityRow = { label: string; iso: string | null };

/** Last ~10 push_log rows, newest first. push_log has (user_id, dedupe_key, created_at). */
async function recentActivity(admin: Admin): Promise<ActivityRow[] | null> {
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

type Reminder = { text: string; iso: string | null };

/** Undone admin_reminders (base schema: text, done, created_at — no explicit due column).
 *  Try a due/scheduled column if the deployment added one; otherwise fall back to newest open items. */
async function remindersDueSoon(admin: Admin): Promise<Reminder[] | null> {
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

type Upcoming = { title: string; iso: string | null; audience: string };

/** Unsent scheduled_pushes ordered by send_at (title, send_at, audience). */
async function upcomingPushes(admin: Admin): Promise<Upcoming[] | null> {
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
function rel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const future = diff < 0;
  let s = Math.round(Math.abs(diff) / 1000);
  let unit: string;
  let n: number;
  if (s < 60) { n = s; unit = "s"; }
  else if (s < 3600) { n = Math.round(s / 60); unit = "m"; }
  else if (s < 86_400) { n = Math.round(s / 3600); unit = "h"; }
  else { n = Math.round(s / 86_400); unit = "d"; }
  return future ? `in ${n}${unit}` : `${n}${unit} ago`;
}

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";
const HEALTH_TABLES = [
  "app_config",
  "admin_reminders",
  "scheduled_pushes",
  "push_log",
  "feedback",
  "user_state",
  "push_subscriptions",
  "admin_audit",
] as const;

export default async function PulsePage() {
  const admin = createServiceClient();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [version, latency, userList, subs, pendingPush, recentFires, global, tableCounts, activity, dueReminders, upcoming] =
    await Promise.all([
      fetchVersion(),
      measureLatency(),
      countUsers(admin),
      count(admin, "push_subscriptions"),
      countPendingPush(admin),
      countRecentFires(admin, dayAgo),
      readGlobal(admin),
      Promise.all(HEALTH_TABLES.map((t) => count(admin, t))),
      recentActivity(admin),
      remindersDueSoon(admin),
      upcomingPushes(admin),
    ]);

  const dbOk = subs !== null;
  const latencyOk = latency.ok && latency.ms !== null && latency.ms < 1500;

  const rows: { label: string; ok: boolean; value: string }[] = [
    { label: "App version", ok: !!version, value: version ?? "unreachable" },
    { label: "Response time", ok: latencyOk, value: latency.ms !== null ? `${latency.ms} ms` : "—" },
    { label: "Database", ok: dbOk, value: dbOk ? "reachable" : "unreachable" },
    { label: "Push devices", ok: (subs ?? 0) > 0, value: String(subs ?? "—") },
    { label: "Reminders fired (24h)", ok: (recentFires ?? 0) > 0, value: String(recentFires ?? "—") },
    { label: "Maintenance mode", ok: !global.maintenance, value: global.maintenance ? "ON" : "off" },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Status</h1>
        <p className="text-sm text-[#6b6157]">Live health of DailyOS at {MAIN_APP_URL.replace(/^https?:\/\//, "")}.</p>
      </div>

      {/* Status band */}
      <section className={card}>
        <div className="grid gap-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-sm">
              {r.ok ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <XCircle className="size-4 shrink-0 text-[#c0392b]" />}
              <span className="flex-1">{r.label}</span>
              <span className="font-medium text-[#4b443b]">{r.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick counts */}
      <div className="grid grid-cols-3 gap-3">
        <div className={card}><div className="text-xl font-bold" style={{ color: "#bf502b" }}>{userList ?? "—"}</div><div className="text-xs text-[#6b6157]">Users</div></div>
        <div className={card}><div className="text-xl font-bold" style={{ color: "#bf502b" }}>{subs ?? "—"}</div><div className="text-xs text-[#6b6157]">Push devices</div></div>
        <div className={card}><div className="text-xl font-bold" style={{ color: "#bf502b" }}>{pendingPush ?? "—"}</div><div className="text-xs text-[#6b6157]">Scheduled</div></div>
      </div>

      {/* Per-table row counts */}
      <section className={card}>
        <div className="flex items-center gap-2">
          <Database className="size-4" style={{ color: "#bf502b" }} />
          <h2 className="text-base font-bold">Table row counts</h2>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {HEALTH_TABLES.map((t, i) => (
            <div key={t} className="rounded-xl border border-[#e6ded2] bg-white p-3">
              <div className="text-lg font-bold" style={{ color: "#bf502b" }}>{tableCounts[i] ?? "—"}</div>
              <div className="truncate text-xs text-[#6b6157]" title={t}>{t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Reminders due soon + Upcoming pushes */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className={card}>
          <div className="flex items-center gap-2">
            <BellRing className="size-4" style={{ color: "#bf502b" }} />
            <h2 className="text-base font-bold">Reminders due soon</h2>
            <span className="ml-auto rounded-full bg-[#fce7ec] px-2 py-0.5 text-xs font-bold" style={{ color: "#bf502b" }}>
              {dueReminders?.length ?? "—"}
            </span>
          </div>
          {dueReminders === null ? (
            <p className="mt-3 text-sm text-[#8a8073]">—</p>
          ) : dueReminders.length === 0 ? (
            <p className="mt-3 text-sm text-[#8a8073]">No open reminders.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {dueReminders.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate" title={r.text}>{r.text}</span>
                  <span className="shrink-0 text-xs text-[#8a8073]">{rel(r.iso)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <div className="flex items-center gap-2">
            <Send className="size-4" style={{ color: "#bf502b" }} />
            <h2 className="text-base font-bold">Upcoming scheduled pushes</h2>
            <span className="ml-auto rounded-full bg-[#fce7ec] px-2 py-0.5 text-xs font-bold" style={{ color: "#bf502b" }}>
              {upcoming?.length ?? "—"}
            </span>
          </div>
          {upcoming === null ? (
            <p className="mt-3 text-sm text-[#8a8073]">—</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-[#8a8073]">Nothing scheduled.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {upcoming.map((u, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate font-medium text-[#4b443b]" title={u.title}>{u.title}</span>
                    <span className="shrink-0 text-xs text-[#8a8073]">{rel(u.iso)}</span>
                  </div>
                  <div className="truncate text-xs text-[#8a8073]">→ {u.audience}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section className={card}>
        <div className="flex items-center gap-2">
          <Activity className="size-4" style={{ color: "#bf502b" }} />
          <h2 className="text-base font-bold">Recent push activity</h2>
        </div>
        {activity === null ? (
          <p className="mt-3 text-sm text-[#8a8073]">—</p>
        ) : activity.length === 0 ? (
          <p className="mt-3 text-sm text-[#8a8073]">No recent pushes.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Gauge className="size-3.5 shrink-0 text-[#c9a3ac]" />
                <span className="flex-1 truncate font-mono text-xs text-[#4b443b]" title={a.label}>{a.label}</span>
                <span className="shrink-0 text-xs text-[#8a8073]">{rel(a.iso)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <OpsControls
        initialAnnouncement={global.announcement ?? ""}
        initialMaintenance={!!global.maintenance}
        cronConfigured={cronConfigured()}
      />
    </div>
  );
}
