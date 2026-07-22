import { CheckCircle2, XCircle } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchVersion, measureLatency, MAIN_APP_URL } from "@/lib/main";
import {
  card,
  HEALTH_TABLES,
  count,
  countPendingPush,
  countRecentFires,
  countUsers,
  readGlobal,
  remindersDueSoon,
  rel,
} from "@/lib/pulse-data";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatusReportButton } from "@/components/status-report-button";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const admin = createServiceClient();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [version, latency, userList, subs, pendingPush, recentFires, global, tableCounts, dueReminders] =
    await Promise.all([
      fetchVersion(),
      measureLatency(),
      countUsers(admin),
      count(admin, "push_subscriptions"),
      countPendingPush(admin),
      countRecentFires(admin, dayAgo),
      readGlobal(admin),
      Promise.all(HEALTH_TABLES.map((t) => count(admin, t))),
      remindersDueSoon(admin),
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

  // Plain-text status summary for the copy button.
  const reportLines = [
    `DailyOS Pulse — status report`,
    `Generated: ${new Date().toISOString()}`,
    `Target: ${MAIN_APP_URL}`,
    ``,
    `App version:     ${version ?? "unreachable"}`,
    `Response time:   ${latency.ms !== null ? `${latency.ms} ms` : "—"}`,
    `Database:        ${dbOk ? "reachable" : "unreachable"}`,
    `Maintenance:     ${global.maintenance ? "ON" : "off"}`,
    ``,
    `Users:           ${userList ?? "—"}`,
    `Push devices:    ${subs ?? "—"}`,
    `Scheduled push:  ${pendingPush ?? "—"}`,
    `Fired (24h):     ${recentFires ?? "—"}`,
    ``,
    `Table row counts:`,
    ...HEALTH_TABLES.map((t, i) => `  ${t.padEnd(20)} ${tableCounts[i] ?? "—"}`),
    ``,
    `Reminders due soon (${dueReminders?.length ?? "—"}):`,
    ...(dueReminders && dueReminders.length
      ? dueReminders.map((r) => `  • ${r.text} (${rel(r.iso)})`)
      : ["  (none)"]),
  ];
  const report = reportLines.join("\n");

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-[#6b6157]">Live health of DailyOS at {MAIN_APP_URL.replace(/^https?:\/\//, "")}.</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusReportButton report={report} />
          <AutoRefresh intervalSec={30} />
        </div>
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

      {/* Headline vitals */}
      <div className="grid grid-cols-3 gap-3">
        <div className={card}><div className="text-xl font-bold" style={{ color: "#bf502b" }}>{userList ?? "—"}</div><div className="text-xs text-[#6b6157]">Users</div></div>
        <div className={card}><div className="text-xl font-bold" style={{ color: "#bf502b" }}>{subs ?? "—"}</div><div className="text-xs text-[#6b6157]">Push devices</div></div>
        <div className={card}><div className="text-xl font-bold" style={{ color: "#bf502b" }}>{pendingPush ?? "—"}</div><div className="text-xs text-[#6b6157]">Scheduled</div></div>
      </div>
    </div>
  );
}
