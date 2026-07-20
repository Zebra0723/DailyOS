import { CheckCircle2, XCircle } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchVersion, cronConfigured, MAIN_APP_URL } from "@/lib/main";
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

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

export default async function PulsePage() {
  const admin = createServiceClient();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [version, userList, subs, pendingPush, recentFires, global] = await Promise.all([
    fetchVersion(),
    countUsers(admin),
    count(admin, "push_subscriptions"),
    countPendingPush(admin),
    countRecentFires(admin, dayAgo),
    readGlobal(admin),
  ]);

  const dbOk = subs !== null;

  const rows: { label: string; ok: boolean; value: string }[] = [
    { label: "App version", ok: !!version, value: version ?? "unreachable" },
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
        <div className={card}><div className="text-xl font-bold" style={{ color: "#e11d48" }}>{userList ?? "—"}</div><div className="text-xs text-[#6b6157]">Users</div></div>
        <div className={card}><div className="text-xl font-bold" style={{ color: "#e11d48" }}>{subs ?? "—"}</div><div className="text-xs text-[#6b6157]">Push devices</div></div>
        <div className={card}><div className="text-xl font-bold" style={{ color: "#e11d48" }}>{pendingPush ?? "—"}</div><div className="text-xs text-[#6b6157]">Scheduled</div></div>
      </div>

      <OpsControls
        initialAnnouncement={global.announcement ?? ""}
        initialMaintenance={!!global.maintenance}
        cronConfigured={cronConfigured()}
      />
    </div>
  );
}
